import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Tests for callGeminiAI() function from AI triage edge function
 * 
 * This function calls the Gemini AI API with a prompt and API key.
 * We test the API communication and error handling.
 */

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

// Replicate the callGeminiAI function for testing
async function callGeminiAI(prompt: string, apiKey: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

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
                max_tokens: 10,
                temperature: 0.3,
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

describe('callGeminiAI() - AI Triage Function', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Positive Tests', () => {
        it('TC40: should successfully call Gemini AI API with valid prompt and API key', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                json: async () => ({
                    choices: [
                        {
                            message: {
                                content: 'bug high'
                            }
                        }
                    ]
                })
            };

            mockFetch.mockResolvedValue(mockResponse);

            const prompt = 'Analyze this ticket: Bug in login system';
            const apiKey = 'AIzaSyTest123';

            const result = await callGeminiAI(prompt, apiKey);

            expect(result).toBe('bug high');
            expect(mockFetch).toHaveBeenCalledWith(
                'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    })
                })
            );
        });
    });

    describe('Negative Tests', () => {
        it('TC41: should throw error for invalid API key (401)', async () => {
            const mockResponse = {
                ok: false,
                status: 401,
                statusText: 'Unauthorized',
                json: async () => ({
                    error: { message: 'Invalid API key' }
                })
            };

            mockFetch.mockResolvedValue(mockResponse);

            const prompt = 'Test prompt';
            const apiKey = 'invalid_key';

            await expect(callGeminiAI(prompt, apiKey)).rejects.toThrow('Gemini AI API error: 401 Unauthorized');
        });

        it('TC42: should throw error for invalid response format', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                json: async () => ({
                    // Missing choices array
                    data: 'invalid'
                })
            };

            mockFetch.mockResolvedValue(mockResponse);

            const prompt = 'Test prompt';
            const apiKey = 'AIzaSyTest123';

            await expect(callGeminiAI(prompt, apiKey)).rejects.toThrow('Invalid response format from Gemini AI API');
        });
    });

    describe('Edge Tests', () => {
        it('TC43: should handle very long prompt within token limits', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                json: async () => ({
                    choices: [{ message: { content: 'question medium' } }]
                })
            };

            mockFetch.mockResolvedValue(mockResponse);

            const longPrompt = 'A'.repeat(5000);
            const apiKey = 'AIzaSyTest123';

            const result = await callGeminiAI(longPrompt, apiKey);

            expect(result).toBe('question medium');
        });

        it('TC44: should throw timeout error after 30 seconds', async () => {
            // Mock a delayed response that triggers abort
            mockFetch.mockImplementation(() => {
                return new Promise((_, reject) => {
                    setTimeout(() => {
                        const error = new Error('The operation was aborted');
                        (error as any).name = 'AbortError';
                        reject(error);
                    }, 100);
                });
            });

            const prompt = 'Test prompt';
            const apiKey = 'AIzaSyTest123';

            await expect(callGeminiAI(prompt, apiKey)).rejects.toThrow('Request timeout - AI service took too long to respond');
        });
    });

    describe('Error Tests', () => {
        it('TC45: should throw error when API rate limit is exceeded (429)', async () => {
            const mockResponse = {
                ok: false,
                status: 429,
                statusText: 'Too Many Requests',
                json: async () => ({
                    error: { message: 'Rate limit exceeded' }
                })
            };

            mockFetch.mockResolvedValue(mockResponse);

            const prompt = 'Test prompt';
            const apiKey = 'AIzaSyTest123';

            await expect(callGeminiAI(prompt, apiKey)).rejects.toThrow('Gemini AI API error: 429 Too Many Requests');
        });

        it('TC46: should throw error when API service is down (503)', async () => {
            const mockResponse = {
                ok: false,
                status: 503,
                statusText: 'Service Unavailable',
                json: async () => ({
                    error: { message: 'Service temporarily unavailable' }
                })
            };

            mockFetch.mockResolvedValue(mockResponse);

            const prompt = 'Test prompt';
            const apiKey = 'AIzaSyTest123';

            await expect(callGeminiAI(prompt, apiKey)).rejects.toThrow('Gemini AI API error: 503 Service Unavailable');
        });

        it('should throw error for server error (500)', async () => {
            const mockResponse = {
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                json: async () => ({
                    error: { message: 'Internal server error' }
                })
            };

            mockFetch.mockResolvedValue(mockResponse);

            const prompt = 'Test prompt';
            const apiKey = 'AIzaSyTest123';

            await expect(callGeminiAI(prompt, apiKey)).rejects.toThrow('Gemini AI API error: 500 Internal Server Error');
        });

        it('should throw error for network connection failure', async () => {
            mockFetch.mockRejectedValue(new Error('Network connection failed'));

            const prompt = 'Test prompt';
            const apiKey = 'AIzaSyTest123';

            await expect(callGeminiAI(prompt, apiKey)).rejects.toThrow('Network connection failed');
        });
    });
});
