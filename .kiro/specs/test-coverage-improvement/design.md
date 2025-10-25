# Design Document - Test Coverage Improvement

## Overview

Thiết kế này mô tả cách tăng test coverage từ mức hiện tại lên hơn 90% thông qua việc viết unit tests và integration tests có hệ thống. Chúng ta sẽ tập trung vào các components, services, hooks, và utilities chưa được test hoặc test chưa đầy đủ.

### Current State

- Test framework: Vitest với happy-dom environment
- Testing library: @testing-library/react
- Coverage tool: @vitest/coverage-v8
- Existing tests: AI functions, một số components và services
- Coverage exclusions: node_modules, **tests**, .d.ts files, config files

### Target State

- Overall coverage: >90% cho statements, branches, functions, lines
- Comprehensive component tests với user interaction testing
- Complete service layer testing với error handling
- Integration tests cho critical flows
- Fast và reliable test suite (<30s execution time)

## Architecture

### Test Organization Structure

```
src/__tests__/
├── setup.ts                    # Global test configuration
├── README.md                   # Testing guidelines
├── __mocks__/                  # Shared mocks
│   ├── supabase.ts
│   ├── geminiAI.ts
│   └── localStorage.ts         # NEW
├── fixtures/                   # Test data
│   ├── ticketData.ts
│   ├── userProfiles.ts
│   ├── aiResponses.ts
│   └── notificationData.ts     # NEW
├── utils/                      # NEW - Test utilities
│   ├── renderWithProviders.tsx
│   ├── mockSupabaseClient.ts
│   └── testHelpers.ts
├── components/                 # Component tests
│   ├── UnifiedTicketCreation.test.tsx (existing)
│   ├── NotificationBell.test.tsx      # NEW
│   ├── NotificationList.test.tsx      # NEW
│   ├── TicketList.test.tsx            # NEW
│   ├── Calendar.test.tsx              # NEW
│   ├── ReviewForm.test.tsx            # NEW
│   ├── AvatarUpload.test.tsx          # NEW
│   └── Navbar.test.tsx                # NEW
├── services/                   # Service tests
│   ├── ticketService.test.ts (existing)
│   ├── notificationService.test.ts    # NEW
│   ├── authService.test.ts            # NEW
│   ├── calendarService.test.ts        # NEW
│   ├── reviewService.test.ts          # NEW
│   └── statisticsService.test.ts      # NEW
├── hooks/                      # NEW - Hook tests
│   ├── useAuth.test.ts
│   ├── useNotifications.test.ts
│   ├── usePermissions.test.ts
│   └── useToast.test.ts
├── lib/                        # NEW - Utility tests
│   └── utils.test.ts
└── integration/                # Integration tests
    ├── aiTriageIntegration.test.ts (existing)
    ├── errorHandling.test.ts (existing)
    ├── ticketCreationFlow.test.ts     # NEW
    ├── notificationFlow.test.ts       # NEW
    └── authFlow.test.ts               # NEW
```

## Components and Interfaces

### 1. Test Utilities Module

**Purpose**: Cung cấp reusable utilities để setup test environment

**Key Functions**:

```typescript
// renderWithProviders.tsx
interface RenderOptions {
  initialState?: Partial<AppState>;
  user?: User | null;
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: RenderOptions
): RenderResult;

// mockSupabaseClient.ts
export function createMockSupabaseClient(): SupabaseClient;
export function mockSupabaseQuery(data: any, error?: any): void;
export function mockSupabaseAuth(user?: User): void;

// testHelpers.ts
export function waitForLoadingToFinish(): Promise<void>;
export function fillForm(fields: Record<string, string>): void;
export function expectToastMessage(message: string): void;
```

### 2. Component Testing Strategy

**Approach**: Test components theo user behavior, không test implementation details

**Test Categories**:

1. **Rendering Tests**: Component renders với props khác nhau
2. **Interaction Tests**: User clicks, types, submits forms
3. **State Tests**: Component state changes correctly
4. **Integration Tests**: Component tương tác với services/APIs
5. **Error Tests**: Component handles errors gracefully

**Example Test Structure**:

