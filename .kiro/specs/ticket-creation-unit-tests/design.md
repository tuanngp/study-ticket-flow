# Design Document

## Overview

This design outlines the implementation of comprehensive unit tests for the Ticket Creation and AI Triage feature. The testing architecture will use Vitest as the primary testing framework, with comprehensive mocking strategies for external dependencies like Supabase and Gemini AI. The design ensures isolated, reliable, and maintainable tests covering all 61 test cases specified in the requirements.

## Architecture

### Testing Framework Stack

- **Primary Framework**: Vitest (fast, modern testing framework for Vite projects)
- **Assertion Library**: Vitest built-in assertions (Jest-compatible)
- **Mocking**: Vitest mocking capabilities with custom mock implementations
- **Test Runner**: Vitest CLI with watch mode support
- **Coverage**: Vitest coverage reporting with c8

### Test Organization Structure

```
src/
├── __tests__/
│   ├── services/
│   │   ├── ticketService.test.ts
│   │   └── __mocks__/
│   │       ├── supabase.ts
│   │       └── geminiAI.ts
│   ├── components/
│   │   ├── UnifiedTicketCreation.test.tsx
│   │   └── __mocks__/
│   │       └── react-testing-library.ts
│   ├── ai-functions/
│   │   ├── validateInput.test.ts
│   │   ├── callGeminiAI.test.ts
│   │   ├── createPrompt.test.ts
│   │   └── parseTypeAndPriority.test.ts
│   └── fixtures/
│       ├── ticketData.ts
│       ├── aiResponses.ts
│       └── userProfiles.ts
├── vitest.config.ts
└── package.json (updated with test dependencies)
```

## Components and Interfaces

### 1. Test Configuration

```typescript
// vitest.config.ts
interface VitestConfig {
  testEnvironment: "jsdom" | "node";
  setupFiles: string[];
  coverage: CoverageConfig;
  globals: boolean;
}
```

### 2. Mock Interfaces

```typescript
// Mock Supabase Client
interface MockSupabaseClient {
  from: (table: string) => MockQueryBuilder;
  functions: {
    invoke: (name: string, options: any) => Promise<MockResponse>;
  };
}

// Mock AI Service
interface MockGeminiAI {
  generateContent: (prompt: string) => Promise<MockAIResponse>;
  validateApiKey: (key: string) => boolean;
}
```

### 3. Test Data Fixtures

```typescript
// Test data structures for consistent testing
interface TicketTestData {
  validTicketData: TicketFormData;
  invalidTicketData: TicketFormData[];
  edgeTicketData: TicketFormData[];
  aiResponses: AITriageResult[];
}
```

## Data Models

### Test Fixtures Design

```typescript
// fixtures/ticketData.ts
export const validTicketData = {
  title: "Valid ticket title",
  description: "Valid description with more than 10 characters",
  type: "bug" as const,
  priority: "medium" as const,
  courseCode: "PRJ301",
  className: "SE1730",
  projectGroup: "Team 07",
};

export const invalidTicketData = [
  { ...validTicketData, title: "" }, // Empty title
  { ...validTicketData, description: "short" }, // Short description
  { ...validTicketData, type: "invalid" as any }, // Invalid type
  // ... more invalid scenarios
];

export const edgeTicketData = [
  { ...validTicketData, title: "A".repeat(100) }, // Long title
  { ...validTicketData, description: "<script>alert('xss')</script>" }, // XSS attempt
  // ... more edge cases
];
```

### Mock Response Models

```typescript
// Mock AI responses for different scenarios
export const mockAIResponses = {
  validResponse: {
    suggested_type: "bug",
    suggested_priority: "high",
    analysis: "This appears to be a critical bug",
  },
  invalidResponse: null,
  timeoutResponse: new Error("Request timeout"),
  rateLimitResponse: new Error("Rate limit exceeded"),
};
```

## Error Handling

### Test Error Scenarios

1. **Database Errors**: Mock Supabase connection failures, constraint violations
2. **AI Service Errors**: Mock API timeouts, rate limits, invalid responses
3. **Validation Errors**: Test input validation edge cases
4. **Network Errors**: Mock network connectivity issues
5. **Authentication Errors**: Mock expired sessions, invalid tokens

### Error Testing Strategy

```typescript
// Example error test structure
describe("Error Handling", () => {
  it("should handle database connection failure", async () => {
    // Mock database error
    mockSupabase.from.mockRejectedValue(new Error("Connection failed"));

    // Test error handling
    await expect(TicketService.createTicket(validData, userId)).rejects.toThrow(
      "Failed to create ticket"
    );
  });
});
```

## Testing Strategy

### 1. Unit Test Categories

#### Positive Tests (17 cases)

- Valid ticket creation with all required fields
- Successful AI triage integration
- Proper form submission handling
- Valid input processing for AI functions

#### Negative Tests (18 cases)

- Empty/missing required fields
- Invalid data types and formats
- Malformed API responses
- Authentication failures

#### Edge Tests (14 cases)

- Boundary value testing (min/max lengths)
- Special characters and XSS prevention
- Concurrent request handling
- Performance limits

#### Error Tests (12 cases)

- Service unavailability
- Network timeouts
- Rate limiting
- System failures

### 2. Mocking Strategy

#### Supabase Mocking

```typescript
// __mocks__/supabase.ts
export const mockSupabase = {
  from: vi.fn(() => ({
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
  })),
  functions: {
    invoke: vi.fn(),
  },
};
```

#### AI Service Mocking

```typescript
// __mocks__/geminiAI.ts
export const mockGeminiAI = {
  generateContent: vi.fn(),
  validateApiKey: vi.fn(() => true),
};
```

### 3. Component Testing Strategy

#### React Component Testing

- Use React Testing Library for component rendering
- Test user interactions (form submission, input changes)
- Verify UI state changes and error displays
- Mock external service calls

#### Integration Points Testing

- Test service integration without actual API calls
- Verify data flow between components and services
- Test error propagation and handling

## Implementation Phases

### Phase 1: Test Infrastructure Setup

1. Install and configure Vitest
2. Set up test environment configuration
3. Create basic mock implementations
4. Establish test data fixtures

### Phase 2: Service Layer Tests

1. Implement TicketService tests (TC01-TC10)
2. Implement AI triage function tests (TC11-TC48)
3. Add comprehensive error handling tests
4. Verify mock behavior and isolation

### Phase 3: Component Layer Tests

1. Implement UnifiedTicketCreation tests (TC26-TC32)
2. Add form validation and interaction tests
3. Test AI suggestion integration in UI
4. Verify error display and user feedback

### Phase 4: Integration and Coverage

1. Run full test suite and verify coverage
2. Add missing test scenarios
3. Optimize test performance
4. Generate coverage reports

## Performance Considerations

### Test Execution Performance

- Use Vitest's parallel execution for faster test runs
- Implement proper test isolation to prevent interference
- Optimize mock implementations for speed
- Use test data fixtures to reduce setup time

### Memory Management

- Clean up mocks between tests
- Avoid memory leaks in component tests
- Proper teardown of test environments

## Security Testing

### Input Validation Testing

- Test XSS prevention in form inputs
- Verify SQL injection protection
- Test input sanitization
- Validate data type enforcement

### Authentication Testing

- Test expired session handling
- Verify proper error messages for auth failures
- Test unauthorized access scenarios
