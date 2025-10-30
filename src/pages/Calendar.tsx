import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Calendar as CalendarIcon, Clock, MapPin, Tag, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Calendar } from '@/components/Calendar';
import { EventForm } from '@/components/EventForm';
import { CalendarService, CalendarEvent } from '@/services/calendarService';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate(); // thêm hook này
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);

  // Get upcoming events
  const { data: rawUpcomingEvents, isLoading: isLoadingUpcoming } = useQuery<CalendarEvent[]>({
    queryKey: ['upcoming-events', user?.id],
    queryFn: () => CalendarService.getUpcomingEvents(user!.id),
    enabled: !!user?.id,
  });

  // Filter out null/undefined events
  const upcomingEvents = rawUpcomingEvents || [];
  const validUpcomingEvents = upcomingEvents.filter((event) => event != null);

  // Handle event click
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventDetailOpen(true);
  };

  // Handle date click
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsEventFormOpen(true);
  };

  // Handle create event
  const handleCreateEvent = (date: Date) => {
    setSelectedDate(date);
    setIsEventFormOpen(true);
  };

  // Handle edit event
  const handleEditEvent = () => {
    setIsEventDetailOpen(false);
    setIsEventFormOpen(true);
  };

  // Handle form success
  const handleFormSuccess = () => {
    // Invalidate all calendar-related queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    queryClient.invalidateQueries({ queryKey: ['calendar-tickets'] });
    queryClient.invalidateQueries({ queryKey: ['upcoming-events'] });
    
    setIsEventFormOpen(false);
    setSelectedEvent(null);
    setSelectedDate(null);
  };

  // Get event color
  const getEventColor = (event: CalendarEvent | null): string => {
    if (!event) return 'bg-blue-500';
    
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Quay lại Dashboard
          </Button>
        </div>
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">
            Manage your events and track your schedule
          </p>
        </div>
        <Button onClick={() => handleCreateEvent(new Date())}>
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Calendar */}
        <div className="lg:col-span-3">
          <Calendar
            onEventClick={handleEventClick}
            onDateClick={handleDateClick}
            onCreateEvent={handleCreateEvent}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[400px] overflow-y-auto scrollbar-beautiful">
              {validUpcomingEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No upcoming events
                </p>
              ) : (
                <div className="space-y-3">
                  {validUpcomingEvents.slice(0, 5).map((event) => (
                    event && (
                      <div
                        key={event.id}
                        className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
                        onClick={() => handleEventClick(event)}
                      >
                        <div
                          className={`w-3 h-3 rounded-full mt-1.5 ${getEventColor(event)}`}
                        />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(event.startDate), 'MMM d, HH:mm', { locale: vi })}
                        </p>
                        {event.location && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </p>
                        )}
                      </div>
                    </div>
                    )
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Events</span>
                  <Badge variant="secondary">0</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">This Week</span>
                  <Badge variant="secondary">0</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Today</span>
                  <Badge variant="secondary">0</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Event Detail Dialog */}
      <Dialog open={isEventDetailOpen} onOpenChange={setIsEventDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${getEventColor(selectedEvent)}`}
              />
              {selectedEvent?.title}
            </DialogTitle>
            <DialogDescription>
              View and manage your calendar event details
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              {/* Event Details */}
              <div className="space-y-3">
                {selectedEvent.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="text-sm">{selectedEvent.description}</p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {selectedEvent.isAllDay
                      ? format(new Date(selectedEvent.startDate), 'MMM d, yyyy', { locale: vi })
                      : format(new Date(selectedEvent.startDate), 'MMM d, yyyy HH:mm', { locale: vi })}
                  </span>
                </div>

                {selectedEvent.endDate && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {selectedEvent.isAllDay
                        ? format(new Date(selectedEvent.endDate), 'MMM d, yyyy', { locale: vi })
                        : format(new Date(selectedEvent.endDate), 'MMM d, yyyy HH:mm', { locale: vi })}
                    </span>
                  </div>
                )}

                {selectedEvent.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedEvent.location}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline">{selectedEvent.type}</Badge>
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Created by you</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={handleEditEvent}>
                  Edit
                </Button>
                <Button variant="outline" onClick={() => setIsEventDetailOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Event Form Dialog */}
      <EventForm
        isOpen={isEventFormOpen}
        onClose={() => setIsEventFormOpen(false)}
        onSuccess={handleFormSuccess}
        event={selectedEvent || undefined}
        selectedDate={selectedDate || undefined}
      />
    </div>
  );
};

export default CalendarPage;
