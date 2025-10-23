import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ticket, Calendar, Plus, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { CalendarService, CreateEventData } from '@/services/calendarService';
import { TicketOperationsService } from '@/services/ticketOperationsService';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface TicketCalendarIntegrationProps {
  ticketId: string;
  onClose: () => void;
}

export const TicketCalendarIntegration: React.FC<TicketCalendarIntegrationProps> = ({
  ticketId,
  onClose,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  // Get ticket details
  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => TicketOperationsService.getTicketById(ticketId),
    enabled: !!ticketId,
  });

  // Get existing calendar events for this ticket
  const { data: ticketEvents = [] } = useQuery({
    queryKey: ['ticket-events', ticketId],
    queryFn: () => CalendarService.getEventsByType(user!.id, 'ticket'),
    enabled: !!user?.id,
  });

  // Create event from ticket mutation
  const createEventMutation = useMutation({
    mutationFn: (eventData: CreateEventData) => 
      CalendarService.createEventFromTicket(ticketId, eventData, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      setIsCreatingEvent(false);
    },
  });

  // Handle create event
  const handleCreateEvent = (eventData: CreateEventData) => {
    createEventMutation.mutate(eventData);
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-blue-500',
      medium: 'bg-yellow-500',
      high: 'bg-orange-500',
      critical: 'bg-red-500',
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-500';
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const colors = {
      open: 'bg-green-500',
      in_progress: 'bg-blue-500',
      resolved: 'bg-gray-500',
      closed: 'bg-gray-400',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  if (isLoading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
            <DialogDescription>Please wait while we load the ticket information.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!ticket) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ticket not found</DialogTitle>
            <DialogDescription>The requested ticket could not be found.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Add to Calendar
          </DialogTitle>
          <DialogDescription>
            Convert this ticket to a calendar event and manage your schedule.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[500px] overflow-y-auto scrollbar-glass">
          {/* Ticket Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{ticket.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className={getPriorityColor(ticket.priority)}>
                  {ticket.priority}
                </Badge>
                <Badge className={getStatusColor(ticket.status)}>
                  {ticket.status}
                </Badge>
                <Badge variant="outline">{ticket.type}</Badge>
              </div>
              
              {ticket.description && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {ticket.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Created: {format(new Date(ticket.createdAt), 'MMM d, yyyy', { locale: vi })}</span>
                {ticket.dueDate && (
                  <span>Due: {format(new Date(ticket.dueDate), 'MMM d, yyyy', { locale: vi })}</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Existing Events */}
          {ticketEvents.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Existing Calendar Events</h4>
              <div className="space-y-2">
                {ticketEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: event.color }}
                      />
                      <div>
                        <p className="text-sm font-medium">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(event.startDate), 'MMM d, yyyy HH:mm', { locale: vi })}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Create Event Form */}
          {isCreatingEvent ? (
            <CreateEventForm
              ticket={ticket}
              onCreateEvent={handleCreateEvent}
              onCancel={() => setIsCreatingEvent(false)}
            />
          ) : (
            <div className="flex gap-2">
              <Button onClick={() => setIsCreatingEvent(true)} className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Create Calendar Event
              </Button>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Create Event Form Component
interface CreateEventFormProps {
  ticket: any;
  onCreateEvent: (eventData: CreateEventData) => void;
  onCancel: () => void;
}

const CreateEventForm: React.FC<CreateEventFormProps> = ({
  ticket,
  onCreateEvent,
  onCancel,
}) => {
  const [eventData, setEventData] = useState<CreateEventData>({
    title: ticket.title,
    description: `Ticket: ${ticket.title}`,
    type: 'assignment',
    startDate: ticket.dueDate ? new Date(ticket.dueDate) : new Date(),
    endDate: ticket.dueDate ? new Date(ticket.dueDate) : undefined,
    isAllDay: false,
    location: '',
    color: '#f59e0b', // Yellow for assignments
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateEvent(eventData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Event Title</label>
        <input
          type="text"
          value={eventData.title}
          onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
          className="w-full mt-1 p-2 border rounded-md"
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium">Start Date</label>
        <input
          type="datetime-local"
          value={format(eventData.startDate, "yyyy-MM-dd'T'HH:mm")}
          onChange={(e) => setEventData({ ...eventData, startDate: new Date(e.target.value) })}
          className="w-full mt-1 p-2 border rounded-md"
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium">End Date (Optional)</label>
        <input
          type="datetime-local"
          value={eventData.endDate ? format(eventData.endDate, "yyyy-MM-dd'T'HH:mm") : ''}
          onChange={(e) => setEventData({ 
            ...eventData, 
            endDate: e.target.value ? new Date(e.target.value) : undefined 
          })}
          className="w-full mt-1 p-2 border rounded-md"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isAllDay"
          checked={eventData.isAllDay}
          onChange={(e) => setEventData({ ...eventData, isAllDay: e.target.checked })}
          className="rounded"
        />
        <label htmlFor="isAllDay" className="text-sm">All Day Event</label>
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          Create Event
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};
