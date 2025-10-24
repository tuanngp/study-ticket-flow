import { describe, expect, it } from 'vitest';

/**
 * Tests for parseTypeAndPriority() function from AI triage edge function
 * 
 * This function parses AI response and extracts ticket type and priority.
 * It includes fallback logic for invalid or incomplete responses.
 */

// Type definitions matching the edge function
const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;
type Priority = typeof VALID_PRIORITIES[number];

const SUPPORTED_TYPES = [
    'bug', 'feature', 'question', 'task',
    'grading', 'report', 'config', 'assignment',
    'exam', 'submission', 'technical', 'academic',
] as const;
type TicketTypeCandidate = typeof SUPPORTED_TYPES[number];

// Replicate the parseTypeAndPriority function for testing
function parseTypeAndPriority(response: string): { suggested_type: TicketTypeCandidate; suggested_priority: Priority } {
    const normalized = response.trim().toLowerCase().replace(/\s+/g, ' ');
    const parts = normalized.split(' ');

    // default fallbacks
    let typeCandidate: TicketTypeCandidate = 'question';
    let priorityCandidate: Priority = 'medium';

    // Try to detect priority first
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

describe('parseTypeAndPriority() - AI Triage Function', () => {
    describe('Positive Tests', () => {
        it('TC54: should parse standard "type priority" format - grading high', () => {
            const response = 'grading high';
            const result = parseTypeAndPriority(response);

            expect(result).toEqual({
                suggested_type: 'grading',
                suggested_priority: 'high'
            });
        });

        it('TC55: should parse case-insensitive format - technical critical', () => {
            const response = 'TECHNICAL CRITICAL';
            const result = parseTypeAndPriority(response);

            expect(result).toEqual({
                suggested_type: 'technical',
                suggested_priority: 'critical'
            });
        });

        it('should parse "bug high" format', () => {
            const response = 'bug high';
            const result = parseTypeAndPriority(response);

            expect(result).toEqual({
                suggested_type: 'bug',
                suggested_priority: 'high'
            });
        });

        it('should parse "assignment medium" format', () => {
            const response = 'assignment medium';
            const result = parseTypeAndPriority(response);

            expect(result).toEqual({
                suggested_type: 'assignment',
                suggested_priority: 'medium'
            });
        });

        it('should parse "question low" format', () => {
            const response = 'question low';
            const result = parseTypeAndPriority(response);

            expect(result).toEqual({
                suggested_type: 'question',
                suggested_priority: 'low'
            });
        });
    });

    describe('Edge Tests - Fallback Logic', () => {
        it('TC56: should use fallback type "question" for unknown type', () => {
            const response = 'unknown_type medium';
            const result = parseTypeAndPriority(response);

            expect(result).toEqual({
                suggested_type: 'question',
                suggested_priority: 'medium'
            });
        });

        it('TC57: should use default type "question" when only priority is provided', () => {
            const response = 'high';
            const result = parseTypeAndPriority(response);

            expect(result).toEqual({
                suggested_type: 'question',
                suggested_priority: 'high'
            });
        });

        it('TC58: should use default priority "medium" when only type is provided', () => {
            const response = 'bug';
            const result = parseTypeAndPriority(response);

            expect(result).toEqual({
                suggested_type: 'bug',
                suggested_priority: 'medium'
            });
        });

        it('TC59: should use default fallbacks for empty response', () => {
            const response = '';
            const result = parseTypeAndPriority(response);

            expect(result).toEqual({
                suggested_type: 'question',
                suggested_priority: 'medium'
            });
        });

        it('should handle extra whitespace', () => {
            const response = '  bug    high  ';
            const result = parseTypeAndPriority(response);

            expect(result).toEqual({
                suggested_type: 'bug',
                suggested_priority: 'high'
            });
        });

        it('should handle multiple spaces between words', () => {
            const response = 'grading     critical';
            const result = parseTypeAndPriority(response);

            expect(result).toEqual({
                suggested_type: 'grading',
                suggested_priority: 'critical'
            });
        });
    });

    describe('Negative Tests - Invalid Responses', () => {
        it('TC60: should use fallbacks for completely invalid response', () => {
            const response = 'invalid response format';
            const result = parseTypeAndPriority(response);

            expect(result).toEqual({
                suggested_type: 'question',
                suggested_priority: 'medium'
            });
        });

        it('TC61: should use fallbacks for gibberish response', () => {
            const response = 'asdfghjkl qwertyuiop';
            const result = parseTypeAndPriority(response);

            expect(result).toEqual({
                suggested_type: 'question',
                suggested_priority: 'medium'
            });
        });

        it('should handle numeric response', () => {
            const response = '123 456';
            const result = parseTypeAndPriority(response);

            expect(result).toEqual({
                suggested_type: 'question',
                suggested_priority: 'medium'
            });
        });

        it('should handle special characters', () => {
            const response = '!@#$ %^&*';
            const result = parseTypeAndPriority(response);

            expect(result).toEqual({
                suggested_type: 'question',
                suggested_priority: 'medium'
            });
        });
    });

    describe('All Supported Types', () => {
        it('should correctly parse all supported types', () => {
            const types: TicketTypeCandidate[] = [
                'bug', 'feature', 'question', 'task',
                'grading', 'report', 'config', 'assignment',
                'exam', 'submission', 'technical', 'academic'
            ];

            types.forEach(type => {
                const response = `${type} high`;
                const result = parseTypeAndPriority(response);
                expect(result.suggested_type).toBe(type);
                expect(result.suggested_priority).toBe('high');
            });
        });
    });

    describe('All Priority Levels', () => {
        it('should correctly parse all priority levels', () => {
            const priorities: Priority[] = ['low', 'medium', 'high', 'critical'];

            priorities.forEach(priority => {
                const response = `bug ${priority}`;
                const result = parseTypeAndPriority(response);
                expect(result.suggested_type).toBe('bug');
                expect(result.suggested_priority).toBe(priority);
            });
        });
    });

    describe('Mixed Case and Format Variations', () => {
        it('should handle mixed case', () => {
            const response = 'BuG HiGh';
            const result = parseTypeAndPriority(response);

            expect(result).toEqual({
                suggested_type: 'bug',
                suggested_priority: 'high'
            });
        });

        it('should handle reversed order (priority type)', () => {
            const response = 'high bug';
            const result = parseTypeAndPriority(response);

            // Should still detect both
            expect(result.suggested_type).toBe('bug');
            expect(result.suggested_priority).toBe('high');
        });

        it('should handle response with extra words', () => {
            const response = 'the bug is high priority';
            const result = parseTypeAndPriority(response);

            expect(result.suggested_type).toBe('bug');
            expect(result.suggested_priority).toBe('high');
        });
    });
});
