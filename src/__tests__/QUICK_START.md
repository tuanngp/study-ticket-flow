# Quick Start Guide - Test Suite

Fast reference for running and maintaining the ticket creation test suite.

## Running Tests

### Basic Commands

```bash
# Run all tests once
npm test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with UI interface
npm run test:ui
```

### Run Specific Tests

```bash
# Run a specific test file
npm test -- src/__tests__/services/ticketService.test.ts

# Run tests matching a pattern
npm test -- --grep "AI Triage"

# Run tests in a specific directory
npm test -- src/__tests__/components/
```

## Test Results

### Understanding Output

```
✓ src/__tests__/services/ticketService.test.ts (25 tests) 86ms
  ✓ TicketService > createTicket() > Positive Tests
    ✓ TC01: should create ticket with valid data
    ✓ TC02: should create ticket with AI suggestions
```

- ✓ = Test passed
- ✗ = Test failed
- Number in parentheses = Total tests in file
- Time = Execution duration

### Coverage Report

```
File                  | % Stmts | % Branch | % Funcs | % Lines
----------------------|---------|----------|---------|--------
ticketService.ts      |     100 |    91.66 |     100 |     100
```

- **Stmts**: Statement coverage
- **Branch**: Branch/condition coverage
- **Funcs**: Function coverage
- **Lines**: Line coverage

## Common Tasks

### Add New Test

1. Open appropriate test file (or create new one)
2. Add test case:

```typescript
it("TC##: should describe behavior", async () => {
  // Arrange
  const testData = validTicketData;

  // Act
  const result = await functionUnderTest(testData);

  // Assert
  expect(result).toBeDefined();
});
```

### Update Test Data

1. Edit `src/__tests__/fixtures/ticketData.ts`
2. Or generate new data: `npm run test:generate-data`

### Fix Failing Test

1. Read error message carefully
2. Check if code changed (update test)
3. Check if test is wrong (fix test)
4. Run single test to verify: `npm test -- --grep "TC##"`

### Generate Test Data

```bash
# Generate fresh test data fixtures
npm run test:generate-data
```

## Test Categories

### By Type

- **Positive**: Valid inputs, expected success (TC01-TC17)
- **Negative**: Invalid inputs, expected errors (TC18-TC35)
- **Edge**: Boundary conditions (TC36-TC49)
- **Error**: System failures (TC50-TC61)

### By Component

- **Services**: `src/__tests__/services/`
- **Components**: `src/__tests__/components/`
- **AI Functions**: `src/__tests__/ai-functions/`
- **Integration**: `src/__tests__/integration/`

## Troubleshooting

### Tests Won't Run

```bash
# Clear cache and reinstall
rm -rf node_modules
npm install

# Clear Vitest cache
rm -rf node_modules/.vitest
```

### Tests Timeout

```bash
# Increase timeout in test
it('test', async () => {
  // test code
}, 10000); // 10 second timeout
```

### Mock Not Working

```typescript
// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});
```

### Coverage Too Low

1. Run: `npm run test:coverage`
2. Check uncovered lines in report
3. Add tests for uncovered code
4. Focus on critical paths first

## Quick Reference

### Test Structure

```typescript
describe("Feature", () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  it("should do something", () => {
    // Test code
  });
});
```

### Common Assertions

```typescript
// Equality
expect(value).toBe(expected);
expect(value).toEqual(expected);

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeDefined();
expect(value).toBeNull();

// Numbers
expect(value).toBeGreaterThan(3);
expect(value).toBeLessThan(10);

// Strings
expect(string).toContain("substring");
expect(string).toMatch(/regex/);

// Arrays
expect(array).toContain(item);
expect(array).toHaveLength(3);

// Objects
expect(object).toHaveProperty("key");
expect(object).toMatchObject({ key: "value" });

// Async
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow(error);

// Functions
expect(fn).toHaveBeenCalled();
expect(fn).toHaveBeenCalledWith(arg1, arg2);
expect(fn).toHaveBeenCalledTimes(2);
```

### Mock Patterns

```typescript
// Mock function
const mockFn = vi.fn();

// Mock return value
mockFn.mockReturnValue("value");

// Mock async return
mockFn.mockResolvedValue("value");

// Mock error
mockFn.mockRejectedValue(new Error("error"));

// Mock implementation
mockFn.mockImplementation((x) => x * 2);
```

## File Locations

```
src/__tests__/
├── README.md              # Full documentation
├── QUICK_START.md         # This file
├── MOCK_PATTERNS.md       # Mock usage guide
├── fixtures/              # Test data
│   ├── ticketData.ts
│   ├── aiResponses.ts
│   └── userProfiles.ts
├── services/              # Service tests
├── components/            # Component tests
├── ai-functions/          # AI function tests
└── integration/           # Integration tests
```

## Getting Help

1. Check [README.md](./README.md) for detailed docs
2. Check [MOCK_PATTERNS.md](./MOCK_PATTERNS.md) for mocking help
3. Review existing tests for examples
4. Check [Vitest docs](https://vitest.dev/)

## Test Statistics

- **Total Tests**: 119
- **Test Files**: 8
- **Coverage**: 63%+
- **Execution Time**: ~30 seconds

## Next Steps

1. Run tests: `npm test`
2. Check coverage: `npm run test:coverage`
3. Add new tests as needed
4. Keep coverage above 60%
