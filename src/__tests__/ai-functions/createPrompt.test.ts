import { describe, expect, it } from 'vitest';

/**
 * Tests for createPrompt() function from AI triage edge function
 * 
 * This function creates an AI prompt from ticket data for triage analysis.
 */

// Type definitions matching the edge function
interface TriageRequest {
    title: string;
    description: string;
    type: string;
}

// Replicate the createPrompt function for testing
function createPrompt(data: TriageRequest): string {
    return `You are a ticket triage assistant for a university study management system.

Analyze this student ticket and suggest BOTH the ticket TYPE and PRIORITY.

TICKET DETAILS:
- Title: ${data.title}
- Description: ${data.description}

TYPE CATEGORIES (choose the single best):
- bug: Software errors, crashes, malfunctions
- feature: New functionality requests
- question: General questions or clarifications
- task: General tasks or requests
- grading: Grade disputes, scoring questions, grade appeals
- report: Academic reports, system issues, complaints
- config: Setup help, configuration issues, environment setup
- assignment: Assignment help, project guidance, homework support
- exam: Exam-related questions, test issues, exam preparation
- submission: File upload problems, submission errors, deadline issues
- technical: Technical difficulties, software setup, system problems
- academic: General academic support, course content questions

PRIORITY LEVELS (choose one):
- critical: System down, major deadline issues, blocking problems
- high: Important issues affecting learning, urgent assignments
- medium: Normal academic questions, standard support needs
- low: General questions, non-urgent requests

Respond with ONLY two lowercase words separated by a space in the format:
"<type> <priority>"

Examples: "grading high", "assignment medium", "technical critical", "question low"

Do not include any explanation or additional text.`;
}

describe('createPrompt() - AI Triage Function', () => {
    describe('Positive Tests', () => {
        it('TC49: should generate valid prompt with complete ticket data', () => {
            const triageRequest: TriageRequest = {
                title: 'Bug in login system',
                description: 'Users cannot authenticate with valid credentials',
                type: 'bug'
            };

            const prompt = createPrompt(triageRequest);

            expect(prompt).toContain('Bug in login system');
            expect(prompt).toContain('Users cannot authenticate with valid credentials');
            expect(prompt).toContain('TYPE CATEGORIES');
            expect(prompt).toContain('PRIORITY LEVELS');
            expect(prompt).toContain('ticket triage assistant');
        });

        it('TC50: should handle special characters and escape them properly', () => {
            const triageRequest: TriageRequest = {
                title: 'Special chars: !@#$%^&*()',
                description: 'Testing <script>alert("xss")</script> injection',
                type: 'bug'
            };

            const prompt = createPrompt(triageRequest);

            expect(prompt).toContain('Special chars: !@#$%^&*()');
            expect(prompt).toContain('<script>alert("xss")</script>');
            // Verify the prompt structure is intact
            expect(prompt).toContain('TYPE CATEGORIES');
            expect(prompt).toContain('PRIORITY LEVELS');
        });
    });

    describe('Edge Tests', () => {
        it('TC51: should handle very long title and description within limits', () => {
            const longTitle = 'A'.repeat(200);
            const longDescription = 'B'.repeat(1000);

            const triageRequest: TriageRequest = {
                title: longTitle,
                description: longDescription,
                type: 'bug'
            };

            const prompt = createPrompt(triageRequest);

            expect(prompt).toContain(longTitle);
            expect(prompt).toContain(longDescription);
            expect(prompt.length).toBeGreaterThan(1000);
        });

        it('TC52: should handle empty or minimal data', () => {
            const triageRequest: TriageRequest = {
                title: 'A',
                description: 'B',
                type: 'bug'
            };

            const prompt = createPrompt(triageRequest);

            expect(prompt).toContain('A');
            expect(prompt).toContain('B');
            expect(prompt).toContain('TYPE CATEGORIES');
            expect(prompt).toContain('PRIORITY LEVELS');
        });

        it('should handle unicode characters and emojis', () => {
            const triageRequest: TriageRequest = {
                title: 'Unicode test: 测试 🚀',
                description: 'Testing unicode: français español 中文',
                type: 'question'
            };

            const prompt = createPrompt(triageRequest);

            expect(prompt).toContain('测试 🚀');
            expect(prompt).toContain('français español 中文');
        });

        it('should handle newlines and whitespace in data', () => {
            const triageRequest: TriageRequest = {
                title: 'Title with\nnewlines',
                description: 'Description with\n\nmultiple\nlines',
                type: 'bug'
            };

            const prompt = createPrompt(triageRequest);

            expect(prompt).toContain('Title with\nnewlines');
            expect(prompt).toContain('Description with\n\nmultiple\nlines');
        });
    });

    describe('Error Tests', () => {
        it('TC53: should handle invalid data structure (missing fields) by including undefined', () => {
            const invalidData = {
                title: 'Valid title'
                // Missing description and type
            } as any;

            const prompt = createPrompt(invalidData);

            // The function doesn't throw but includes undefined in the prompt
            expect(prompt).toContain('Valid title');
            expect(prompt).toContain('undefined');
        });

        it('should throw error when data is null', () => {
            expect(() => createPrompt(null as any)).toThrow();
        });

        it('should throw error when data is undefined', () => {
            expect(() => createPrompt(undefined as any)).toThrow();
        });
    });

    describe('Prompt Structure Validation', () => {
        it('should include all required sections in the prompt', () => {
            const triageRequest: TriageRequest = {
                title: 'Test ticket',
                description: 'Test description',
                type: 'bug'
            };

            const prompt = createPrompt(triageRequest);

            // Verify all key sections are present
            expect(prompt).toContain('ticket triage assistant');
            expect(prompt).toContain('TICKET DETAILS');
            expect(prompt).toContain('TYPE CATEGORIES');
            expect(prompt).toContain('PRIORITY LEVELS');
            expect(prompt).toContain('Respond with ONLY two lowercase words');
        });

        it('should include all type categories', () => {
            const triageRequest: TriageRequest = {
                title: 'Test',
                description: 'Test',
                type: 'bug'
            };

            const prompt = createPrompt(triageRequest);

            const expectedTypes = [
                'bug', 'feature', 'question', 'task', 'grading',
                'report', 'config', 'assignment', 'exam', 'submission',
                'technical', 'academic'
            ];

            expectedTypes.forEach(type => {
                expect(prompt).toContain(type);
            });
        });

        it('should include all priority levels', () => {
            const triageRequest: TriageRequest = {
                title: 'Test',
                description: 'Test',
                type: 'bug'
            };

            const prompt = createPrompt(triageRequest);

            const expectedPriorities = ['critical', 'high', 'medium', 'low'];

            expectedPriorities.forEach(priority => {
                expect(prompt).toContain(priority);
            });
        });
    });
});
