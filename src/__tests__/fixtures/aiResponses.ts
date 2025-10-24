// Mock AI response scenarios for testing

export const mockAIResponses = {
    validResponse: {
        suggested_type: "bug",
        suggested_priority: "high",
        analysis: "This appears to be a critical bug that affects core functionality",
    },

    validResponseLowPriority: {
        suggested_type: "feature",
        suggested_priority: "low",
        analysis: "This is a feature request that can be implemented in future iterations",
    },

    invalidResponse: null,

    malformedResponse: {
        invalid_field: "test",
        missing_required: true,
    },

    timeoutResponse: new Error("Request timeout"),

    rateLimitResponse: new Error("Rate limit exceeded"),

    authErrorResponse: new Error("Invalid API key"),

    serviceUnavailableResponse: new Error("Service temporarily unavailable"),
}

export const mockPromptResponses = {
    standardPrompt: `Based on the following ticket information:
Title: Bug in login system
Description: Users cannot log in with valid credentials
Course: PRJ301
Class: SE1730

Please analyze and suggest appropriate type and priority.`,

    emptyPrompt: "",

    longPrompt: "A".repeat(5000), // Test token limits
}