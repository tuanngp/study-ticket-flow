import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Integration Tests for AI Triage Workflow
 * 
 * These tests verify the end-to-end AI triage integration scenarios,
 * including concurrent requests and environment configuration.
 * 
 * Requirements: 3.5, 4.3, 4.4
 */

// Mock the Supabase client
vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(),
        functions: {
            invoke: vi.fn()
        }
    }
}));

import { supabase as mockSupabase } from '@/integrations/supabase/client';
import { TicketService } from '@/services/ticketService';
import { validTicketData } from '../fixtures/ticketData';

describe('AI Triage Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Edge Tests - Concurrent Requests', () => {
        /**
         * TC47: Handle concurrent AI triage requests
         * Requirements: 3.5, 4.3
         */
        it('TC47: should handle multiple concurrent AI triage requests', async () => {
            // Mock AI triage responses with different results
            const mockResponses = [
                { suggested_type: 'bug', suggested_priority: 'high', analysis: 'Bug analysis' },
                { suggested_type: 'feature', suggested_priority: 'medium', analysis: 'Feature analysis' },
                { suggested_type: 'question', suggested_priority: 'low', analysis: 'Question analysis' }
            ];

            let callCount = 0;
            mockSupabase.functions.invoke.mockImplementation(() => {
                const response = mockResponses[callCount % mockResponses.length];
                callCount++;
                return Promise.resolve({ data: response, error: null });
            });

            // Create multiple concurrent requests
            const requests = [
                TicketService.getAITriageSuggestions({
                    ...validTicketData,
                    title: 'Bug in login system',
                    description: 'Users cannot authenticate properly'
                }),
                TicketService.getAITriageSuggestions({
                    ...validTicketData,
                    title: 'Add dark mode feature',
                    description: 'Would like to have a dark mode option'
                }),
                TicketService.getAITriageSuggestions({
                    ...validTicketData,
                    title: 'How to reset password',
                    description: 'Need help with password reset process'
                })
            ];

            // Execute all requests concurrently
            const results = await Promise.all(requests);

            // Verify all requests completed successfully
            expect(results).toHaveLength(3);
            expect(results[0]?.suggestedType).toBe('bug');
            expect(results[1]?.suggestedType).toBe('feature');
            expect(results[2]?.suggestedType).toBe('question');

            // Verify the function was called 3 times
            expect(mockSupabase.functions.invoke).toHaveBeenCalledTimes(3);
        });

        it('should handle concurrent requests with mixed success and failure', async () => {
            // Mock responses with some failures
            let callCount = 0;
            mockSupabase.functions.invoke.mockImplementation(() => {
                callCount++;
                if (callCount === 2) {
                    // Second request fails
                    return Promise.resolve({ data: null, error: { message: 'Service unavailable' } });
                }
                return Promise.resolve({
                    data: { suggested_type: 'bug', suggested_priority: 'high', analysis: 'Analysis' },
                    error: null
                });
            });

            // Create concurrent requests
            const requests = [
                TicketService.getAITriageSuggestions(validTicketData),
                TicketService.getAITriageSuggestions(validTicketData),
                TicketService.getAITriageSuggestions(validTicketData)
            ];

            const results = await Promise.all(requests);

            // Verify results: first and third succeed, second fails
            expect(results[0]).not.toBeNull();
            expect(results[1]).toBeNull();
            expect(results[2]).not.toBeNull();
        });
    });

    describe('Error Tests - Environment Configuration', () => {
        /**
         * TC48: Handle missing environment variables
         * Requirements: 3.5, 4.4
         */
        it('TC48: should handle missing GOOGLE_AI_API_KEY gracefully', async () => {
            // Mock response simulating missing API key error
            mockSupabase.functions.invoke.mockResolvedValue({
                data: null,
                error: {
                    message: 'AI service configuration error',
                    code: 'MISSING_API_KEY'
                }
            });

            const result = await TicketService.getAITriageSuggestions(validTicketData);

            // Should return null when environment is misconfigured
            expect(result).toBeNull();
            expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('ai-triage', {
                body: {
                    title: validTicketData.title,
                    description: validTicketData.description,
                    type: validTicketData.type
                }
            });
        });

        it('should handle invalid API key configuration', async () => {
            // Mock response for invalid API key
            mockSupabase.functions.invoke.mockResolvedValue({
                data: null,
                error: {
                    message: 'Invalid API key',
                    code: 'INVALID_API_KEY'
                }
            });

            const result = await TicketService.getAITriageSuggestions(validTicketData);

            expect(result).toBeNull();
        });
    });

    describe('End-to-End AI Triage Workflow', () => {
        it('should complete full ticket creation workflow with AI suggestions', async () => {
            const mockUserId = 'test-user-123';

            // Mock AI triage response
            mockSupabase.functions.invoke.mockResolvedValue({
                data: {
                    suggested_type: 'bug',
                    suggested_priority: 'high',
                    analysis: 'Critical bug detected'
                },
                error: null
            });

            // Mock ticket creation
            const mockCreatedTicket = {
                id: 'ticket-integration-1',
                title: validTicketData.title,
                description: validTicketData.description,
                type: validTicketData.type,
                priority: validTicketData.priority,
                creator_id: mockUserId,
                ai_suggested_priority: 'high',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const mockQueryBuilder = {
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockCreatedTicket, error: null })
            };
            mockSupabase.from.mockReturnValue({
                insert: vi.fn().mockReturnValue(mockQueryBuilder)
            });

            // Execute full workflow
            const ticket = await TicketService.createTicket(validTicketData, mockUserId);

            // Verify AI triage was called
            expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('ai-triage', {
                body: {
                    title: validTicketData.title,
                    description: validTicketData.description,
                    type: validTicketData.type
                }
            });

            // Verify ticket was created with AI suggestion
            expect(ticket).toEqual(mockCreatedTicket);
            expect(ticket.ai_suggested_priority).toBe('high');
        });

        it('should complete ticket creation workflow when AI service fails', async () => {
            const mockUserId = 'test-user-456';

            // Mock AI triage failure
            mockSupabase.functions.invoke.mockRejectedValue(
                new Error('AI service unavailable')
            );

            // Mock ticket creation (should still succeed)
            const mockCreatedTicket = {
                id: 'ticket-integration-2',
                title: validTicketData.title,
                description: validTicketData.description,
                type: validTicketData.type,
                priority: validTicketData.priority,
                creator_id: mockUserId,
                ai_suggested_priority: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const mockQueryBuilder = {
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockCreatedTicket, error: null })
            };
            mockSupabase.from.mockReturnValue({
                insert: vi.fn().mockReturnValue(mockQueryBuilder)
            });

            // Execute workflow - should not throw
            const ticket = await TicketService.createTicket(validTicketData, mockUserId);

            // Verify ticket was created without AI suggestion
            expect(ticket).toEqual(mockCreatedTicket);
            expect(ticket.ai_suggested_priority).toBeNull();
        });

        it('should handle complete workflow with validation, AI, and database operations', async () => {
            const mockUserId = 'test-user-789';

            // Step 1: Validate ticket data
            const validation = TicketService.validateTicketData(validTicketData);
            expect(validation.isValid).toBe(true);

            // Step 2: Get AI suggestions
            mockSupabase.functions.invoke.mockResolvedValue({
                data: {
                    suggested_type: 'feature',
                    suggested_priority: 'medium',
                    analysis: 'Feature request analysis'
                },
                error: null
            });

            const aiSuggestions = await TicketService.getAITriageSuggestions(validTicketData);
            expect(aiSuggestions).not.toBeNull();
            expect(aiSuggestions?.suggestedPriority).toBe('medium');

            // Step 3: Create ticket with AI suggestions
            const mockCreatedTicket = {
                id: 'ticket-integration-3',
                title: validTicketData.title,
                description: validTicketData.description,
                type: validTicketData.type,
                priority: validTicketData.priority,
                creator_id: mockUserId,
                ai_suggested_priority: 'medium',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const mockQueryBuilder = {
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockCreatedTicket, error: null })
            };
            mockSupabase.from.mockReturnValue({
                insert: vi.fn().mockReturnValue(mockQueryBuilder)
            });

            const ticket = await TicketService.createTicket(validTicketData, mockUserId);

            // Verify complete workflow
            expect(ticket.id).toBe('ticket-integration-3');
            expect(ticket.ai_suggested_priority).toBe('medium');
        });
    });
});
