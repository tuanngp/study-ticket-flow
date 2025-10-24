# Ticket Creation Unit Tests

Comprehensive test suite for the Ticket Creation and AI Triage feature with 119 test cases covering positive, negative, edge, and error scenarios.

## Test Overview

### Test Statistics

- **Total Tests**: 119 passing tests
- **Test Files**: 8 test files
- **Coverage**: 63%+ overall coverage
- **Test Categories**:
  - Positive Tests: 17 cases (standard functionality)
  - Negative Tests: 18 cases (invalid inputs)
  - Edge Tests: 14 cases (boundary conditions)
  - Error Tests: 12 cases (system failures)
  - Integration Tests: 58+ cases (component and service integration)

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Tests with Coverage

```bash
npm test -- --coverage
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Specific Test File

```bash
npm test -- src/__tests__/services/ticketService.test.ts
```

### Run Tests Matching Pattern

```bash
npm test -- --grep "AI Triage"
```

## Test Structure

```
src/__tests__/
├── services/
│   └── ticketService.test.ts          # TicketService unit tests (25 tests)
├── components/
│   └── UnifiedTicketCreation.test.tsx # Component integration tests (17 tests)
├── ai-functions/
│   ├── validateInput.test.ts          # Input validation tests (10 tests)
│   ├── callGeminiAI.test.ts          # AI API integration tests (9 tests)
│   ├── createPrompt.test.ts          # Prompt generation tests (12 tests)
│   └── parseTypeAndPriority.test.ts  # Response parsing tests (20 tests)
├── integration/
│   ├── aiTriageIntegration.test.ts   # End-to-end AI tests (7 tests)
│   └── errorHandling.test.ts         # Error propagation tests (19 tests)
├── fixtures/
│   ├── ticketData.ts                 # Test data fixtures
│   ├── aiResponses.ts                # Mock AI responses
│   └── userProfiles.ts               # User test data
└── README.md                          # This file
```

## Test Categories

### 1. Service Layer Tests (ticketService.test.ts)

Tests for `TicketService` class covering:

- **createTicket()**: Ticket creation with validation (TC01-TC10)
- **getAITriageSuggestions()**: AI integration (TC11-TC16)
- **validateTicketData()**: Data validation (TC17-TC25)

### 2. Component Tests (UnifiedTicketCreation.test.tsx)

Tests for React component covering:

- Form submission handling (TC26-TC32)
- AI suggestion display and interaction
- Loading states and error handling
- User interaction flows

### 3. AI Function Tests

#### validateInput.test.ts (TC33-TC39)

- Valid triage request validation
- Missing/invalid field detection
- Whitespace and length limit handling

#### callGeminiAI.test.ts (TC40-TC46)

- Successful API calls
- Authentication failures
- Token limits and timeouts
- Rate limiting and service outages

#### createPrompt.test.ts (TC49-TC53)

- Prompt generation for different scenarios
- Input limit handling
- Invalid data structure handling

#### parseTypeAndPriority.test.ts (TC54-TC61)

- Standard response parsing
- Fallback logic for missing data
- Invalid response handling

### 4. Integration Tests

#### aiTriageIntegration.test.ts (TC47-TC48)

- Concurrent request handling
- Environment configuration
- End-to-end AI triage workflow

#### errorHandling.test.ts

- Error propagation between layers
- Error message display
- Recovery mechanisms
- Cascading error handling

## Mock Strategy

### Supabase Mocking

All database operations are mocked to ensure isolated testing:

- `from()` - Table selection
- `insert()` - Data insertion
- `select()` - Data retrieval
- `functions.invoke()` - Edge function calls

### AI Service Mocking

Gemini AI API calls are mocked with various scenarios:

- Successful responses
- Timeout errors
- Rate limit errors
- Invalid API keys
- Service unavailability

### Authentication Mocking

User authentication is mocked for testing:

- Valid user sessions
- Expired sessions
- Missing authentication

## Test Data Fixtures

### ticketData.ts

Provides consistent test data:

- `validTicketData` - Valid ticket for positive tests
- `invalidTicketData` - Array of invalid tickets for negative tests
- `edgeTicketData` - Boundary condition test cases

### aiResponses.ts

Mock AI responses for different scenarios:

- `validAIResponse` - Successful AI analysis
- `invalidAIResponse` - Malformed responses
- `timeoutResponse` - Timeout errors
- `rateLimitResponse` - Rate limit errors

### userProfiles.ts

User data for authentication tests:

- `validUser` - Authenticated user
- `expiredUser` - Expired session
- `invalidUser` - Invalid credentials

## Coverage Reports

### Viewing Coverage

After running tests with coverage, open:

```bash
# Coverage report is displayed in terminal
npm test -- --coverage

