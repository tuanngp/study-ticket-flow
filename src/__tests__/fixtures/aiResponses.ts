// Mock AI response scenarios for testing
import { AITriageResult } from '../../services/ticketService';

// Valid AI responses for positive tests (matching actual AI triage function format)
export const validAIResponses: Record<string, AITriageResult> = {
    bugHighPriority: {
        suggested_type: "bug",
        suggested_priority: "high",
        analysis: "This appears to be a critical bug that affects core functionality and blocks user workflow",
        suggestedType: "bug",
        suggestedPriority: "high",
    },

    featureLowPriority: {
        suggested_type: "feature",
        suggested_priority: "low",
        analysis: "This is a feature request that can be implemented in future iterations without affecting current functionality",
        suggestedType: "feature",
        suggestedPriority: "low",
    },

    questionMediumPriority: {
        suggested_type: "question",
        suggested_priority: "medium",
        analysis: "This is a valid question that requires clarification from the development team",
        suggestedType: "question",
        suggestedPriority: "medium",
    },

    taskCriticalPriority: {
        suggested_type: "task",
        suggested_priority: "critical",
        analysis: "This task is blocking other work and needs immediate attention",
        suggestedType: "task",
        suggestedPriority: "critical",
    },

    gradingHighPriority: {
        suggested_type: "grading",
        suggested_priority: "high",
        analysis: "Grade dispute requiring immediate attention",
        suggestedType: "grading",
        suggestedPriority: "high",
    },

    assignmentMediumPriority: {
        suggested_type: "assignment",
        suggested_priority: "medium",
        analysis: "Assignment help request with standard priority",
        suggestedType: "assignment",
        suggestedPriority: "medium",
    },
};

// Invalid and error AI responses for negative tests
export const invalidAIResponses = {
    nullResponse: null,

    undefinedResponse: undefined,

    emptyResponse: {},

    malformedResponse: {
        invalid_field: "test",
        missing_required: true,
        wrong_format: 123,
    },

    partialResponse: {
        suggested_type: "bug",
        // Missing suggested_priority and analysis
    },

    invalidTypeResponse: {
        suggested_type: "invalid_type",
        suggested_priority: "high",
        analysis: "Response with invalid type",
    },

    invalidPriorityResponse: {
        suggested_type: "bug",
        suggested_priority: "invalid_priority",
        analysis: "Response with invalid priority",
    },
};

// Error scenarios for AI service testing (matching actual error messages)
export const aiServiceErrors = {
    timeoutError: new Error("Request timeout - AI service took too long to respond"),
    rateLimitError: new Error("Gemini AI API error: 429 Too Many Requests"),
    authError: new Error("Gemini AI API error: 401 Unauthorized"),
    serviceUnavailableError: new Error("Gemini AI API error: 503 Service Unavailable"),
    networkError: new Error("Network connection failed"),
    invalidApiKeyError: new Error("Invalid API key or authentication failed"),
    invalidRequestError: new Error("Invalid request format"),
    serverError: new Error("Gemini AI API error: 500 Internal Server Error"),
    invalidResponseFormatError: new Error("Invalid response format from Gemini AI API"),
};

// Mock prompt generation scenarios
export const mockPromptScenarios = {
    standardPrompt: `Based on the following ticket information:
Title: Bug in login system
Description: Users cannot log in with valid credentials
Course: PRJ301
Class: SE1730
Project Group: Team 07

Please analyze and suggest appropriate type and priority.`,

    minimalPrompt: `Title: Simple bug
Description: Something is broken

Please analyze and suggest appropriate type and priority.`,

    educationalPrompt: `Based on the following ticket information:
Title: Grading issue with assignment submission
Description: My assignment was submitted on time but shows as late in the system
Course: PRJ301
Class: SE1730
Project Group: Team 07

Please analyze and suggest appropriate type and priority.`,

    emptyPrompt: "",

    longPrompt: `Title: ${"Very ".repeat(100)}long title
Description: ${"A".repeat(5000)}

Please analyze and suggest appropriate type and priority.`,

    specialCharsPrompt: `Title: Special chars: !@#$%^&*()
Description: Testing special characters: <script>alert('test')</script>

Please analyze and suggest appropriate type and priority.`,
};

// AI parsing test scenarios
export const aiParsingScenarios = {
    standardFormat: {
        input: `{
            "suggested_type": "bug",
            "suggested_priority": "high",
            "analysis": "Critical bug affecting login"
        }`,
        expected: {
            suggested_type: "bug",
            suggested_priority: "high",
            analysis: "Critical bug affecting login"
        }
    },

    fallbackFormat: {
        input: "Type: bug\nPriority: high\nAnalysis: Critical issue",
        expected: {
            suggested_type: "bug",
            suggested_priority: "high",
            analysis: "Critical issue"
        }
    },

    malformedJson: {
        input: `{
            "suggested_type": "bug",
            "suggested_priority": "high"
            // Missing closing brace and comma
        `,
        expected: null
    },

    emptyResponse: {
        input: "",
        expected: null
    },

    nonJsonResponse: {
        input: "This is not JSON format",
        expected: null
    },
};

// Comprehensive AI response test data
export const mockAITestData = {
    valid: validAIResponses,
    invalid: invalidAIResponses,
    errors: aiServiceErrors,
    prompts: mockPromptScenarios,
    parsing: aiParsingScenarios,
};

// Export for backward compatibility with existing mocks
export const mockAIResponses = {
    validResponse: validAIResponses.bugHighPriority,
    timeoutResponse: aiServiceErrors.timeoutError,
    rateLimitResponse: aiServiceErrors.rateLimitError,
    authErrorResponse: aiServiceErrors.authError,
    invalidResponse: invalidAIResponses.nullResponse,
};