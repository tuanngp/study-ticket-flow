import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Calendar as CalendarIcon, Clock, MapPin, Tag, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Calendar } from '@/components/Calendar';
import { EventForm } from '@/components/EventForm';
import { UserHomeSidebar } from '@/components/UserHomeSidebar';
import { CalendarService, CalendarEvent } from '@/services/calendarService';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { t } from '@/lib/translations';
import { FullPageLoadingSpinner } from '@/components/LoadingSpinner';
import { useEffect } from 'react';

const CalendarPage: React.FC = () => {
  const { user, profile, loading: authLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth");
      return;
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Get upcoming events
  const { data: rawUpcomingEvents, isLoading: isLoadingUpcoming } = useQuery<CalendarEvent[]>({
    queryKey: ['upcoming-events', user?.id],
    queryFn: () => CalendarService.getUpcomingEvents(user!.id),
    enabled: !!user?.id,
  });

  // Get all events for current month
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  const { data: rawMonthEvents, isLoading: isLoadingMonth } = useQuery<CalendarEvent[]>({
    queryKey: ['month-events', user?.id, currentYear, currentMonth],
    queryFn: () => CalendarService.getEventsForMonth(user!.id, currentYear, currentMonth),
    enabled: !!user?.id,
  });

  // Filter out null/undefined events
  const upcomingEvents = rawUpcomingEvents || [];
  const validUpcomingEvents = upcomingEvents.filter((event) => event != null);
  
  const monthEvents = rawMonthEvents || [];
  const validMonthEvents = monthEvents.filter((event) => event != null);

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

  // Get event color - prioritize event.color, fallback to type-based color
  const getEventColor = (event: CalendarEvent | null): string => {
    if (!event) return 'bg-blue-500';
    
    // If event has a custom color, use it
    if (event.color) {
      return event.color;
    }
    
    // Otherwise, use type-based color mapping
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

  if (authLoading) {
    return <FullPageLoadingSpinner />;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <UserHomeSidebar user={user} profile={profile} />
        <SidebarInset className="flex-1 overflow-auto bg-gradient-to-br from-background via-background to-muted/20">
          <div className="container mx-auto p-6 space-y-6 max-w-[1600px]">
            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              {/* Main Calendar Section - Takes 8 columns */}
              <div className="xl:col-span-8 space-y-6">
                {/* Calendar Card */}
                <Card className="shadow-lg border-2 overflow-hidden">
                  <CardHeader className="border-b bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 dark:from-primary/10 dark:via-primary/20 dark:to-primary/10">
                    <CardTitle className="flex items-center gap-2.5 text-xl font-bold">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <CalendarIcon className="h-5 w-5 text-primary" />
                      </div>
                      Lịch trình của bạn
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 bg-card">
                    <Calendar
                      onEventClick={handleEventClick}
                      onDateClick={handleDateClick}
                      onCreateEvent={handleCreateEvent}
                    />
                  </CardContent>
                </Card>

                {/* Event Types Legend Card - Below Calendar */}
                <Card className="shadow-md border-2">
                  <CardHeader className="border-b bg-gradient-to-r from-purple-50/50 to-purple-100/30 dark:from-purple-950/20 dark:to-purple-900/10">
                    <CardTitle className="flex items-center gap-2.5 text-lg">
                      <div className="p-1.5 bg-purple-500/10 rounded-lg">
                        <Tag className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      Loại sự kiện
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4">
                      {[
                        { type: 'personal', label: 'Cá nhân', color: 'bg-blue-500' },
                        { type: 'academic', label: 'Học thuật', color: 'bg-green-500' },
                        { type: 'assignment', label: 'Bài tập', color: 'bg-yellow-500' },
                        { type: 'exam', label: 'Thi cử', color: 'bg-red-500' },
                        { type: 'meeting', label: 'Cuộc họp', color: 'bg-purple-500' },
                        { type: 'deadline', label: 'Hạn chót', color: 'bg-orange-500' },
                        { type: 'reminder', label: 'Nhắc nhở', color: 'bg-gray-500' },
                      ].map((item) => (
                        <div 
                          key={item.type} 
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border hover:bg-accent/50 hover:border-primary/30 transition-all group"
                        >
                          <div className={`w-3 h-3 rounded-full ${item.color} shadow-sm`} />
                          <span className="text-sm font-medium text-foreground">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Sidebar - Takes 4 columns */}
              <div className="xl:col-span-4 space-y-6 flex flex-col">
                {/* Upcoming Events */}
                <Card className="shadow-md border-2 flex-1">
                  <CardHeader className="border-b bg-gradient-to-r from-blue-50/50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="p-1.5 bg-blue-500/10 rounded-lg">
                        <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      Sự kiện sắp tới
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 max-h-[450px] overflow-y-auto scrollbar-beautiful min-h-[280px]">
                    {validUpcomingEvents.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 bg-muted/30 rounded-full flex items-center justify-center">
                          <CalendarIcon className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          Chưa có sự kiện nào
                        </p>
                        <p className="text-xs text-muted-foreground/70 mb-4">
                          Tạo sự kiện đầu tiên để bắt đầu
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="shadow-sm hover:shadow-md transition-all"
                          onClick={() => handleCreateEvent(new Date())}
                        >
                          <Plus className="h-3 w-3 mr-2" />
                          Tạo sự kiện
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {validUpcomingEvents.slice(0, 10).map((event) => (
                          event && (
                            <div
                              key={event.id}
                              className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-all hover:shadow-md hover:border-primary/30 group"
                              onClick={() => handleEventClick(event)}
                            >
                              {(() => {
                                const eventColor = getEventColor(event);
                                const isHexColor = eventColor.startsWith('#');
                                return (
                                  <div
                                    className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 shadow-sm ${isHexColor ? '' : eventColor} group-hover:scale-125 transition-transform`}
                                    style={isHexColor ? { backgroundColor: eventColor } : undefined}
                                  />
                                );
                              })()}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                                  {event.title}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(event.startDate), 'MMM d, HH:mm', { locale: vi })}
                                </p>
                                {event.location && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1.5">
                                    <MapPin className="h-3 w-3" />
                                    <span className="truncate">{event.location}</span>
                                  </p>
                                )}
                              </div>
                            </div>
                          )
                        ))}
                        {validUpcomingEvents.length > 10 && (
                          <p className="text-xs text-muted-foreground text-center pt-2">
                            Và {validUpcomingEvents.length - 10} sự kiện khác
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card className="shadow-md border-2">
                  <CardHeader className="border-b bg-gradient-to-r from-green-50/50 to-green-100/30 dark:from-green-950/20 dark:to-green-900/10">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="p-1.5 bg-green-500/10 rounded-lg">
                        <CalendarIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      Thống kê tháng này
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-muted/40 to-muted/20 hover:from-muted/60 hover:to-muted/40 transition-all border border-transparent hover:border-muted-foreground/20">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 bg-blue-500/10 rounded-md">
                            <CalendarIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="text-sm font-medium">Tổng sự kiện</span>
                        </div>
                        <Badge variant="secondary" className="font-bold text-base px-3 py-1">
                          {validMonthEvents.length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-muted/40 to-muted/20 hover:from-muted/60 hover:to-muted/40 transition-all border border-transparent hover:border-muted-foreground/20">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 bg-yellow-500/10 rounded-md">
                            <Clock className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" />
                          </div>
                          <span className="text-sm font-medium">Tuần này</span>
                        </div>
                        <Badge variant="secondary" className="font-bold text-base px-3 py-1">
                          {validMonthEvents.filter(event => {
                            const eventDate = new Date(event.startDate);
                            const today = new Date();
                            const dayOfWeek = today.getDay();
                            const startOfWeek = new Date(today);
                            startOfWeek.setDate(today.getDate() - dayOfWeek);
                            startOfWeek.setHours(0, 0, 0, 0);
                            const endOfWeek = new Date(startOfWeek);
                            endOfWeek.setDate(startOfWeek.getDate() + 6);
                            endOfWeek.setHours(23, 59, 59, 999);
                            return eventDate >= startOfWeek && eventDate <= endOfWeek;
                          }).length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-muted/40 to-muted/20 hover:from-muted/60 hover:to-muted/40 transition-all border border-transparent hover:border-muted-foreground/20">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 bg-purple-500/10 rounded-md">
                            <CalendarIcon className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <span className="text-sm font-medium">Hôm nay</span>
                        </div>
                        <Badge variant="secondary" className="font-bold text-base px-3 py-1">
                          {validMonthEvents.filter(event => {
                            const eventDate = new Date(event.startDate);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const tomorrow = new Date(today);
                            tomorrow.setDate(today.getDate() + 1);
                            return eventDate >= today && eventDate < tomorrow;
                          }).length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/30 shadow-sm">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 bg-primary/20 rounded-md">
                            <Plus className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <span className="text-sm font-semibold text-primary">Sắp tới (7 ngày)</span>
                        </div>
                        <Badge className="bg-primary text-primary-foreground font-bold text-base px-3 py-1 shadow-sm">
                          {validUpcomingEvents.length}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="shadow-md border-2">
                  <CardHeader className="border-b bg-gradient-to-r from-orange-50/50 to-orange-100/30 dark:from-orange-950/20 dark:to-orange-900/10">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="p-1.5 bg-orange-500/10 rounded-lg">
                        <Plus className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      Thao tác nhanh
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-2.5">
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2.5 h-10 hover:bg-primary hover:text-primary-foreground transition-all shadow-sm hover:shadow-md"
                        onClick={() => handleCreateEvent(new Date())}
                      >
                        <Plus className="h-4 w-4" />
                        <span className="font-medium">Tạo sự kiện mới</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2.5 h-10 hover:bg-primary hover:text-primary-foreground transition-all shadow-sm hover:shadow-md"
                        onClick={() => {
                          const today = new Date();
                          handleCreateEvent(today);
                        }}
                      >
                        <CalendarIcon className="h-4 w-4" />
                        <span className="font-medium">Sự kiện hôm nay</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2.5 h-10 hover:bg-primary hover:text-primary-foreground transition-all shadow-sm hover:shadow-md"
                        onClick={() => navigate('/dashboard')}
                      >
                        <Tag className="h-4 w-4" />
                        <span className="font-medium">Xem tickets</span>
                      </Button>
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
                  {selectedEvent && (() => {
                    const eventColor = getEventColor(selectedEvent);
                    const isHexColor = eventColor.startsWith('#');
                    return (
                      <div
                        className={`w-3 h-3 rounded-full ${isHexColor ? '' : eventColor}`}
                        style={isHexColor ? { backgroundColor: eventColor } : undefined}
                      />
                    );
                  })()}
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
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default CalendarPage;