# HTML report (if configured)
open coverage/index.html
```

### Coverage Targets

- **Statements**: 60%+
- **Branches**: 60%+
- **Functions**: 40%+
- **Lines**: 60%+

### Current Coverage

```
File                          | % Stmts | % Branch | % Funcs | % Lines
------------------------------|---------|----------|---------|--------
All files                     |   63.05 |    64.62 |      44 |   64.09
 components                   |   48.54 |       60 |   36.45 |   48.85
 services                     |     100 |    91.66 |     100 |     100
```

## Maintenance

### Adding New Tests

1. **Identify the functionality** to test
2. **Choose the appropriate test file** or create a new one
3. **Follow the existing test structure**:
   ```typescript
   describe("Feature Name", () => {
     describe("Function/Method Name", () => {
       describe("Test Category", () => {
         it("TC##: should describe expected behavior", async () => {
           // Arrange
           const testData = validTicketData;

           // Act
           const result = await functionUnderTest(testData);

           // Assert
           expect(result).toBeDefined();
         });
       });
     });
   });
   ```

### Updating Test Data

1. **Edit fixture files** in `src/__tests__/fixtures/`
2. **Ensure consistency** across all tests using the fixture
3. **Run tests** to verify changes don't break existing tests

### Updating Mocks

1. **Locate mock implementation** in test file or `__mocks__/` directory
2. **Update mock behavior** to match new requirements
3. **Verify all tests** using the mock still pass

## Common Issues

### Issue: Tests Fail After Code Changes

**Solution**:

1. Check if the API contract changed
2. Update mocks to match new behavior
3. Update test expectations

### Issue: Unhandled Promise Rejections

**Solution**:

- These are expected in error tests
- Ensure errors are properly caught and tested
- Use `expect().rejects.toThrow()` for async errors

### Issue: Component Tests Timeout

**Solution**:

- Increase timeout in test: `it('test', async () => {...}, 10000)`
- Check for missing `await` statements
- Verify mocks are properly configured

### Issue: Coverage Not Meeting Targets

**Solution**:

1. Identify uncovered lines in coverage report
2. Add tests for uncovered branches
3. Focus on critical paths first

## Best Practices

1. **Arrange-Act-Assert**: Structure tests clearly
2. **One Assertion Per Test**: Keep tests focused
3. **Descriptive Test Names**: Use TC## prefix and clear descriptions
4. **Mock External Dependencies**: Ensure test isolation
5. **Test Edge Cases**: Don't just test happy paths
6. **Keep Tests Fast**: Use mocks to avoid slow operations
7. **Clean Up**: Reset mocks between tests with `beforeEach`

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Run Tests
  run: npm test -- --coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/coverage-final.json
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Test Requirements](./.kiro/specs/ticket-creation-unit-tests/requirements.md)
- [Test Design](./.kiro/specs/ticket-creation-unit-tests/design.md)

## Support

For questions or issues with tests:

1. Check this README
2. Review test requirements and design documents
3. Examine existing test patterns
4. Consult team members
