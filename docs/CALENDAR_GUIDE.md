# Calendar System Guide

## Overview

The Calendar system provides a comprehensive solution for managing events and integrating with the ticket system. It features a Google Calendar-like interface with full CRUD operations and ticket integration.

## Features

### 🗓️ Calendar Management
- **Month View**: Full calendar grid with navigation
- **Event Creation**: Create events with detailed information
- **Event Editing**: Update existing events
- **Event Deletion**: Remove events with confirmation
- **Color Coding**: Visual categorization by event type

### 🎫 Ticket Integration
- **Ticket Display**: View tickets created on specific dates
- **Add to Calendar**: Convert tickets to calendar events
- **Event Linking**: Link calendar events to tickets
- **Due Date Tracking**: Visual representation of ticket deadlines

### 🎨 Event Types
- **Personal**: Personal events (blue)
- **Academic**: Academic-related events (green)
- **Assignment**: Assignment deadlines (yellow)
- **Exam**: Exam schedules (red)
- **Meeting**: Meetings and appointments (purple)
- **Deadline**: Important deadlines (orange)
- **Reminder**: General reminders (gray)

## Database Schema

### Calendar Events Table
```sql
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type event_type DEFAULT 'personal',
  status event_status DEFAULT 'scheduled',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  is_all_day BOOLEAN DEFAULT false,
  location TEXT,
  color TEXT DEFAULT '#3b82f6',
  user_id UUID NOT NULL REFERENCES profiles(id),
  ticket_id UUID REFERENCES tickets(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Event Types Enum
```sql
CREATE TYPE event_type AS ENUM(
  'personal', 'academic', 'assignment', 
  'exam', 'meeting', 'deadline', 'reminder'
);
```

### Event Status Enum
```sql
CREATE TYPE event_status AS ENUM(
  'scheduled', 'in_progress', 'completed', 'cancelled'
);
```

## API Endpoints

### Calendar Service Methods

#### Create Event
```typescript
CalendarService.createEvent(eventData: CreateEventData, userId: string)
```

#### Get Events
```typescript
CalendarService.getEvents(userId: string, filters?: CalendarFilters)
CalendarService.getEventsForMonth(userId: string, year: number, month: number)
CalendarService.getEventsForDay(userId: string, date: Date)
```

#### Update Event
```typescript
CalendarService.updateEvent(eventId: string, eventData: UpdateEventData, userId: string)
```

#### Delete Event
```typescript
CalendarService.deleteEvent(eventId: string, userId: string)
```

#### Ticket Integration
```typescript
CalendarService.createEventFromTicket(ticketId: string, eventData: CreateEventData, userId: string)
CalendarService.getTicketsByDate(date: Date)
```

## Components

### Calendar Component
- **Location**: `src/components/Calendar.tsx`
- **Features**: Month view, event display, navigation
- **Props**: `onEventClick`, `onDateClick`, `onCreateEvent`

### Event Form Component
- **Location**: `src/components/EventForm.tsx`
- **Features**: Create/edit events, validation, color selection
- **Props**: `isOpen`, `onClose`, `onSuccess`, `event`, `selectedDate`

### Ticket Calendar Integration
- **Location**: `src/components/TicketCalendarIntegration.tsx`
- **Features**: Convert tickets to events, link existing events
- **Props**: `ticketId`, `onClose`

### Ticket Calendar View
- **Location**: `src/components/TicketCalendarView.tsx`
- **Features**: Display tickets and events for a specific date
- **Props**: `date`, `onTicketClick`

## Usage Examples

### Creating an Event
```typescript
const eventData: CreateEventData = {
  title: "Team Meeting",
  description: "Weekly team standup",
  type: "meeting",
  startDate: new Date("2024-01-15T10:00:00"),
  endDate: new Date("2024-01-15T11:00:00"),
  isAllDay: false,
  location: "Conference Room A",
  color: "#8b5cf6"
};

await CalendarService.createEvent(eventData, userId);
```

### Getting Events for a Month
```typescript
const events = await CalendarService.getEventsForMonth(
  userId, 
  2024, 
  1 // January
);
```

### Creating Event from Ticket
```typescript
const eventData: CreateEventData = {
  title: ticket.title,
  description: `Ticket: ${ticket.title}`,
  type: "assignment",
  startDate: ticket.dueDate,
  color: "#f59e0b"
};

await CalendarService.createEventFromTicket(ticketId, eventData, userId);
```

## Integration with Ticket System

### Ticket Detail Page
- Added "Add to Calendar" button
- Opens TicketCalendarIntegration dialog
- Allows creating calendar events from tickets

### Calendar Page
- Full calendar view with ticket integration
- Sidebar showing upcoming events
- Quick stats and navigation

### Navigation
- Added Calendar route: `/calendar`
- Protected route requiring authentication
- Integrated with main navigation

## Styling and Theming

### Color Scheme
- **Personal**: Blue (#3b82f6)
- **Academic**: Green (#10b981)
- **Assignment**: Yellow (#f59e0b)
- **Exam**: Red (#ef4444)
- **Meeting**: Purple (#8b5cf6)
- **Deadline**: Orange (#f97316)
- **Reminder**: Gray (#6b7280)

### Responsive Design
- Mobile-first approach
- Grid layout for calendar
- Touch-friendly interactions
- Responsive sidebar

## Security

### Row Level Security (RLS)
```sql
-- Users can only access their own events
CREATE POLICY "Users can view their own events" ON calendar_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own events" ON calendar_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events" ON calendar_events
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events" ON calendar_events
    FOR DELETE USING (auth.uid() = user_id);
```

### Data Validation
- Required fields validation
- Date range validation
- Title length limits
- Type and status validation

## Performance Optimizations

### Database Indexes
```sql
CREATE INDEX idx_calendar_events_user_id ON calendar_events (user_id);
CREATE INDEX idx_calendar_events_start_date ON calendar_events (start_date);
CREATE INDEX idx_calendar_events_user_date ON calendar_events (user_id, start_date);
```

### React Query Caching
- Events cached for 5 minutes
- Invalidation on mutations
- Optimistic updates for better UX

## Migration Guide

### Database Migration
1. Run the migration: `0009_calendar_events.sql`
2. Apply RLS policies
3. Create necessary indexes

### Code Integration
1. Import Calendar components
2. Add Calendar route to App.tsx
3. Update navigation components
4. Test event creation and management

## Troubleshooting

### Common Issues

#### Events Not Loading
- Check user authentication
- Verify RLS policies
- Check database connection

#### Event Creation Fails
- Validate required fields
- Check date format
- Verify user permissions

#### Ticket Integration Issues
- Ensure ticket exists
- Check user ownership
- Verify event data format

### Debug Tips
- Check browser console for errors
- Verify Supabase connection
- Test with simple events first
- Check network requests in DevTools

## Future Enhancements

### Planned Features
- **Recurring Events**: Support for recurring events
- **Event Sharing**: Share events with other users
- **Notifications**: Event reminders and notifications
- **Export/Import**: Calendar data export/import
- **Mobile App**: Native mobile calendar app
- **Sync**: Integration with external calendars (Google, Outlook)

### Advanced Features
- **AI Suggestions**: Smart event scheduling
- **Conflict Detection**: Automatic conflict resolution
- **Time Zones**: Multi-timezone support
- **Attachments**: File attachments for events
- **Collaboration**: Multi-user event editing
