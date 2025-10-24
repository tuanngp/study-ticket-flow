# Mock Usage and Testing Patterns

This document describes the mocking patterns and best practices used in the test suite.

## Overview

The test suite uses Vitest's built-in mocking capabilities to isolate tests from external dependencies. All external services (Supabase, Gemini AI, authentication) are mocked to ensure fast, reliable, and isolated tests.

## Mock Categories

### 1. Supabase Database Mocks

#### Basic Mock Setup

```typescript
import { vi } from "vitest";

// Mock the Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(),
    })),
  })),
  functions: {
    invoke: vi.fn(),
  },
};
```

#### Usage in Tests

```typescript
describe("Database Operations", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it("should insert ticket successfully", async () => {
    // Arrange
    const mockTicket = { id: "123", title: "Test" };
    mockSupabase.from().insert().select().single.mockResolvedValue({
      data: mockTicket,
      error: null,
    });

    // Act
    const result = await TicketService.createTicket(validData, userId);

    // Assert
    expect(mockSupabase.from).toHaveBeenCalledWith("tickets");
    expect(result).toEqual(mockTicket);
  });

  it("should handle database errors", async () => {
    // Arrange
    mockSupabase
      .from()
      .insert()
      .select()
      .single.mockResolvedValue({
        data: null,
        error: { message: "Connection failed" },
      });

    // Act & Assert
    await expect(TicketService.createTicket(validData, userId)).rejects.toThrow(
      "Connection failed"
    );
  });
});
```

### 2. AI Service Mocks

#### Gemini AI Mock Setup

```typescript
// Mock AI service responses
const mockAIService = {
  callGeminiAI: vi.fn(),
  validateInput: vi.fn(),
  createPrompt: vi.fn(),
  parseTypeAndPriority: vi.fn(),
};

// Mock successful AI response
const mockAIResponse = {
  suggested_type: "bug",
  suggested_priority: "high",
  analysis: "Critical bug detected",
};
```

#### Usage Patterns

```typescript
describe("AI Integration", () => {
  it("should get AI suggestions successfully", async () => {
    // Arrange
    mockAIService.callGeminiAI.mockResolvedValue(mockAIResponse);

    // Act
    const result = await TicketService.getAITriageSuggestions(ticketData);

    // Assert
    expect(result).toEqual(mockAIResponse);
    expect(mockAIService.callGeminiAI).toHaveBeenCalledWith(
      expect.objectContaining({
        title: ticketData.title,
        description: ticketData.description,
      })
    );
  });

  it("should handle AI timeout", async () => {
    // Arrange
    mockAIService.callGeminiAI.mockRejectedValue(new Error("Request timeout"));

    // Act
    const result = await TicketService.getAITriageSuggestions(ticketData);

    // Assert
    expect(result).toBeNull();
  });
});
```

### 3. Authentication Mocks

#### User Session Mock

```typescript
// Mock authenticated user
const mockUser = {
  id: "user-123",
  email: "test@example.com",
  role: "student",
};

// Mock authentication context
const mockAuth = {
  user: mockUser,
  session: {
    access_token: "mock-token",
    expires_at: Date.now() + 3600000,
  },
  signOut: vi.fn(),
};
```

#### Usage in Component Tests

```typescript
import { render, screen } from "@testing-library/react";

describe("Component with Auth", () => {
  it("should render for authenticated user", () => {
    // Arrange
    const wrapper = ({ children }) => (
      <AuthContext.Provider value={mockAuth}>{children}</AuthContext.Provider>
    );

    // Act
    render(<UnifiedTicketCreation />, { wrapper });

    // Assert
    expect(screen.getByText("Create Ticket")).toBeInTheDocument();
  });

  it("should handle expired session", async () => {
    // Arrange
    const expiredAuth = {
      ...mockAuth,
      session: null,
    };

    // Act & Assert
    // Test redirect or error handling
  });
});
```

## Common Mock Patterns

### Pattern 1: Mock Chain Methods

```typescript
// For chained Supabase queries
const mockChain = {
  from: vi.fn(() => mockChain),
  select: vi.fn(() => mockChain),
  eq: vi.fn(() => mockChain),
  single: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
};
```

### Pattern 2: Conditional Mock Responses

```typescript
// Return different responses based on input
mockSupabase.from.mockImplementation((table) => {
  if (table === "tickets") {
    return {
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({ data: mockTicket, error: null })
          ),
        })),
      })),
    };
  }
  // Handle other tables
});
```

### Pattern 3: Mock Timers for Async Operations

```typescript
import { vi } from "vitest";

describe("Async Operations", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should timeout after 5 seconds", async () => {
    // Arrange
    const slowOperation = new Promise((resolve) => {
      setTimeout(() => resolve("done"), 10000);
    });

    // Act
    const promise = slowOperation;
    vi.advanceTimersByTime(5000);

    // Assert
    // Test timeout behavior
  });
});
```

