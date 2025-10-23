import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, MoreHorizontal, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarService, CalendarEvent } from '@/services/calendarService';
import { TicketOperationsService } from '@/services/ticketOperationsService';
import { useAuth } from '@/hooks/useAuth';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { vi } from 'date-fns/locale';

interface CalendarProps {
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  onCreateEvent?: (date: Date) => void;
}

export const Calendar: React.FC<CalendarProps> = ({
  onEventClick,
  onDateClick,
  onCreateEvent,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Get events for current month
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendar-events', user?.id, currentDate.getFullYear(), currentDate.getMonth() + 1],
    queryFn: () => CalendarService.getEventsForMonth(
      user!.id,
      currentDate.getFullYear(),
      currentDate.getMonth() + 1
    ),
    enabled: !!user?.id,
    onSuccess: (data) => {
      // Calendar events loaded
    },
    onError: (error) => {
      console.error('Error loading calendar events:', error);
    },
  });

  // Get tickets for current month
  const { data: tickets = [], isLoading: isLoadingTickets } = useQuery({
    queryKey: ['calendar-tickets', user?.id, currentDate.getFullYear(), currentDate.getMonth() + 1],
    queryFn: () => TicketOperationsService.getTicketsForMonth(
      user!.id,
      currentDate.getFullYear(),
      currentDate.getMonth() + 1
    ),
    enabled: !!user?.id,
    onSuccess: (data) => {
      // Calendar tickets loaded
    },
    onError: (error) => {
      console.error('Error loading calendar tickets:', error);
    },
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: (eventId: string) => CalendarService.deleteEvent(eventId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });

  // Calendar navigation
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start week on Monday
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  }, [currentDate]);

  // Get events for a specific day
  const getEventsForDay = (date: Date): CalendarEvent[] => {
    return events.filter(event => 
      isSameDay(new Date(event.startDate), date)
    );
  };

  // Get tickets for a specific day
  const getTicketsForDay = (date: Date): Ticket[] => {
    return tickets.filter(ticket => {
      const ticketDate = new Date(ticket.created_at);
      return isSameDay(ticketDate, date);
    });
  };

  // Get event color
  const getEventColor = (event: CalendarEvent): string => {
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

  // Get ticket color
  const getTicketColor = (ticket: Ticket): string => {
    const colorMap: Record<string, string> = {
      low: 'bg-blue-500',
      medium: 'bg-yellow-500',
      high: 'bg-orange-500',
      critical: 'bg-red-500',
    };
    return colorMap[ticket.priority] || 'bg-gray-500';
  };

  // Handle ticket click
  const handleTicketClick = (ticket: Ticket, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent date click
    navigate(`/tickets/${ticket.id}`);
  };

  // Handle event click
  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    onEventClick?.(event);
  };

  // Handle date click
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateClick?.(date);
  };

  // Handle create event
  const handleCreateEvent = (date: Date, e: React.MouseEvent) => {
    e.stopPropagation();
    onCreateEvent?.(date);
  };

  // Handle delete event
  const handleDeleteEvent = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this event?')) {
      deleteEventMutation.mutate(eventId);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendar
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold">
            {format(currentDate, 'MMMM yyyy', { locale: vi })}
          </h2>
        </div>
      </CardHeader>
      <CardContent>
        {/* Calendar Header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 scrollbar-beautiful">
          {calendarDays.map((day, index) => {
            const dayEvents = getEventsForDay(day);
            const dayTickets = getTicketsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isCurrentDay = isToday(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);


            return (
              <div
                key={index}
                className={`
                  min-h-[100px] p-1 border rounded-lg cursor-pointer transition-colors
                  ${isCurrentMonth ? 'bg-background' : 'bg-muted/50'}
                  ${isCurrentDay ? 'bg-primary/10 border-primary' : ''}
                  ${isSelected ? 'bg-primary/20 border-primary' : ''}
                  hover:bg-muted/80
                `}
                onClick={() => handleDateClick(day)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`
                    text-sm font-medium
                    ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}
                    ${isCurrentDay ? 'text-primary font-bold' : ''}
                  `}>
                    {format(day, 'd')}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) => handleCreateEvent(day, e)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                {/* Events and Tickets */}
                <div className="space-y-1">
                  {/* Events */}
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={`event-${event.id}`}
                      className={`
                        text-xs p-1 rounded cursor-pointer truncate
                        ${getEventColor(event)} text-white
                        hover:opacity-80
                      `}
                      onClick={(e) => handleEventClick(event, e)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{event.title}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1 opacity-0 hover:opacity-100"
                          onClick={(e) => handleDeleteEvent(event.id, e)}
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Tickets */}
                  {dayTickets.slice(0, 2).map((ticket) => (
                    <div
                      key={`ticket-${ticket.id}`}
                      onClick={(e) => handleTicketClick(ticket, e)}
                      className={`
                        text-xs p-1 rounded cursor-pointer truncate
                        ${getTicketColor(ticket)} text-white
                        hover:opacity-80 transition-opacity
                      `}
                      title={`Click to view ticket: ${ticket.title}`}
                    >
                      <div className="flex items-center gap-1">
                        <Ticket className="h-3 w-3" />
                        <span className="truncate">{ticket.title}</span>
                      </div>
                    </div>
                  ))}
                  
                  {/* Show more indicator */}
                  {(dayEvents.length + dayTickets.length) > 4 && (
                    <div className="text-xs text-muted-foreground">
                      +{(dayEvents.length + dayTickets.length) - 4} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-xs text-muted-foreground">Personal</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-xs text-muted-foreground">Academic</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span className="text-xs text-muted-foreground">Assignment</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-xs text-muted-foreground">Exam</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span className="text-xs text-muted-foreground">Meeting</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span className="text-xs text-muted-foreground">Deadline</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