```typescript
describe("NotificationBell", () => {
  describe("Rendering", () => {
    it("should display notification count when has unread notifications", () => {});
    it("should not display count when no unread notifications", () => {});
  });

  describe("User Interactions", () => {
    it("should open dropdown when clicked", () => {});
    it("should mark notification as read when clicked", () => {});
    it("should mark all as read when button clicked", () => {});
  });

  describe("Real-time Updates", () => {
    it("should update count when new notification arrives", () => {});
  });

  describe("Error Handling", () => {
    it("should show error message when fetch fails", () => {});
  });
});
```

### 3. Service Testing Strategy

**Approach**: Test business logic, data transformation, error handling

**Test Categories**:

1. **Success Cases**: Methods return expected data
2. **Error Cases**: Methods handle errors properly
3. **Validation**: Input validation works correctly
4. **Data Transformation**: Data is formatted correctly
5. **Side Effects**: Database calls, API calls are made correctly

**Mock Strategy**:

- Mock Supabase client methods
- Mock external API calls
- Use fixtures for test data
- Verify mock calls với correct parameters

**Example Test Structure**:

```typescript
describe("notificationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUnreadNotifications", () => {
    it("should return unread notifications for user", async () => {});
    it("should return empty array when no notifications", async () => {});
    it("should throw error when database query fails", async () => {});
  });

  describe("markAsRead", () => {
    it("should update notification status to read", async () => {});
    it("should throw error when notification not found", async () => {});
  });
});
```

### 4. Hook Testing Strategy

**Approach**: Test hooks using @testing-library/react renderHook

**Test Categories**:

1. **Initial State**: Hook returns correct initial values
2. **State Updates**: Hook state updates correctly
3. **Side Effects**: useEffect runs correctly
4. **Error Handling**: Hook handles errors

**Example Test Structure**:

```typescript
describe("useNotifications", () => {
  it("should fetch notifications on mount", async () => {});
  it("should update count when new notification arrives", async () => {});
  it("should handle fetch error", async () => {});
  it("should cleanup subscription on unmount", () => {});
});
```

### 5. Integration Testing Strategy

**Approach**: Test complete user flows end-to-end

**Critical Flows to Test**:

1. **Ticket Creation Flow**: User creates ticket → AI triage → Save to DB → Show success
2. **Notification Flow**: Event occurs → Notification created → User receives → User reads
3. **Auth Flow**: User logs in → Session created → Protected routes accessible
4. **Review Flow**: User submits review → Saved to DB → Displayed in list

**Example Test Structure**:

```typescript
describe("Ticket Creation Flow", () => {
  it("should create ticket with AI triage successfully", async () => {
    // 1. Render ticket creation form
    // 2. Fill form with data
    // 3. Submit form
    // 4. Wait for AI triage
    // 5. Verify ticket saved
    // 6. Verify success message
    // 7. Verify navigation to ticket detail
  });

  it("should handle AI triage failure gracefully", async () => {
    // Test error path
  });
});
```

## Data Models

### Test Fixtures

**Purpose**: Provide consistent test data across tests

```typescript
// fixtures/ticketData.ts
export const mockTicket = {
  id: 'test-ticket-1',
  title: 'Test Ticket',
  description: 'Test Description',
  type: 'bug',
  priority: 'high',
  status: 'open',
  created_by: 'user-1',
  created_at: '2024-01-01T00:00:00Z'
};

export const mockTickets = [mockTicket, ...];

// fixtures/userProfiles.ts
export const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'student'
};

// fixtures/notificationData.ts
export const mockNotification = {
  id: 'notif-1',
  user_id: 'user-1',
  message: 'Test notification',
  type: 'ticket_assigned',
  is_read: false,
  created_at: '2024-01-01T00:00:00Z'
};
```

### Mock Patterns

```typescript
// __mocks__/supabase.ts
export const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        data: [],
        error: null,
      })),
    })),
    insert: vi.fn(() => ({ data: null, error: null })),
    update: vi.fn(() => ({ data: null, error: null })),
    delete: vi.fn(() => ({ data: null, error: null })),
  })),
  auth: {
    getUser: vi.fn(() => ({ data: { user: mockUser }, error: null })),
    signIn: vi.fn(),
    signOut: vi.fn(),
  },
};
```

## Error Handling

### Test Error Scenarios

1. **Network Errors**: API calls fail
2. **Validation Errors**: Invalid input data
3. **Authentication Errors**: User not authenticated
4. **Permission Errors**: User lacks permissions
5. **Database Errors**: Query fails
6. **Timeout Errors**: Request takes too long

