import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Ticket, Calendar, Clock, User, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TicketOperationsService } from '@/services/ticketOperationsService';
import { CalendarService } from '@/services/calendarService';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface TicketCalendarViewProps {
  date: Date;
  onTicketClick?: (ticketId: string) => void;
}

export const TicketCalendarView: React.FC<TicketCalendarViewProps> = ({
  date,
  onTicketClick,
}) => {
  const { user } = useAuth();
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);

  // Get tickets created on this date
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['tickets-by-date', date.toISOString().split('T')[0]],
    queryFn: () => TicketOperationsService.getTicketsByDate(date),
    enabled: !!user?.id,
  });

  // Get calendar events for this date
  const { data: events = [] } = useQuery({
    queryKey: ['events-by-date', date.toISOString().split('T')[0]],
    queryFn: () => CalendarService.getEventsForDay(user!.id, date),
    enabled: !!user?.id,
  });

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

  // Get event color
  const getEventColor = (event: any) => {
    const colorMap: Record<string, string> = {
      personal: 'bg-blue-500',
      academic: 'bg-green-500',
      assignment: 'bg-yellow-500',
      exam: 'bg-red-500',
      meeting: 'bg-purple-500',
      deadline: 'bg-orange-500',
      reminder: 'bg-gray-500',
    };
    return colorMap[event.type] || 'bg-blue-500';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {format(date, 'MMMM d, yyyy', { locale: vi })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {format(date, 'MMMM d, yyyy', { locale: vi })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tickets Section */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            Tickets ({tickets.length})
          </h4>
          {tickets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No tickets created on this date
            </p>
          ) : (
            <div className="space-y-2">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                  onClick={() => onTicketClick?.(ticket.id)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${getPriorityColor(ticket.priority)}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{ticket.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getStatusColor(ticket.status)} variant="secondary">
                          {ticket.status}
                        </Badge>
                        <Badge variant="outline">{ticket.type}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {format(new Date(ticket.created_at), 'HH:mm', { locale: vi })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Events Section */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Events ({events.length})
          </h4>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No events scheduled for this date
            </p>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full`}
                      style={{ backgroundColor: event.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{event.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{event.type}</Badge>
                        {event.location && (
                          <span className="text-xs text-muted-foreground">
                            📍 {event.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {event.isAllDay
                      ? 'All day'
                      : format(new Date(event.startDate), 'HH:mm', { locale: vi })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{tickets.length}</p>
              <p className="text-xs text-muted-foreground">Tickets</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary">{events.length}</p>
              <p className="text-xs text-muted-foreground">Events</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
