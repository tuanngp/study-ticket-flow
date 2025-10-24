import { vi } from 'vitest'
import { mockAIResponses } from '../fixtures/aiResponses'

// Mock Gemini AI service implementation
export const mockGeminiAI = {
    generateContent: vi.fn(() =>
        Promise.resolve({
            response: {
                text: () => JSON.stringify(mockAIResponses.validResponse),
            },
        })
    ),

    validateApiKey: vi.fn(() => true),

    // Mock different response scenarios
    mockSuccessResponse: () => {
        mockGeminiAI.generateContent.mockResolvedValue({
            response: {
                text: () => JSON.stringify(mockAIResponses.validResponse),
            },
        })
    },

    mockTimeoutError: () => {
        mockGeminiAI.generateContent.mockRejectedValue(mockAIResponses.timeoutResponse)
    },

    mockRateLimitError: () => {
        mockGeminiAI.generateContent.mockRejectedValue(mockAIResponses.rateLimitResponse)
    },

    mockAuthError: () => {
        mockGeminiAI.generateContent.mockRejectedValue(mockAIResponses.authErrorResponse)
    },

    mockInvalidResponse: () => {
        mockGeminiAI.generateContent.mockResolvedValue({
            response: {
                text: () => "invalid json response",
            },
        })
    },
}

// Mock GoogleGenerativeAI constructor
export const GoogleGenerativeAI = vi.fn(() => ({
    getGenerativeModel: vi.fn(() => mockGeminiAI),
}))

export default mockGeminiAI