import { describe, expect, it } from 'vitest';

/**
 * Tests for validateInput() function from AI triage edge function
 * 
 * This function validates input data for AI triage requests.
 * Since it's a Deno edge function, we test the validation logic directly.
 */

// Type definitions matching the edge function
interface TriageRequest {
    title: string;
    description: string;
    type: string;
}

// Replicate the validateInput function for testing
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

describe('validateInput() - AI Triage Function', () => {
    describe('Positive Tests', () => {
        it('TC33: should validate and return valid triage request', () => {
            const validData = {
                title: 'Bug in login system',
                description: 'Users cannot authenticate with valid credentials',
                type: 'bug'
            };

            const result = validateInput(validData);

            expect(result).toEqual({
                title: 'Bug in login system',
                description: 'Users cannot authenticate with valid credentials',
                type: 'bug'
            });
        });
    });

    describe('Negative Tests', () => {
        it('TC34: should throw error when title is missing', () => {
            const invalidData = {
                description: 'Valid description',
                type: 'bug'
            };

            expect(() => validateInput(invalidData)).toThrow('Title is required and must be a non-empty string');
        });

        it('TC35: should throw error when description is missing', () => {
            const invalidData = {
                title: 'Valid title',
                type: 'bug'
            };

            expect(() => validateInput(invalidData)).toThrow('Description is required and must be a non-empty string');
        });

        it('TC36: should throw error when type is missing', () => {
            const invalidData = {
                title: 'Valid title',
                description: 'Valid description'
            };

            expect(() => validateInput(invalidData)).toThrow('Type is required and must be a non-empty string');
        });

        it('TC37: should throw error when title is not a string', () => {
            const invalidData = {
                title: 123,
                description: 'Valid description',
                type: 'bug'
            };

            expect(() => validateInput(invalidData)).toThrow('Title is required and must be a non-empty string');
        });
    });

    describe('Edge Tests', () => {
        it('TC38: should throw error when title contains only whitespace', () => {
            const edgeData = {
                title: '   ',
                description: 'Valid description',
                type: 'bug'
            };

            expect(() => validateInput(edgeData)).toThrow('Title is required and must be a non-empty string');
        });

        it('TC39: should handle very long title and description within limits', () => {
            const longTitle = 'A'.repeat(200);
            const longDescription = 'B'.repeat(1000);

            const edgeData = {
                title: longTitle,
                description: longDescription,
                type: 'bug'
            };

            const result = validateInput(edgeData);

            expect(result.title).toBe(longTitle);
            expect(result.description).toBe(longDescription);
            expect(result.type).toBe('bug');
        });

        it('should trim whitespace from all fields', () => {
            const dataWithWhitespace = {
                title: '  Bug in system  ',
                description: '  Description with spaces  ',
                type: '  bug  '
            };

            const result = validateInput(dataWithWhitespace);

            expect(result.title).toBe('Bug in system');
            expect(result.description).toBe('Description with spaces');
            expect(result.type).toBe('bug');
        });

        it('should throw error for null input', () => {
            expect(() => validateInput(null)).toThrow('Invalid request body');
        });

        it('should throw error for non-object input', () => {
            expect(() => validateInput('string')).toThrow('Invalid request body');
        });
    });
});
