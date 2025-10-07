import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, description, type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const prompt = `Analyze this ticket and suggest the appropriate priority level (low, medium, high, or critical):

Title: ${title}
Description: ${description}
Type: ${type}

Respond with only one word: low, medium, high, or critical`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a ticket triage assistant. Analyze tickets and suggest priority levels." },
          { role: "user", content: prompt }
        ],
      }),
    });

    const data = await response.json();
    const suggestedPriority = data.choices[0].message.content.trim().toLowerCase();

    return new Response(
      JSON.stringify({ suggested_priority: suggestedPriority }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("AI triage error:", error);
    return new Response(
      JSON.stringify({ suggested_priority: "medium" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
