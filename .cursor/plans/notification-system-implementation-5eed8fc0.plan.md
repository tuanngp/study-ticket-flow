<!-- 5eed8fc0-8c61-4e8f-8abf-686988c02b14 e55bc28b-ddc9-4501-aa9b-e9405d88c2db -->
# Notification System Implementation Plan

## Overview

Implement comprehensive notification system for all ticket lifecycle events, comments, AI actions, and analytics alerts with in-app + email delivery via Supabase real-time subscriptions.

## Phase 1: Database Schema & Types

### Create notifications table migration

- File: `supabase/migrations/0003_notifications_system.sql`
- Create `notifications` table with fields: id, user_id, type, title, message, priority, ticket_id, metadata (jsonb), is_read, read_at, delivered_channels (text array), actions (jsonb), created_at
- Create `notification_type` enum with all use case types
- Add indexes for user_id, ticket_id, is_read, created_at
- Add foreign keys to profiles and tickets tables

### Create notification preferences table (future-ready)

- Table: `notification_preferences` for future use
- Fields: user_id, notification_type, enabled, channels
- Note: Initially all notifications enabled by default

### TypeScript types

- File: `src/services/notificationService.ts`
- Define NotificationType enum (ticket_created, ticket_assigned, ticket_status_changed, ticket_resolved, ticket_due_soon, comment_added, mention, ai_triage_complete, assignment_failed, deadline_warning, similar_ticket_found, weekly_report, trend_alert, workload_high, sla_breach)
- Define NotificationPayload interface
- Define NotificationAction interface
- Define NotificationChannel type

## Phase 2: Core Notification Service

### NotificationService implementation

- File: `src/services/notificationService.ts`
- Method: `send()` - Send notification to users
- Method: `sendBatch()` - Send to multiple users
- Method: `markAsRead()` - Mark notification as read
- Method: `markAllAsRead()` - Mark all user notifications as read
- Method: `getUserNotifications()` - Get user's notifications with pagination
- Method: `getUnreadCount()` - Get unread notification count
- Method: `deleteNotification()` - Delete notification
- Helper: `determineRecipients()` - Calculate who should receive notification based on type and context
- Helper: `formatNotificationContent()` - Format notification message with educational context

### Email notification integration

- File: `src/services/emailNotificationService.ts`
- Use Supabase Auth email templates
- Method: `sendEmailNotification()` - Send email via Supabase
- Method: `formatEmailContent()` - Format email HTML with branding
- Integration with NotificationService for dual delivery

## Phase 3: Notification Triggers

### Ticket lifecycle triggers

- File: `src/services/ticketOperationsService.ts`
- Trigger on ticket creation -> notify instructor/lead
- Trigger on ticket assignment -> notify assignee with educational context
- Trigger on status change -> notify creator, assignee, watchers
- Trigger on ticket resolved -> notify creator, request feedback
- Add `NotificationService.send()` calls to existing methods

### Comment triggers

- File: `src/services/commentService.ts`
- Trigger on new comment -> notify ticket participants
- Detect @mentions in comments -> notify mentioned users
- Update `createComment()` to send notifications

### AI triage triggers

- File: `src/services/ticketService.ts`
- Trigger after AI analysis completes -> notify creator (optional)
- Trigger on auto-assignment failure -> notify admins/managers
- Add notification calls in `createTicket()` workflow

### Due date monitoring

- File: `src/services/dueDateMonitorService.ts` (new)
- Scheduled job to check upcoming due dates
- Send warnings at 48h, 24h, 6h before deadline
- Escalate priority on approaching deadlines

## Phase 4: UI Components

### NotificationBell component

- File: `src/components/NotificationBell.tsx`
- Bell icon in Navbar with unread count badge
- Dropdown popover showing recent notifications
- Mark as read on click
- Real-time updates via Supabase subscription
- Link to full notifications page

### NotificationList component

- File: `src/components/NotificationList.tsx`
- Display notifications with proper formatting
- Group by date (Today, Yesterday, This Week, Older)
- Show priority indicators (urgent notifications highlighted)
- Action buttons (View Ticket, Dismiss, Mark as Read)
- Infinite scroll or pagination

### NotificationItem component

- File: `src/components/NotificationItem.tsx`
- Display individual notification with icon, title, message
- Timestamp with relative time (formatDistanceToNow)
- Priority-based styling
- Click handler to navigate to relevant ticket/page
- Mark as read on view

### NotificationsPage

- File: `src/pages/Notifications.tsx`
- Full-page view of all notifications
- Filters by type, read/unread status
- Mark all as read button
- Delete functionality