### Pattern 4: Spy on Console Methods

```typescript
describe("Error Logging", () => {
  let consoleErrorSpy: any;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("should log error to console", async () => {
    // Arrange & Act
    await functionThatLogsError();

    // Assert
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Error")
    );
  });
});
```

## Best Practices

### 1. Reset Mocks Between Tests

```typescript
describe("Test Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks(); // Clear call history
    // or
    vi.resetAllMocks(); // Reset implementation
  });
});
```

### 2. Use Specific Matchers

```typescript
// Good - specific expectations
expect(mockFn).toHaveBeenCalledWith(
  expect.objectContaining({
    title: "Test",
    description: expect.any(String),
  })
);

// Avoid - too generic
expect(mockFn).toHaveBeenCalled();
```

### 3. Mock Only What You Need

```typescript
// Good - minimal mock
const mockService = {
  createTicket: vi.fn(),
};

// Avoid - over-mocking
const mockService = {
  createTicket: vi.fn(),
  updateTicket: vi.fn(), // Not needed for this test
  deleteTicket: vi.fn(), // Not needed for this test
  // ... many more unused mocks
};
```

### 4. Use Type-Safe Mocks

```typescript
import { vi, Mock } from "vitest";

// Type-safe mock
const mockCreateTicket: Mock<typeof TicketService.createTicket> = vi.fn();

// Usage with type checking
mockCreateTicket.mockResolvedValue(mockTicket);
```

### 5. Test Mock Interactions

```typescript
it("should call service with correct parameters", async () => {
  // Arrange
  const mockService = vi.fn();

  // Act
  await component.handleSubmit(formData);

  // Assert
  expect(mockService).toHaveBeenCalledTimes(1);
  expect(mockService).toHaveBeenCalledWith(
    expect.objectContaining({
      title: formData.title,
    })
  );
});
```

## Mock Scenarios

### Scenario 1: Success Path

```typescript
mockSupabase.from().insert().select().single.mockResolvedValue({
  data: mockTicket,
  error: null,
});
```

### Scenario 2: Validation Error

```typescript
mockService.validateTicketData.mockReturnValue({
  isValid: false,
  errors: ["Title is required"],
});
```

### Scenario 3: Network Error

```typescript
mockSupabase
  .from()
  .insert()
  .select()
  .single.mockRejectedValue(new Error("Network connection failed"));
```

### Scenario 4: Timeout

```typescript
mockAIService.callGeminiAI.mockImplementation(() => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Request timeout")), 5000);
  });
});
```

### Scenario 5: Rate Limiting

```typescript
mockAIService.callGeminiAI.mockRejectedValue({
  message: "Rate limit exceeded",
  code: "RATE_LIMIT",
  retryAfter: 60,
});
```

## Debugging Mocks

### Check Mock Calls

```typescript
// See all calls to a mock
console.log(mockFn.mock.calls);

// See call arguments
console.log(mockFn.mock.calls[0]); // First call arguments

// See return values
console.log(mockFn.mock.results);
```

### Verify Mock Setup

```typescript
it("should verify mock is configured", () => {
  expect(mockFn).toBeDefined();
  expect(vi.isMockFunction(mockFn)).toBe(true);
});
```

### Test Mock Behavior

```typescript
it("should test mock implementation", () => {
  // Arrange
  mockFn.mockImplementation((x) => x * 2);

  // Act
  const result = mockFn(5);

  // Assert
  expect(result).toBe(10);
});
```

## Common Pitfalls

### Pitfall 1: Not Resetting Mocks

```typescript
// Problem: Mock state carries over between tests
describe("Tests", () => {
  it("test 1", () => {
    mockFn.mockReturnValue("value1");
    // test...
  });

  it("test 2", () => {
    // mockFn still returns 'value1'!
  });
});

// Solution: Reset in beforeEach
beforeEach(() => {
  vi.clearAllMocks();
});
```

### Pitfall 2: Async Mock Issues

```typescript
// Problem: Not awaiting async mocks
it("test", () => {
  mockFn.mockResolvedValue("value");
  const result = mockFn(); // Returns Promise, not 'value'
  expect(result).toBe("value"); // Fails!
});

// Solution: Use async/await
it("test", async () => {
  mockFn.mockResolvedValue("value");
  const result = await mockFn();
  expect(result).toBe("value"); // Passes
});
```

### Pitfall 3: Over-Mocking

```typescript
// Problem: Mocking too much loses test value
mockEverything();
// Test passes but doesn't validate real behavior

// Solution: Mock only external dependencies
// Test real business logic
```

## Resources

- [Vitest Mocking Guide](https://vitest.dev/guide/mocking.html)
- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles)
- [Mock Service Worker](https://mswjs.io/) - For HTTP mocking
