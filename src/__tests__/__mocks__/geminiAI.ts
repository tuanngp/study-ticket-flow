import { vi } from 'vitest'

/**
 * Mock Gemini AI API responses
 * Simulates the Gemini API endpoint behavior for testing
 */

// Mock fetch responses for different scenarios
export const mockGeminiAPIResponses = {
    // Success response - standard format
    success: {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({
            choices: [
                {
                    message: {
                        content: 'bug high'
                    }
                }
            ]
        })
    },

    // Success with different type/priority combinations
    successBugMedium: {
        ok: true,
        status: 200,
        json: async () => ({
            choices: [{ message: { content: 'bug medium' } }]
        })
    },

    successFeatureLow: {
        ok: true,
        status: 200,
        json: async () => ({
            choices: [{ message: { content: 'feature low' } }]
        })
    },

    successQuestionMedium: {
        ok: true,
        status: 200,
        json: async () => ({
            choices: [{ message: { content: 'question medium' } }]
        })
    },

    successGradingHigh: {
        ok: true,
        status: 200,
        json: async () => ({
            choices: [{ message: { content: 'grading high' } }]
        })
    },

    successAssignmentMedium: {
        ok: true,
        status: 200,
        json: async () => ({
            choices: [{ message: { content: 'assignment medium' } }]
        })
    },

    // Invalid response format - missing choices
    invalidMissingChoices: {
        ok: true,
        status: 200,
        json: async () => ({
            data: 'invalid structure'
        })
    },

    // Invalid response format - missing message
    invalidMissingMessage: {
        ok: true,
        status: 200,
        json: async () => ({
            choices: [{ text: 'wrong field' }]
        })
    },

    // Invalid response format - empty choices
    invalidEmptyChoices: {
        ok: true,
        status: 200,
        json: async () => ({
            choices: []
        })
    },

    // Malformed response content
    invalidContent: {
        ok: true,
        status: 200,
        json: async () => ({
            choices: [{ message: { content: 'invalid format without space' } }]
        })
    },

    // Authentication error - 401
    authError: {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({
            error: {
                message: 'Invalid API key',
                code: 401
            }
        })
    },

    // Rate limit error - 429
    rateLimitError: {
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({
            error: {
                message: 'Rate limit exceeded',
                code: 429
            }
        })
    },

    // Server error - 500
    serverError: {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({
            error: {
                message: 'Internal server error',
                code: 500
            }
        })
    },

    // Service unavailable - 503
    serviceUnavailable: {
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: async () => ({
            error: {
                message: 'Service temporarily unavailable',
                code: 503
            }
        })
    },
}

/**
 * Mock callGeminiAI function
 * Simulates the AI API call with configurable responses
 */
export const mockCallGeminiAI = vi.fn(async (prompt: string, apiKey: string): Promise<string> => {
    // Validate API key format
    if (!apiKey || apiKey.trim().length === 0) {
        throw new Error('Invalid API key or authentication failed')
    }

    // Validate prompt
    if (!prompt || prompt.trim().length === 0) {
        throw new Error('Invalid request format')
    }

    // Default success response
    return 'bug high'
})

/**
 * Mock fetch for Gemini API endpoint
 * Used to test the actual HTTP calls
 */
export const mockFetch = vi.fn(async (url: string, options?: any): Promise<any> => {
    // Validate URL
    if (!url.includes('generativelanguage.googleapis.com')) {
        throw new Error('Invalid API endpoint')
    }

    // Check for API key in headers
    const authHeader = options?.headers?.['Authorization']
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return mockGeminiAPIResponses.authError
    }

    // Default success response
    return mockGeminiAPIResponses.success
})

/**
 * Helper functions to configure mock responses
 */
export const mockGeminiAI = {
    // Set success response
    mockSuccess: (typeAndPriority: string = 'bug high') => {
        mockCallGeminiAI.mockResolvedValue(typeAndPriority)
        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                choices: [{ message: { content: typeAndPriority } }]
            })
        })
    },

    // Set timeout error
    mockTimeout: () => {
        const timeoutError = new Error('Request timeout - AI service took too long to respond')
        timeoutError.name = 'AbortError'
        mockCallGeminiAI.mockRejectedValue(timeoutError)
        mockFetch.mockImplementation(() =>
            new Promise((_, reject) => {
                setTimeout(() => reject(timeoutError), 100)
            })
        )
    },

    // Set rate limit error
    mockRateLimit: () => {
        mockCallGeminiAI.mockRejectedValue(new Error('Gemini AI API error: 429 Too Many Requests'))
        mockFetch.mockResolvedValue(mockGeminiAPIResponses.rateLimitError)
    },

    // Set authentication error
    mockAuthError: () => {
        mockCallGeminiAI.mockRejectedValue(new Error('Gemini AI API error: 401 Unauthorized'))
        mockFetch.mockResolvedValue(mockGeminiAPIResponses.authError)
    },

    // Set invalid API key
    mockInvalidApiKey: () => {
        mockCallGeminiAI.mockRejectedValue(new Error('Invalid API key or authentication failed'))
    },

    // Set invalid response format
    mockInvalidResponse: () => {
        mockCallGeminiAI.mockResolvedValue('invalid')
        mockFetch.mockResolvedValue(mockGeminiAPIResponses.invalidMissingChoices)
    },

    // Set server error
    mockServerError: () => {
        mockCallGeminiAI.mockRejectedValue(new Error('Gemini AI API error: 500 Internal Server Error'))
        mockFetch.mockResolvedValue(mockGeminiAPIResponses.serverError)
    },

    // Set service unavailable
    mockServiceUnavailable: () => {
        mockCallGeminiAI.mockRejectedValue(new Error('Gemini AI API error: 503 Service Unavailable'))
        mockFetch.mockResolvedValue(mockGeminiAPIResponses.serviceUnavailable)
    },

    // Set network error
    mockNetworkError: () => {
        mockCallGeminiAI.mockRejectedValue(new Error('Network connection failed'))
        mockFetch.mockRejectedValue(new Error('Network connection failed'))
    },

    // Set invalid request format
    mockInvalidRequest: () => {
        mockCallGeminiAI.mockRejectedValue(new Error('Invalid request format'))
    },

    // Reset all mocks to default state
    reset: () => {
        mockCallGeminiAI.mockReset()
        mockFetch.mockReset()
        mockGeminiAI.mockSuccess() // Set default success behavior
    },

    // Validate API key format (helper for tests)
    validateApiKey: (apiKey: string): boolean => {
        return apiKey && apiKey.trim().length > 0 && apiKey.startsWith('AIza')
    },

    // Validate request format (helper for tests)
    validateRequest: (prompt: string, apiKey: string): boolean => {
        return !!(prompt && prompt.trim().length > 0 && apiKey && apiKey.trim().length > 0)
    }
}

// Initialize with default success behavior
mockGeminiAI.mockSuccess()

export default mockGeminiAI