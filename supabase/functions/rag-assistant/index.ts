// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY")!;
const GEMINI_MODEL = "gemini-2.0-flash-exp";
const EMBEDDING_MODEL = "models/text-embedding-004";

interface RAGRequest {
  query: string;
  sessionId?: string;
  userId?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { query, sessionId, userId }: RAGRequest = await req.json();

    if (!query || !query.trim()) {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Check rate limit
    if (userId) {
      const { data: canProceed, error: rateLimitError } = await supabase.rpc(
        "check_rate_limit",
        {
          p_user_id: userId,
          p_max_requests: 20,
          p_window_minutes: 60,
        }
      );

      if (rateLimitError) {
        console.error("Rate limit check error:", rateLimitError);
      }

      if (canProceed === false) {
        return new Response(
          JSON.stringify({
            error:
              "Bạn đã vượt quá giới hạn số lần hỏi. Vui lòng thử lại sau 1 giờ.",
            code: "RATE_LIMIT_EXCEEDED",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // 2. Generate embedding for user query
    const embeddingRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${EMBEDDING_MODEL}:embedContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify({
          model: EMBEDDING_MODEL,
          content: { parts: [{ text: query }] },
        }),
      }
    );

    if (!embeddingRes.ok) {
      const embeddingError = await embeddingRes.json();
      console.error("Embedding error:", embeddingError);
      throw new Error("Failed to generate query embedding");
    }

    const embeddingData = await embeddingRes.json();
    const queryEmbedding = embeddingData.embedding.values;

    // 3. Search for relevant documents using pgvector
    const { data: matches, error: searchError } = await supabase.rpc(
      "match_documents",
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.6,
        match_count: 5,
      }
    );

    if (searchError) {
      console.error("Document search error:", searchError);
      return new Response(
        JSON.stringify({ error: "Failed to search documents" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 4. Build context from retrieved documents
    const hasRelevantContext = matches && matches.length > 0;
    const context = hasRelevantContext
      ? matches
          .map((doc: any) => `[${doc.title}]\n${doc.content}`)
          .join("\n\n---\n\n")
      : "Không có tài liệu liên quan được tìm thấy.";

    // 5. Get conversation history (last 5 messages)
    let history: any[] = [];
    if (sessionId) {
      const { data: historyData } = await supabase
        .from("chat_messages")
        .select("role, content")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true })
        .limit(5);

      history = historyData || [];
    }

    // 6. Build Gemini prompt with system instructions
    const systemPrompt = `Bạn là AI Learning Assistant của FPT University, thuộc hệ thống EduTicket AI.
Nhiệm vụ của bạn là trả lời câu hỏi của sinh viên dựa HOÀN TOÀN trên nội dung trong phần "Context" bên dưới.

NGUYÊN TẮC QUAN TRỌNG:
- CHỈ sử dụng thông tin từ Context được cung cấp
- KHÔNG tự suy luận hoặc thêm thông tin ngoài Context
- Nếu Context không có thông tin phù hợp, hãy trả lời: "Xin lỗi, tôi chưa có thông tin về vấn đề này trong tài liệu hiện có. Bạn có thể tạo ticket để được hỗ trợ trực tiếp từ giảng viên hoặc trợ giảng."
- Trả lời bằng tiếng Việt, rõ ràng và thân thiện
- Nếu có mã code trong Context, hãy giải thích chi tiết
- Trích dẫn tên tài liệu khi trả lời để sinh viên biết nguồn thông tin

Context:
${context}`;

    // 7. Call Gemini API for chat completion
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: systemPrompt }] },
            ...history.map((msg: any) => ({
              role: msg.role === "assistant" ? "model" : "user",
              parts: [{ text: msg.content }],
            })),
            { role: "user", parts: [{ text: query }] },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1024,
            topP: 0.8,
            topK: 40,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const geminiError = await geminiRes.json();
      console.error("Gemini API error:", geminiError);
      throw new Error("Failed to generate response");
    }

    const geminiData = await geminiRes.json();

    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      throw new Error("No response generated");
    }

    const response = geminiData.candidates[0].content.parts[0].text;

    // 8. Save conversation to database
    if (sessionId && userId) {
      const messagesToInsert = [
        {
          session_id: sessionId,
          role: "user",
          content: query,
          metadata: {},
        },
        {
          session_id: sessionId,
          role: "assistant",
          content: response,
          metadata: {
            sources:
              matches?.map((m: any) => ({
                title: m.title,
                similarity: m.similarity,
              })) || [],
            has_context: hasRelevantContext,
          },
        },
      ];

      const { error: insertError } = await supabase
        .from("chat_messages")
        .insert(messagesToInsert);

      if (insertError) {
        console.error("Failed to save messages:", insertError);
      }

      // Update session timestamp
      await supabase
        .from("chat_sessions")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", sessionId);
    }

    // 9. Return response with sources
    return new Response(
      JSON.stringify({
        response,
        sources:
          matches?.map((m: any) => ({
            title: m.title,
            similarity: Math.round(m.similarity * 100) / 100,
          })) || [],
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("RAG Assistant error:", error);
    return new Response(
      JSON.stringify({
        error: "Đã có lỗi xảy ra. Vui lòng thử lại sau.",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
