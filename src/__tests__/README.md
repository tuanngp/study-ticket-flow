# Test Directory Structure

This directory contains the comprehensive unit test suite for the Ticket Creation and AI Triage feature.

## Directory Structure

```
__tests__/
├── setup.ts                 # Global test setup and configuration
├── fixtures/                # Test data fixtures
│   ├── ticketData.ts        # Ticket test data scenarios
│   ├── aiResponses.ts       # Mock AI response data
│   └── userProfiles.ts      # User authentication test data
├── __mocks__/               # Mock implementations
│   ├── supabase.ts          # Supabase client mocks
│   └── geminiAI.ts          # Gemini AI service mocks
├── services/                # Service layer tests
├── components/              # React component tests
└── ai-functions/            # AI function tests
```

## Running Tests

- `npm run test` - Run all tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:ui` - Run tests with UI interface

## Test Categories

The test suite covers 61 test cases across 4 categories:

- **Positive Tests (17)**: Standard functionality scenarios
- **Negative Tests (18)**: Invalid input and error conditions
- **Edge Tests (14)**: Boundary conditions and special cases
- **Error Tests (12)**: System failures and exception handling

## Mock Strategy

- **Supabase**: Database operations are mocked to avoid external dependencies
- **Gemini AI**: AI API calls are mocked with predefined response scenarios
- **Authentication**: User sessions and tokens are mocked for isolation
