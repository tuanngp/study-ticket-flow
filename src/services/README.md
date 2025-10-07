# Services Layer

This directory contains all the business logic services that handle data operations, authentication, and external API calls. These services follow the Single Responsibility Principle and provide a clean abstraction layer between components and data sources.

## Architecture Overview

```
src/services/
├── authService.ts           # Authentication operations
├── ticketService.ts         # Ticket creation and AI triage
├── ticketOperationsService.ts # Ticket CRUD operations
├── commentService.ts        # Comment operations
├── statisticsService.ts     # Dashboard statistics
└── README.md               # This file
```

## Services

### AuthService

Handles all authentication-related operations including sign up, sign in, sign out, and session management.

**Key Methods:**
- `signUp(data)` - Register new user
- `signIn(data)` - Authenticate existing user
- `signOut()` - Sign out current user
- `getCurrentSession()` - Get current user session and profile
- `getUserProfile(userId)` - Fetch user profile
- `requireAuth()` - Check authentication status

**Usage:**
```typescript
import { AuthService } from '@/services/authService';

// Sign in
const { user, error } = await AuthService.signIn({ email, password });

// Get current session
const session = await AuthService.getCurrentSession();
```

### TicketService

Handles ticket creation with AI-powered triage suggestions.

**Key Methods:**
- `createTicket(formData, creatorId)` - Create new ticket with AI suggestions
- `getAITriageSuggestions(formData)` - Get AI triage recommendations
- `validateTicketData(formData)` - Validate ticket form data

**Usage:**
```typescript
import { TicketService } from '@/services/ticketService';

const createdTicket = await TicketService.createTicket(formData, userId);
```

### TicketOperationsService

Handles all ticket CRUD operations and real-time subscriptions.

**Key Methods:**
- `getTicketById(ticketId)` - Fetch single ticket with relations
- `getTickets(options)` - Fetch tickets with filters
- `updateTicketStatus(ticketId, status)` - Update ticket status
- `updateTicketAssignee(ticketId, assigneeId)` - Update ticket assignee
- `subscribeToTickets(callback)` - Subscribe to ticket changes

**Usage:**
```typescript
import { TicketOperationsService } from '@/services/ticketOperationsService';

// Get tickets
const tickets = await TicketOperationsService.getTickets({ limit: 10 });

// Subscribe to changes
const unsubscribe = TicketOperationsService.subscribeToTickets(fetchTickets);
```

### CommentService

Manages comment operations for tickets.

**Key Methods:**
- `getCommentsByTicketId(ticketId)` - Fetch comments for a ticket
- `createComment(data)` - Add new comment
- `updateComment(commentId, content)` - Update comment
- `deleteComment(commentId)` - Delete comment
- `subscribeToComments(ticketId, callback)` - Subscribe to comment changes

**Usage:**
```typescript
import { CommentService } from '@/services/commentService';

const comments = await CommentService.getCommentsByTicketId(ticketId);
const { success, comment } = await CommentService.createComment({
  ticketId,
  userId,
  content
});
```

### StatisticsService

Provides dashboard statistics and analytics.

**Key Methods:**
- `getTicketStats(userId)` - Get user's ticket statistics
- `getUserStats(userId)` - Get comprehensive user statistics
- `getGlobalStats()` - Get global application statistics
- `subscribeToStatsChanges(userId, callback)` - Subscribe to stats changes

**Usage:**
```typescript
import { StatisticsService } from '@/services/statisticsService';

const stats = await StatisticsService.getTicketStats(userId);
```

## Benefits

1. **Separation of Concerns**: Business logic is separated from UI components
2. **Reusability**: Services can be used across multiple components
3. **Testability**: Services can be unit tested independently
4. **Maintainability**: Changes to business logic are centralized
5. **Type Safety**: Strong TypeScript interfaces throughout
6. **Real-time Updates**: Built-in subscription mechanisms for live data

## Error Handling

All service methods include proper error handling and return structured error responses:

```typescript
interface ServiceResponse<T> {
  success: boolean;
  error?: string;
  data?: T;
}
```

## Real-time Subscriptions

Services that support real-time updates provide subscription methods that return unsubscribe functions:

```typescript
const unsubscribe = Service.subscribeToChanges(callback);
// Later...
unsubscribe();
```

## Migration Notes

This services layer was created during a comprehensive refactor to separate business logic from React components. All components now use these services instead of direct Supabase calls, providing better maintainability and testability.
