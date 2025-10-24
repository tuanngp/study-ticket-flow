/**
 * Test Data Generation Script
 * 
 * Generates test data fixtures for various testing scenarios.
 * Run with: npx tsx scripts/generate-test-data.ts
 */

import { writeFileSync } from 'fs';
import { join } from 'path';

// Types
interface TicketData {
    title: string;
    description: string;
    type?: 'bug' | 'feature' | 'question' | 'assignment' | 'exam' | 'project';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    courseCode?: string;
    className?: string;
    projectGroup?: string;
}

interface AIResponse {
    suggested_type: string;
    suggested_priority: string;
    analysis: string;
}

interface UserProfile {
    id: string;
    email: string;
    role: string;
}

// Generators
class TestDataGenerator {
    /**
     * Generate valid ticket data
     */
    static generateValidTicket(overrides: Partial<TicketData> = {}): TicketData {
        return {
            title: 'Valid ticket title for testing',
            description: 'This is a valid description with more than 10 characters for testing purposes.',
            type: 'bug',
            priority: 'medium',
            courseCode: 'PRJ301',
            className: 'SE1730',
            projectGroup: 'Team 07',
            ...overrides,
        };
    }

    /**
     * Generate invalid ticket data scenarios
     */
    static generateInvalidTickets(): TicketData[] {
        const base = this.generateValidTicket();

        return [
            { ...base, title: '', description: base.description }, // Empty title
            { ...base, title: '   ', description: base.description }, // Whitespace title
            { ...base, title: base.title, description: '' }, // Empty description
            { ...base, title: base.title, description: 'short' }, // Short description
            { ...base, title: base.title, description: base.description, type: undefined }, // Missing type
            { ...base, title: base.title, description: base.description, priority: undefined }, // Missing priority
            { ...base, title: base.title, description: base.description, type: 'invalid' as any }, // Invalid type
            { ...base, title: base.title, description: base.description, priority: 'invalid' as any }, // Invalid priority
        ];
    }

    /**
     * Generate edge case ticket data
     */
    static generateEdgeCaseTickets(): TicketData[] {
        const base = this.generateValidTicket();

        return [
            { ...base, title: 'A'.repeat(200) }, // Very long title
            { ...base, description: 'A'.repeat(5000) }, // Very long description
            { ...base, title: '<script>alert("xss")</script>' }, // XSS attempt
            { ...base, description: 'SELECT * FROM tickets; DROP TABLE tickets;' }, // SQL injection attempt
            { ...base, title: '🎉 Emoji title 🚀' }, // Unicode characters
            { ...base, description: 'Line 1\nLine 2\nLine 3' }, // Multiline description
            { ...base, courseCode: '' }, // Empty optional field
            { ...base, projectGroup: 'Team with spaces and special chars !@#' }, // Special characters
        ];
    }

    /**
     * Generate AI response scenarios
     */
    static generateAIResponses(): Record<string, AIResponse | null | Error> {
        return {
            validResponse: {
                suggested_type: 'bug',
                suggested_priority: 'high',
                analysis: 'This appears to be a critical bug that needs immediate attention.',
            },
            validFeatureResponse: {
                suggested_type: 'feature',
                suggested_priority: 'medium',
                analysis: 'This is a feature request that can be scheduled for the next sprint.',
            },
            validQuestionResponse: {
                suggested_type: 'question',
                suggested_priority: 'low',
                analysis: 'This is a general question that can be answered through documentation.',
            },
            partialResponse: {
                suggested_type: 'bug',
                suggested_priority: '',
                analysis: 'Partial analysis without priority.',
            },
            invalidResponse: null,
            malformedResponse: {
                suggested_type: 'invalid_type',
                suggested_priority: 'invalid_priority',
                analysis: '',
            } as any,
            timeoutError: new Error('Request timeout'),
            rateLimitError: new Error('Rate limit exceeded'),
            authError: new Error('Invalid API key'),
            serviceError: new Error('Service unavailable'),
        };
    }

