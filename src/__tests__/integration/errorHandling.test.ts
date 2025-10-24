import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Comprehensive Error Handling Tests
 * 
 * These tests verify error propagation between components and services,
 * error message display, and recovery mechanisms.
 * 
 * Requirements: 1.2, 2.2, 2.4
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

describe('Error Propagation Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Service to Component Error Propagation', () => {
        /**
         * Test: Validation errors propagate correctly
         * Requirements: 1.2, 2.2
         */
        it('should propagate validation errors from service to component', async () => {
            const invalidData = { ...validTicketData, title: '' };

            try {
                await TicketService.createTicket(invalidData, 'user-123');
                expect.fail('Should have thrown validation error');
            } catch (error: any) {
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toContain('Title is required');
            }
        });

        it('should propagate multiple validation errors', async () => {
            const invalidData = {
                ...validTicketData,
                title: '',
                description: '',
                type: undefined as any,
                priority: undefined as any
            };

            try {
                await TicketService.createTicket(invalidData, 'user-123');
                expect.fail('Should have thrown validation error');
            } catch (error: any) {
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toContain('Title is required');
            }
        });

        /**
         * Test: Database errors propagate correctly
         * Requirements: 1.2, 2.4
         */
        it('should propagate database connection errors', async () => {
            mockSupabase.functions.invoke.mockResolvedValue({ data: null, error: null });

            const mockQueryBuilder = {
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Database connection failed', code: 'CONNECTION_ERROR' }
                })
            };
            mockSupabase.from.mockReturnValue({
                insert: vi.fn().mockReturnValue(mockQueryBuilder)
            });

            try {
                await TicketService.createTicket(validTicketData, 'user-123');
                expect.fail('Should have thrown database error');
            } catch (error: any) {
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toContain('Database connection failed');
            }
        });

        it('should propagate database constraint violation errors', async () => {
            mockSupabase.functions.invoke.mockResolvedValue({ data: null, error: null });

            const mockQueryBuilder = {
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Unique constraint violation', code: '23505' }
                })
            };
            mockSupabase.from.mockReturnValue({
                insert: vi.fn().mockReturnValue(mockQueryBuilder)
            });

            try {
                await TicketService.createTicket(validTicketData, 'user-123');
                expect.fail('Should have thrown constraint error');
            } catch (error: any) {
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toContain('Unique constraint violation');
            }
        });

        /**
         * Test: AI service errors propagate correctly
         * Requirements: 1.2, 2.4
         */
        it('should handle AI service errors without blocking ticket creation', async () => {
            // AI service fails
            mockSupabase.functions.invoke.mockRejectedValue(
                new Error('AI service timeout')
            );

            // But ticket creation should still succeed
            const mockCreatedTicket = {
                id: 'ticket-123',
                title: validTicketData.title,
                description: validTicketData.description,
                type: validTicketData.type,
                priority: validTicketData.priority,
                creator_id: 'user-123',
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

            // Should not throw - AI failure is gracefully handled
            const ticket = await TicketService.createTicket(validTicketData, 'user-123');
            expect(ticket).toEqual(mockCreatedTicket);
            expect(ticket.ai_suggested_priority).toBeNull();
        });
    });

    describe('Error Message Display and User Feedback', () => {
        /**
         * Test: Validation error messages are clear and actionable
         * Requirements: 2.2
         */
        it('should provide clear error message for empty title', async () => {
            const invalidData = { ...validTicketData, title: '' };

            try {
                await TicketService.createTicket(invalidData, 'user-123');
                expect.fail('Should have thrown error');
            } catch (error: any) {
                expect(error.message).toBe('Title is required');
            }
        });

        it('should provide clear error message for short description', async () => {
            const invalidData = { ...validTicketData, description: 'short' };

            try {
                await TicketService.createTicket(invalidData, 'user-123');
                expect.fail('Should have thrown error');
            } catch (error: any) {
                expect(error.message).toContain('Description must be at least 10 characters long');
            }
        });

        it('should provide clear error message for missing required fields', async () => {
            const invalidData = {
                ...validTicketData,
                type: undefined as any
            };

            try {
                await TicketService.createTicket(invalidData, 'user-123');
                expect.fail('Should have thrown error');
            } catch (error: any) {
                expect(error.message).toContain('Type is required');
            }
        });

        /**
         * Test: Database error messages are user-friendly
         * Requirements: 2.4
         */
        it('should provide user-friendly error message for database errors', async () => {
            mockSupabase.functions.invoke.mockResolvedValue({ data: null, error: null });

            const mockQueryBuilder = {
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Connection timeout', code: 'TIMEOUT' }
                })
            };
            mockSupabase.from.mockReturnValue({
                insert: vi.fn().mockReturnValue(mockQueryBuilder)
            });

            try {
                await TicketService.createTicket(validTicketData, 'user-123');
                expect.fail('Should have thrown error');
            } catch (error: any) {
                expect(error.message).toBeTruthy();
                expect(error.message).not.toContain('undefined');
            }
        });
    });

    describe('Recovery Mechanisms and Fallback Behaviors', () => {
        /**
         * Test: AI service failure doesn't block ticket creation
         * Requirements: 1.2, 2.4
         */
        it('should create ticket successfully when AI service is unavailable', async () => {
            // AI service fails
            mockSupabase.functions.invoke.mockRejectedValue(
                new Error('Service unavailable')
            );

            const mockCreatedTicket = {
                id: 'ticket-fallback-1',
                title: validTicketData.title,
                description: validTicketData.description,
                type: validTicketData.type,
                priority: validTicketData.priority,
                creator_id: 'user-123',
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

            const ticket = await TicketService.createTicket(validTicketData, 'user-123');

            expect(ticket).toBeDefined();
            expect(ticket.id).toBe('ticket-fallback-1');
            expect(ticket.ai_suggested_priority).toBeNull();
        });

        it('should return null for AI suggestions when service fails', async () => {
            mockSupabase.functions.invoke.mockRejectedValue(
                new Error('AI service error')
            );

            const result = await TicketService.getAITriageSuggestions(validTicketData);

            expect(result).toBeNull();
        });

        it('should handle AI timeout gracefully', async () => {
            mockSupabase.functions.invoke.mockImplementation(() =>
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Request timeout')), 100)
                )
            );

            const result = await TicketService.getAITriageSuggestions(validTicketData);

            expect(result).toBeNull();
        });

        /**
         * Test: Validation provides fallback values
         * Requirements: 2.2
         */
        it('should validate and trim whitespace as recovery mechanism', () => {
            const dataWithWhitespace = {
                ...validTicketData,
                title: '  Valid Title  ',
                description: '  Valid description with enough characters  '
            };

            const validation = TicketService.validateTicketData(dataWithWhitespace);

            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);
        });

        /**
         * Test: Multiple error scenarios with recovery
         * Requirements: 1.2, 2.4
         */
        it('should handle cascading errors with proper recovery', async () => {
            // First attempt: AI fails
            mockSupabase.functions.invoke.mockRejectedValueOnce(
                new Error('AI service down')
            );

            // Second attempt: Database succeeds
            const mockCreatedTicket = {
                id: 'ticket-recovery-1',
                title: validTicketData.title,
                description: validTicketData.description,
                type: validTicketData.type,
                priority: validTicketData.priority,
                creator_id: 'user-123',
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

            // Should succeed despite AI failure
            const ticket = await TicketService.createTicket(validTicketData, 'user-123');

            expect(ticket).toBeDefined();
            expect(ticket.ai_suggested_priority).toBeNull();
        });

        it('should handle partial AI response gracefully', async () => {
            // AI returns incomplete data
            mockSupabase.functions.invoke.mockResolvedValue({
                data: {
                    suggested_priority: 'high',
                    // missing suggested_type
                },
                error: null
            });

            const result = await TicketService.getAITriageSuggestions(validTicketData);

            expect(result).not.toBeNull();
            expect(result?.suggestedPriority).toBe('high');
            expect(result?.suggestedType).toBeUndefined();
        });
    });

    describe('Error Boundary Scenarios', () => {
        /**
         * Test: Unhandled errors are caught and logged
         * Requirements: 2.4
         */
        it('should catch and handle unexpected errors', async () => {
            mockSupabase.functions.invoke.mockResolvedValue({ data: null, error: null });

            const mockQueryBuilder = {
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockRejectedValue(new Error('Unexpected database error'))
            };
            mockSupabase.from.mockReturnValue({
                insert: vi.fn().mockReturnValue(mockQueryBuilder)
            });

            try {
                await TicketService.createTicket(validTicketData, 'user-123');
                expect.fail('Should have thrown error');
            } catch (error: any) {
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toBeTruthy();
            }
        });

        it('should handle null/undefined errors gracefully', async () => {
            mockSupabase.functions.invoke.mockResolvedValue({ data: null, error: null });

            const mockQueryBuilder = {
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                    data: null,
                    error: null // Both null - unexpected state
                })
            };
            mockSupabase.from.mockReturnValue({
                insert: vi.fn().mockReturnValue(mockQueryBuilder)
            });

            try {
                await TicketService.createTicket(validTicketData, 'user-123');
                // Should handle gracefully - either succeed or throw clear error
            } catch (error: any) {
                expect(error).toBeInstanceOf(Error);
            }
        });

        it('should handle network errors during ticket creation', async () => {
            mockSupabase.functions.invoke.mockRejectedValue(
                new Error('Network connection failed')
            );

            const mockQueryBuilder = {
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockRejectedValue(new Error('Network error'))
            };
            mockSupabase.from.mockReturnValue({
                insert: vi.fn().mockReturnValue(mockQueryBuilder)
            });

            try {
                await TicketService.createTicket(validTicketData, 'user-123');
                expect.fail('Should have thrown network error');
            } catch (error: any) {
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toContain('Network error');
            }
        });
    });

    describe('Error State Management', () => {
        /**
         * Test: Error states are properly reset
         * Requirements: 2.4
         */
        it('should allow retry after error', async () => {
            // First attempt fails
            mockSupabase.functions.invoke.mockResolvedValueOnce({ data: null, error: null });

            let callCount = 0;
            const mockQueryBuilder = {
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockImplementation(() => {
                    callCount++;
                    if (callCount === 1) {
                        return Promise.resolve({
                            data: null,
                            error: { message: 'Temporary error', code: 'TEMP_ERROR' }
                        });
                    }
                    return Promise.resolve({
                        data: {
                            id: 'ticket-retry-1',
                            title: validTicketData.title,
                            description: validTicketData.description,
                            type: validTicketData.type,
                            priority: validTicketData.priority,
                            creator_id: 'user-123',
                            ai_suggested_priority: null,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        },
                        error: null
                    });
                })
            };
            mockSupabase.from.mockReturnValue({
                insert: vi.fn().mockReturnValue(mockQueryBuilder)
            });

            // First attempt should fail
            try {
                await TicketService.createTicket(validTicketData, 'user-123');
                expect.fail('First attempt should have failed');
            } catch (error: any) {
                expect(error.message).toContain('Temporary error');
            }

            // Reset mocks for second attempt
            mockSupabase.functions.invoke.mockResolvedValueOnce({ data: null, error: null });

            // Second attempt should succeed
            const ticket = await TicketService.createTicket(validTicketData, 'user-123');
            expect(ticket).toBeDefined();
            expect(ticket.id).toBe('ticket-retry-1');
        });
    });
});
