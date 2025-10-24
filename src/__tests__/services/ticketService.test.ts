import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the Supabase client module with factory function
vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(),
        functions: {
            invoke: vi.fn()
        }
    }
}));

// Now import the service and mocked supabase
import { supabase as mockSupabase } from '@/integrations/supabase/client';
import { TicketFormData, TicketService } from '../../services/ticketService';
import { validTicketData } from '../fixtures/ticketData';

// Helper to create mock responses
const mockSupabaseResponse = {
    success: (data: any) => ({ data, error: null }),
    error: (message: string, code?: string) => ({
        data: null,
        error: { message, code: code || 'MOCK_ERROR' }
    })
};

describe('TicketService', () => {
    const mockUserId = 'test-user-123';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createTicket()', () => {
        describe('Positive Tests', () => {
            it('TC01: should create ticket with valid data and AI suggestions', async () => {
                // Mock AI triage response
                const mockAIResponse = {
                    suggested_priority: 'high' as const,
                    suggested_type: 'bug',
                    analysis: 'Critical bug detected'
                };
                mockSupabase.functions.invoke.mockResolvedValueOnce(
                    mockSupabaseResponse.success(mockAIResponse)
                );

                // Mock ticket creation
                const mockCreatedTicket = {
                    id: 'ticket-123',
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
                    single: vi.fn().mockResolvedValue(mockSupabaseResponse.success(mockCreatedTicket))
                };
                mockSupabase.from.mockReturnValue({
                    insert: vi.fn().mockReturnValue(mockQueryBuilder)
                });

                const result = await TicketService.createTicket(validTicketData, mockUserId);

                expect(result).toEqual(mockCreatedTicket);
                expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('ai-triage', {
                    body: {
                        title: validTicketData.title,
                        description: validTicketData.description,
                        type: validTicketData.type
                    }
                });
            });

            it('TC02: should create ticket successfully without AI suggestions', async () => {
                // Mock AI triage returning null
                mockSupabase.functions.invoke.mockResolvedValueOnce(
                    mockSupabaseResponse.success(null)
                );

                const mockCreatedTicket = {
                    id: 'ticket-456',
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
                    single: vi.fn().mockResolvedValue(mockSupabaseResponse.success(mockCreatedTicket))
                };
                mockSupabase.from.mockReturnValue({
                    insert: vi.fn().mockReturnValue(mockQueryBuilder)
                });

                const result = await TicketService.createTicket(validTicketData, mockUserId);

                expect(result).toEqual(mockCreatedTicket);
                expect(result.ai_suggested_priority).toBeNull();
            });
        });

        describe('Negative Tests', () => {
            it('TC03: should reject ticket with empty title', async () => {
                const invalidData = { ...validTicketData, title: '' };

                await expect(
                    TicketService.createTicket(invalidData, mockUserId)
                ).rejects.toThrow('Title is required');
            });

            it('TC04: should reject ticket with whitespace-only title', async () => {
                const invalidData = { ...validTicketData, title: '   ' };

                await expect(
                    TicketService.createTicket(invalidData, mockUserId)
                ).rejects.toThrow('Title is required');
            });

            it('TC05: should reject ticket with empty description', async () => {
                const invalidData = { ...validTicketData, description: '' };

                await expect(
                    TicketService.createTicket(invalidData, mockUserId)
                ).rejects.toThrow('Description is required');
            });

            it('TC06: should reject ticket with description too short', async () => {
                const invalidData = { ...validTicketData, description: 'short' };

                await expect(
                    TicketService.createTicket(invalidData, mockUserId)
                ).rejects.toThrow('Description must be at least 10 characters long');
            });
        });

        describe('Edge Tests', () => {
            it('TC07: should handle long title within boundaries', async () => {
                const longTitle = 'A'.repeat(100);
                const edgeData = { ...validTicketData, title: longTitle };

                mockSupabase.functions.invoke.mockResolvedValueOnce(
                    mockSupabaseResponse.success(null)
                );

                const mockCreatedTicket = {
                    id: 'ticket-789',
                    title: longTitle,
                    description: edgeData.description,
                    type: edgeData.type,
                    priority: edgeData.priority,
                    creator_id: mockUserId,
                    ai_suggested_priority: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                const mockQueryBuilder = {
                    select: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue(mockSupabaseResponse.success(mockCreatedTicket))
                };
                mockSupabase.from.mockReturnValue({
                    insert: vi.fn().mockReturnValue(mockQueryBuilder)
                });

                const result = await TicketService.createTicket(edgeData, mockUserId);

                expect(result.title).toBe(longTitle);
            });

            it('TC08: should handle long description within boundaries', async () => {
                const longDescription = 'A'.repeat(1000);
                const edgeData = { ...validTicketData, description: longDescription };

                mockSupabase.functions.invoke.mockResolvedValueOnce(
                    mockSupabaseResponse.success(null)
                );

                const mockCreatedTicket = {
                    id: 'ticket-101',
                    title: edgeData.title,
                    description: longDescription,
                    type: edgeData.type,
                    priority: edgeData.priority,
                    creator_id: mockUserId,
                    ai_suggested_priority: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                const mockQueryBuilder = {
                    select: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue(mockSupabaseResponse.success(mockCreatedTicket))
                };
                mockSupabase.from.mockReturnValue({
                    insert: vi.fn().mockReturnValue(mockQueryBuilder)
                });

                const result = await TicketService.createTicket(edgeData, mockUserId);

                expect(result.description).toBe(longDescription);
            });
        });

        describe('Error Tests', () => {
            it('TC09: should handle database connection failure', async () => {
                mockSupabase.functions.invoke.mockResolvedValueOnce(
                    mockSupabaseResponse.success(null)
                );

                const mockQueryBuilder = {
                    select: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue(
                        mockSupabaseResponse.error('Connection failed', 'CONNECTION_ERROR')
                    )
                };
                mockSupabase.from.mockReturnValue({
                    insert: vi.fn().mockReturnValue(mockQueryBuilder)
                });

                await expect(
                    TicketService.createTicket(validTicketData, mockUserId)
                ).rejects.toThrow('Connection failed');
            });

            it('TC10: should handle service unavailability', async () => {
                mockSupabase.functions.invoke.mockRejectedValueOnce(
                    new Error('Service unavailable')
                );

                const mockQueryBuilder = {
                    select: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue(
                        mockSupabaseResponse.error('Service unavailable', 'SERVICE_ERROR')
                    )
                };
                mockSupabase.from.mockReturnValue({
                    insert: vi.fn().mockReturnValue(mockQueryBuilder)
                });

                await expect(
                    TicketService.createTicket(validTicketData, mockUserId)
                ).rejects.toThrow();
            });
        });
    });

    describe('getAITriageSuggestions()', () => {
        describe('Positive Tests', () => {
            it('TC11: should return AI suggestions for valid input', async () => {
                const mockAIResponse = {
                    suggested_priority: 'high' as const,
                    suggested_type: 'bug',
                    analysis: 'This is a critical bug'
                };

                mockSupabase.functions.invoke.mockResolvedValueOnce(
                    mockSupabaseResponse.success(mockAIResponse)
                );

                const result = await TicketService.getAITriageSuggestions(validTicketData);

                expect(result).toEqual({
                    ...mockAIResponse,
                    suggestedPriority: 'high',
                    suggestedType: 'bug'
                });
                expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('ai-triage', {
                    body: {
                        title: validTicketData.title,
                        description: validTicketData.description,
                        type: validTicketData.type
                    }
                });
            });

            it('TC12: should normalize snake_case to camelCase in response', async () => {
                const mockAIResponse = {
                    suggested_priority: 'critical' as const,
                    suggested_type: 'feature',
                    suggested_assignee: 'user-123',
                    analysis: 'Feature request analysis'
                };

                mockSupabase.functions.invoke.mockResolvedValueOnce(
                    mockSupabaseResponse.success(mockAIResponse)
                );

                const result = await TicketService.getAITriageSuggestions(validTicketData);

                expect(result?.suggestedPriority).toBe('critical');
                expect(result?.suggestedType).toBe('feature');
                expect(result?.suggested_priority).toBe('critical');
                expect(result?.suggested_type).toBe('feature');
            });
        });

        describe('Negative Tests', () => {
            it('TC13: should return null for invalid AI response', async () => {
                mockSupabase.functions.invoke.mockResolvedValueOnce(
                    mockSupabaseResponse.error('Invalid request', 'INVALID_REQUEST')
                );

                const result = await TicketService.getAITriageSuggestions(validTicketData);

                expect(result).toBeNull();
            });
        });

        describe('Edge Tests', () => {
            it('TC14: should handle empty AI response data', async () => {
                mockSupabase.functions.invoke.mockResolvedValueOnce(
                    mockSupabaseResponse.success(null)
                );

                const result = await TicketService.getAITriageSuggestions(validTicketData);

                expect(result).toBeNull();
            });
        });

        describe('Error Tests', () => {
            it('TC15: should handle AI service timeout', async () => {
                mockSupabase.functions.invoke.mockRejectedValueOnce(
                    new Error('Request timeout')
                );

                const result = await TicketService.getAITriageSuggestions(validTicketData);

                expect(result).toBeNull();
            });

            it('TC16: should handle AI service rate limit', async () => {
                mockSupabase.functions.invoke.mockRejectedValueOnce(
                    new Error('Rate limit exceeded')
                );

                const result = await TicketService.getAITriageSuggestions(validTicketData);

                expect(result).toBeNull();
            });
        });
    });

    describe('validateTicketData()', () => {
        describe('Positive Tests', () => {
            it('TC17: should validate correct ticket data', () => {
                const result = TicketService.validateTicketData(validTicketData);

                expect(result.isValid).toBe(true);
                expect(result.errors).toHaveLength(0);
            });

            it('TC18: should validate ticket with all required fields', () => {
                const minimalData: TicketFormData = {
                    title: 'Valid title',
                    description: 'Valid description with enough characters',
                    type: 'task',
                    priority: 'low'
                };

                const result = TicketService.validateTicketData(minimalData);

                expect(result.isValid).toBe(true);
                expect(result.errors).toHaveLength(0);
            });
        });

        describe('Negative Tests', () => {
            it('TC19: should reject empty title', () => {
                const invalidData = { ...validTicketData, title: '' };

                const result = TicketService.validateTicketData(invalidData);

                expect(result.isValid).toBe(false);
                expect(result.errors).toContain('Title is required');
            });

            it('TC20: should reject empty description', () => {
                const invalidData = { ...validTicketData, description: '' };

                const result = TicketService.validateTicketData(invalidData);

                expect(result.isValid).toBe(false);
                expect(result.errors).toContain('Description is required');
            });

            it('TC21: should reject description shorter than 10 characters', () => {
                const invalidData = { ...validTicketData, description: 'short' };

                const result = TicketService.validateTicketData(invalidData);

                expect(result.isValid).toBe(false);
                expect(result.errors).toContain('Description must be at least 10 characters long');
            });

            it('TC22: should reject missing type', () => {
                const invalidData = { ...validTicketData, type: undefined as any };

                const result = TicketService.validateTicketData(invalidData);

                expect(result.isValid).toBe(false);
                expect(result.errors).toContain('Type is required');
            });

            it('TC23: should reject missing priority', () => {
                const invalidData = { ...validTicketData, priority: undefined as any };

                const result = TicketService.validateTicketData(invalidData);

                expect(result.isValid).toBe(false);
                expect(result.errors).toContain('Priority is required');
            });
        });

        describe('Edge Tests', () => {
            it('TC24: should trim whitespace from title and description', () => {
                const dataWithWhitespace: TicketFormData = {
                    title: '   Valid title   ',
                    description: '   Valid description with enough characters   ',
                    type: 'bug',
                    priority: 'medium'
                };

                const result = TicketService.validateTicketData(dataWithWhitespace);

                expect(result.isValid).toBe(true);
                expect(result.errors).toHaveLength(0);
            });

            it('TC25: should reject whitespace-only title', () => {
                const invalidData = { ...validTicketData, title: '   ' };

                const result = TicketService.validateTicketData(invalidData);

                expect(result.isValid).toBe(false);
                expect(result.errors).toContain('Title is required');
            });
        });
    });
});