    /**
     * Generate user profile scenarios
     */
    static generateUserProfiles(): Record<string, UserProfile> {
        return {
            validStudent: {
                id: 'user-123',
                email: 'student@example.com',
                role: 'student',
            },
            validInstructor: {
                id: 'user-456',
                email: 'instructor@example.com',
                role: 'instructor',
            },
            validAdmin: {
                id: 'user-789',
                email: 'admin@example.com',
                role: 'admin',
            },
            expiredSession: {
                id: 'user-expired',
                email: 'expired@example.com',
                role: 'student',
            },
            invalidUser: {
                id: '',
                email: '',
                role: '',
            },
        };
    }

    /**
     * Generate bulk test data for performance testing
     */
    static generateBulkTickets(count: number): TicketData[] {
        const tickets: TicketData[] = [];

        for (let i = 0; i < count; i++) {
            tickets.push(this.generateValidTicket({
                title: `Test ticket ${i + 1}`,
                description: `This is test ticket number ${i + 1} for performance testing.`,
                type: ['bug', 'feature', 'question'][i % 3] as any,
                priority: ['low', 'medium', 'high', 'urgent'][i % 4] as any,
            }));
        }

        return tickets;
    }

    /**
     * Generate test data for concurrent request testing
     */
    static generateConcurrentTestData(count: number): TicketData[] {
        return Array.from({ length: count }, (_, i) =>
            this.generateValidTicket({
                title: `Concurrent ticket ${i + 1}`,
                description: `Testing concurrent request handling for ticket ${i + 1}.`,
            })
        );
    }
}

// Export functions
function generateAllTestData() {
    const testData = {
        valid: TestDataGenerator.generateValidTicket(),
        invalid: TestDataGenerator.generateInvalidTickets(),
        edge: TestDataGenerator.generateEdgeCaseTickets(),
        aiResponses: TestDataGenerator.generateAIResponses(),
        users: TestDataGenerator.generateUserProfiles(),
        bulk: TestDataGenerator.generateBulkTickets(100),
        concurrent: TestDataGenerator.generateConcurrentTestData(10),
    };

    return testData;
}

function saveTestDataToFile(filename: string, data: any) {
    const outputPath = join(process.cwd(), 'src', '__tests__', 'fixtures', filename);
    const content = `// Auto-generated test data - DO NOT EDIT MANUALLY
// Generated on: ${new Date().toISOString()}
// Run: npx tsx scripts/generate-test-data.ts

export const testData = ${JSON.stringify(data, null, 2)};
`;

    writeFileSync(outputPath, content, 'utf-8');
    console.log(`✓ Generated ${filename}`);
}

// Main execution
if (require.main === module) {
    console.log('Generating test data...\n');

    try {
        const allData = generateAllTestData();

        // Save individual fixture files
        saveTestDataToFile('generated-tickets.ts', {
            valid: allData.valid,
            invalid: allData.invalid,
            edge: allData.edge,
        });

        saveTestDataToFile('generated-ai-responses.ts', allData.aiResponses);
        saveTestDataToFile('generated-users.ts', allData.users);
        saveTestDataToFile('generated-bulk.ts', { tickets: allData.bulk });
        saveTestDataToFile('generated-concurrent.ts', { tickets: allData.concurrent });

        console.log('\n✓ All test data generated successfully!');
        console.log('\nGenerated files:');
        console.log('  - src/__tests__/fixtures/generated-tickets.ts');
        console.log('  - src/__tests__/fixtures/generated-ai-responses.ts');
        console.log('  - src/__tests__/fixtures/generated-users.ts');
        console.log('  - src/__tests__/fixtures/generated-bulk.ts');
        console.log('  - src/__tests__/fixtures/generated-concurrent.ts');

    } catch (error) {
        console.error('✗ Error generating test data:', error);
        process.exit(1);
    }
}

// Export for use in other scripts
export { generateAllTestData, TestDataGenerator };