### Error Testing Pattern

```typescript
it("should handle network error gracefully", async () => {
  // Mock service to throw error
  vi.mocked(ticketService.createTicket).mockRejectedValue(
    new Error("Network error")
  );

  // Perform action
  render(<TicketForm />);
  await userEvent.click(screen.getByRole("button", { name: /submit/i }));

  // Verify error handling
  expect(await screen.findByText(/network error/i)).toBeInTheDocument();
  expect(screen.queryByText(/success/i)).not.toBeInTheDocument();
});
```

## Testing Strategy

### Priority Matrix

**High Priority** (Must reach 90%+ coverage):

1. Services (business logic)
2. Critical components (UnifiedTicketCreation, NotificationBell, TicketList)
3. Hooks (useAuth, useNotifications, usePermissions)
4. Utilities (lib/utils.ts)

**Medium Priority** (Target 80%+ coverage):

1. UI components (Navbar, Calendar, ReviewForm)
2. Integration tests (critical flows)

**Low Priority** (Target 70%+ coverage):

1. Layout components (ProfileLayout, UserHomeSidebar)
2. Simple presentational components

### Coverage Targets

```typescript
// vitest.config.ts - Add coverage thresholds
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  exclude: [
    'node_modules/',
    'src/__tests__/',
    '**/*.d.ts',
    '**/*.config.*',
    'dist/',
    'coverage/',
  ],
  thresholds: {
    statements: 90,
    branches: 90,
    functions: 90,
    lines: 90
  }
}
```

### Test Execution Strategy

1. **Local Development**: `npm run test:watch` - Fast feedback loop
2. **Pre-commit**: `npm run test` - Run all tests
3. **CI/CD**: `npm run test:coverage` - Generate coverage report
4. **Coverage Review**: Check HTML report để identify gaps

## Performance Optimization

### Fast Test Execution

1. **Parallel Execution**: Vitest runs tests in parallel by default
2. **Minimal Setup**: Keep setup.ts minimal
3. **Mock External Calls**: Don't make real API calls
4. **Cleanup**: Clear mocks và state after each test
5. **Selective Testing**: Use `.only` và `.skip` during development

### Avoiding Flaky Tests

1. **Avoid Timeouts**: Use `waitFor` instead of fixed delays
2. **Proper Cleanup**: Cleanup subscriptions và timers
3. **Deterministic Data**: Use fixed test data, not random
4. **Isolated Tests**: Each test should be independent
5. **Proper Mocking**: Mock time-dependent functions

## Documentation

### Test README Structure

```markdown
# Testing Guide

## Running Tests

- `npm run test` - Run all tests once
- `npm run test:watch` - Watch mode
- `npm run test:coverage` - Generate coverage report
- `npm run test:ui` - Open Vitest UI

## Writing Tests

### Component Tests

[Guidelines for component testing]

### Service Tests

[Guidelines for service testing]

### Integration Tests

[Guidelines for integration testing]

## Mock Patterns

[Common mock patterns]

## Test Utilities

[Available test utilities]

## Troubleshooting

[Common issues and solutions]
```

## Implementation Phases

### Phase 1: Foundation (Test Utilities & Mocks)

- Create test utilities (renderWithProviders, mockSupabaseClient)
- Create additional fixtures
- Update test setup
- Document testing patterns

### Phase 2: Service Layer Testing

- Test all services to 90%+ coverage
- Focus on business logic và error handling
- Create service-specific mocks

### Phase 3: Component Testing

- Test high-priority components
- Test user interactions
- Test error states

### Phase 4: Hook Testing

- Test all custom hooks
- Test state management
- Test side effects

### Phase 5: Integration Testing

- Test critical user flows
- Test error scenarios
- Test edge cases

### Phase 6: Coverage Optimization

- Identify remaining gaps
- Write targeted tests
- Achieve 90%+ overall coverage

## Success Metrics

1. **Coverage Metrics**:

   - Statements: >90%
   - Branches: >90%
   - Functions: >90%
   - Lines: >90%

2. **Quality Metrics**:

   - Zero flaky tests
   - Test execution time <30s
   - All tests pass consistently

3. **Maintainability Metrics**:
   - Clear test names
   - Documented test patterns
   - Reusable test utilities
   - Easy to add new tests