## Phase 5: Integration Points

### Update Navbar

- File: `src/components/Navbar.tsx`
- Add NotificationBell component next to user profile
- Position between navigation and sign out button

### Update routing

- File: `src/App.tsx`
- Add route `/notifications` -> NotificationsPage

### Update TicketDetail page

- File: `src/pages/TicketDetail.tsx`
- Trigger notifications on status updates
- Trigger notifications on comment adds
- Already has necessary hooks, just add notification calls

## Phase 6: Real-time Subscriptions

### Notification subscription hook

- File: `src/hooks/useNotifications.ts`
- Use Supabase real-time to subscribe to user's notifications
- Auto-update notification list on new notifications
- Return notifications, unreadCount, loading state
- Expose markAsRead, markAllAsRead methods

### Supabase real-time setup

- File: `src/services/notificationService.ts`
- Method: `subscribeToUserNotifications()` - Set up real-time channel
- Listen for INSERT, UPDATE events on notifications table
- Filter by current user_id
- Return cleanup function

## Phase 7: Email Templates

### Supabase email configuration

- Use existing Supabase Auth email settings
- Customize templates in Supabase dashboard
- Templates needed:
- Ticket assigned notification
- Comment notification
- Status change notification
- Due date warning

### Email HTML templates

- File: `src/templates/emailTemplates.ts`
- Function: `ticketAssignedEmail()` - HTML template
- Function: `commentAddedEmail()` - HTML template
- Function: `statusChangedEmail()` - HTML template
- Function: `dueDateWarningEmail()` - HTML template
- Include educational context, direct links, call-to-action buttons

## Phase 8: Analytics & Monitoring

### Notification analytics

- Track notification delivery success/failure
- Track notification open rates (mark as read)
- Track action click-through rates
- Store in notification metadata or separate analytics table

## Implementation Order

1. Database migration (Phase 1)
2. Core NotificationService (Phase 2)
3. Ticket & comment triggers (Phase 3 - P0)
4. UI Components - NotificationBell & Item (Phase 4)
5. Real-time subscriptions (Phase 6)
6. Navbar integration (Phase 5)
7. Full notifications page (Phase 4)
8. Email integration (Phase 2, Phase 7)
9. AI triage triggers (Phase 3 - P1/P2)
10. Due date monitoring (Phase 3 - P1)
11. Analytics setup (Phase 8 - P3)

## Key Files to Create/Modify

### New Files:

- `supabase/migrations/0003_notifications_system.sql`
- `src/services/notificationService.ts`
- `src/services/emailNotificationService.ts`
- `src/services/dueDateMonitorService.ts`
- `src/components/NotificationBell.tsx`
- `src/components/NotificationList.tsx`
- `src/components/NotificationItem.tsx`
- `src/pages/Notifications.tsx`
- `src/hooks/useNotifications.ts`
- `src/templates/emailTemplates.ts`

### Modified Files:

- `src/services/ticketOperationsService.ts`
- `src/services/commentService.ts`
- `src/services/ticketService.ts`
- `src/components/Navbar.tsx`
- `src/App.tsx`

## Testing Strategy

- Test each notification type manually
- Test real-time updates with multiple users
- Test email delivery via Supabase
- Test notification read/unread states
- Test with different user roles (student, TA, instructor)
- Test notification filtering and pagination
- Test performance with large notification volumes

### To-dos

- [ ] Create database migration for notifications table with all fields, indexes, and foreign keys
- [ ] Define TypeScript types and interfaces for notification system (NotificationType, NotificationPayload, etc.)
- [ ] Implement NotificationService with send, markAsRead, getUserNotifications, and helper methods
- [ ] Create EmailNotificationService for Supabase email integration
- [ ] Add notification triggers to ticket lifecycle events (create, assign, status change, resolve)
- [ ] Add notification triggers to comment events (new comment, @mentions)
- [ ] Create NotificationBell component with dropdown and unread count badge
- [ ] Create NotificationItem component with formatting, actions, and click handlers
- [ ] Create NotificationList component with grouping, filtering, and infinite scroll
- [ ] Create useNotifications hook with Supabase real-time subscription
- [ ] Add NotificationBell to Navbar component
- [ ] Create full NotificationsPage with filters and bulk actions
- [ ] Add /notifications route to App.tsx
- [ ] Create HTML email templates for different notification types
- [ ] Add notification triggers for AI triage events (complete, failure)
- [ ] Create dueDateMonitorService for scheduled deadline warnings