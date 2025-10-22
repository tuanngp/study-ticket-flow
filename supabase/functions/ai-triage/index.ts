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

// Supported type categories (extended set for education use-cases)
const SUPPORTED_TYPES = [
  'bug',
  'feature',
  'question',
  'task',
  // extended categories (may be normalized by client)
  'grading',
  'report',
  'config',
  'assignment',
  'exam',
  'submission',
  'technical',
  'academic',
] as const;
type TicketTypeCandidate = typeof SUPPORTED_TYPES[number];

// Validate and normalize a simple "type priority" response or single priority
function parseTypeAndPriority(response: string): { suggested_type: TicketTypeCandidate; suggested_priority: Priority } {
  const normalized = response.trim().toLowerCase().replace(/\s+/g, ' ');
  const parts = normalized.split(' ');

  // default fallbacks
  let typeCandidate: TicketTypeCandidate = 'question';
  let priorityCandidate: Priority = 'medium';

  // Try to detect priority first (whether one-word or two-word format)
  for (const p of VALID_PRIORITIES) {
    if (normalized.includes(p)) {
      priorityCandidate = p as Priority;
      break;
    }
  }

  // Try to detect a supported type token
  for (const t of SUPPORTED_TYPES) {
    if (normalized.includes(t)) {
      typeCandidate = t as TicketTypeCandidate;
      break;
    }
  }

  return { suggested_type: typeCandidate, suggested_priority: priorityCandidate };
}

// Create AI prompt
function createPrompt(data: TriageRequest): string {
  return `You are a ticket triage assistant for a university study management system.

Analyze this student ticket and suggest BOTH the ticket TYPE and PRIORITY.

TICKET DETAILS:
- Title: ${data.title}
- Description: ${data.description}

TYPE CATEGORIES (choose the single best):
- bug: Software errors, crashes, malfunctions
- feature: New functionality requests
- question: General questions or clarifications
- task: General tasks or requests
- grading: Grade disputes, scoring questions, grade appeals
- report: Academic reports, system issues, complaints
- config: Setup help, configuration issues, environment setup
- assignment: Assignment help, project guidance, homework support
- exam: Exam-related questions, test issues, exam preparation
- submission: File upload problems, submission errors, deadline issues
- technical: Technical difficulties, software setup, system problems
- academic: General academic support, course content questions

PRIORITY LEVELS (choose one):
- critical: System down, major deadline issues, blocking problems
- high: Important issues affecting learning, urgent assignments
- medium: Normal academic questions, standard support needs
- low: General questions, non-urgent requests

Respond with ONLY two lowercase words separated by a space in the format:
"<type> <priority>"

Examples: "grading high", "assignment medium", "technical critical", "question low"

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
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    const errorName = error && typeof error === 'object' && 'name' in error ? (error as any).name : '';
    if (errorName === 'AbortError') {
      throw new Error('Request timeout - AI service took too long to respond');
    }

    throw error instanceof Error ? error : new Error(String(error));
  }
}

serve(async (req: Request) => {
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Input validation error:', message);
      return new Response(
        JSON.stringify({
          error: 'Invalid input',
          details: message,
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
    const parsed = parseTypeAndPriority(aiResponse);

    console.log('AI triage completed:', parsed);

    return new Response(
      JSON.stringify({
        suggested_type: parsed.suggested_type,
        suggested_priority: parsed.suggested_priority,
        processed_at: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error: unknown) {
    console.error("AI triage error:", error);

    const message = error instanceof Error ? error.message : String(error);
    // Determine if it's a client error or server error
    const isClientError = message.includes('Invalid input') ||
                         message.includes('Method not allowed');

    return new Response(
      JSON.stringify({
        error: isClientError ? 'Invalid request' : 'AI service temporarily unavailable',
        details: (Deno.env.get('DENO_ENV') === 'development') ? message : undefined,
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
