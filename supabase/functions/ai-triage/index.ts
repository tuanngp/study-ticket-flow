// @ts-ignore - Deno import
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Deno type declarations
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation
interface TriageRequest {
  title: string;
  description: string;
  type: string;
}

// Valid priority levels
const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;
type Priority = typeof VALID_PRIORITIES[number];

// Validate input data
function validateInput(data: any): TriageRequest {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid request body');
  }

  const { title, description, type } = data;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    throw new Error('Title is required and must be a non-empty string');
  }

  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    throw new Error('Description is required and must be a non-empty string');
  }

  if (!type || typeof type !== 'string' || type.trim().length === 0) {
    throw new Error('Type is required and must be a non-empty string');
  }

  return {
    title: title.trim(),
    description: description.trim(),
    type: type.trim()
  };
}

// Validate and normalize priority response
function validatePriorityResponse(response: string): Priority {
  const normalized = response.trim().toLowerCase();

  if (VALID_PRIORITIES.includes(normalized as Priority)) {
    return normalized as Priority;
  }

  // Fallback: try to extract priority from longer response
  for (const priority of VALID_PRIORITIES) {
    if (normalized.includes(priority)) {
      return priority;
    }
  }

  // Default fallback
  return 'medium';
}

// Create AI prompt
function createPrompt(data: TriageRequest): string {
  return `You are a ticket triage assistant for a university study management system.

Analyze this student ticket and suggest the appropriate priority level based on urgency and impact:

TICKET DETAILS:
- Title: ${data.title}
- Description: ${data.description}
- Type: ${data.type}

PRIORITY GUIDELINES:
- critical: Immediate attention needed (system down, security issues, exam deadlines, urgent assignments)
- high: Important but not immediate (bug affecting many users, important deadlines approaching)
- medium: Standard priority (feature requests, general questions, non-urgent issues)
- low: Low impact (minor UI issues, documentation updates, nice-to-have features)

Respond with ONLY one word: low, medium, high, or critical.

Do not include any explanation or additional text.`;
}

async function callGeminiAI(prompt: string, apiKey: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.0-flash-exp",
        messages: [
          { role: "system", content: "You are a ticket triage assistant. Respond with only one priority word." },
          { role: "user", content: prompt }
        ],
        max_tokens: 10, // Limit response length
        temperature: 0.3, // Lower temperature for consistent results
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Gemini AI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from Gemini AI API');
    }

    return data.choices[0].message.content;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error('Request timeout - AI service took too long to respond');
    }

    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Parse and validate input
    let requestData: TriageRequest;
    try {
      const body = await req.json();
      requestData = validateInput(body);
    } catch (error) {
      console.error('Input validation error:', error.message);
      return new Response(
        JSON.stringify({
          error: 'Invalid input',
          details: error.message,
          suggested_priority: 'medium' // Fallback
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Get API key
    const geminiApiKey = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!geminiApiKey) {
      console.error('GOOGLE_AI_API_KEY environment variable not set');
      return new Response(
        JSON.stringify({
          error: 'AI service configuration error',
          suggested_priority: 'medium' // Fallback
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Create prompt and call AI
    const prompt = createPrompt(requestData);
    console.log('Processing ticket triage request:', {
      title: requestData.title.substring(0, 50) + '...',
      type: requestData.type
    });

    const aiResponse = await callGeminiAI(prompt, geminiApiKey);
    const suggestedPriority = validatePriorityResponse(aiResponse);

    console.log('AI triage completed:', { suggestedPriority });

    return new Response(
      JSON.stringify({
        suggested_priority: suggestedPriority,
        processed_at: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("AI triage error:", error);

    // Determine if it's a client error or server error
    const isClientError = error.message.includes('Invalid input') ||
                         error.message.includes('Method not allowed');

    return new Response(
      JSON.stringify({
        error: isClientError ? 'Invalid request' : 'AI service temporarily unavailable',
        details: process.env.DENO_ENV === 'development' ? error.message : undefined,
        suggested_priority: 'medium', // Always provide fallback priority
        processed_at: new Date().toISOString()
      }),
      {
        status: isClientError ? 400 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
