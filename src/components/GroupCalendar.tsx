import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { GroupEventService, GroupService, type GroupEventWithDetails, type GroupEventType } from '@/services/groupService';
import { toast } from 'sonner';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Clock, 
  MapPin, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Edit,
  Trash2,
  MoreHorizontal
} from 'lucide-react';
import { format, isToday, isTomorrow, isYesterday, addDays, startOfWeek, endOfWeek } from 'date-fns';

interface GroupCalendarProps {
  groupId: string;
  groupName: string;
  courseCode: string;
}

export const GroupCalendar = ({ groupId, groupName, courseCode }: GroupCalendarProps) => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [isEditEventOpen, setIsEditEventOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<GroupEventWithDetails | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  // Fetch group events
  const { data: events, isLoading: isLoadingEvents } = useQuery({
    queryKey: ['group-events', groupId],
    queryFn: () => GroupEventService.getGroupEvents(groupId),
    enabled: !!groupId,
  });

  // Fetch group details for permissions
  const { data: group } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => GroupService.getGroupById(groupId),
    enabled: !!groupId,
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: ({ eventData, eventType }: { eventData: any; eventType: GroupEventType }) =>
      GroupEventService.createGroupEvent(groupId, eventData, eventType, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-events'] });
      setIsCreateEventOpen(false);
      toast.success('Event created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create event');
    },
  });

  // Record attendance mutation
  const recordAttendanceMutation = useMutation({
    mutationFn: ({ eventId, status, reason }: { eventId: string; status: string; reason?: string }) =>
      GroupEventService.recordAttendance(eventId, user!.id, status as any, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-events'] });
      toast.success('Attendance recorded!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to record attendance');
    },
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: ({ eventId, eventData, eventType }: { eventId: string; eventData: any; eventType: GroupEventType }) =>
      GroupEventService.updateGroupEvent(eventId, eventData, eventType, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-events'] });
      setIsEditEventOpen(false);
      setSelectedEvent(null);
      toast.success('Event updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update event');
    },
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: (eventId: string) =>
      GroupEventService.deleteGroupEvent(eventId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-events'] });
      setIsDeleteDialogOpen(false);
      setSelectedEvent(null);
      toast.success('Event deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete event');
    },
  });

  // Students can only view events, not manage them
  const canManageEvents = group && profile?.role !== 'student' && (
    group.createdBy === user?.id || 
    group.instructorId === user?.id ||
    profile?.role === 'admin' ||
    profile?.role === 'instructor' ||
    profile?.role === 'lead' ||
    profile?.role === 'manager'
  );

  const getEventsForDate = (date: Date) => {
    if (!events) return [];
    return events.filter(event => {
      const eventDate = new Date(event.event.startDate);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const getEventsForWeek = (startDate: Date) => {
    if (!events) return [];
    const endDate = addDays(startDate, 6);
    return events.filter(event => {
      const eventDate = new Date(event.event.startDate);
      return eventDate >= startDate && eventDate <= endDate;
    });
  };

  const getEventTypeIcon = (eventType?: string) => {
    if (!eventType) {
      return <CalendarIcon className="h-4 w-4 text-gray-500" />;
    }
    switch (eventType) {
      case 'study_session':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'assignment_deadline':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'exam_schedule':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'group_meeting':
        return <Users className="h-4 w-4 text-purple-500" />;
      case 'teacher_office_hours':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'project_presentation':
        return <CalendarIcon className="h-4 w-4 text-indigo-500" />;
      default:
        return <CalendarIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getEventTypeColor = (eventType?: string) => {
    if (!eventType) {
      return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
    switch (eventType) {
      case 'study_session':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'assignment_deadline':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'exam_schedule':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'group_meeting':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'teacher_office_hours':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'project_presentation':
        return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const formatDateRelative = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM dd, yyyy');
  };

  const renderMonthView = () => {
    const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    const startOfCalendar = startOfWeek(startOfMonth);
    const endOfCalendar = endOfWeek(endOfMonth);

    const days = [];
    const current = new Date(startOfCalendar);

    while (current <= endOfCalendar) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return (
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
        {days.map(day => {
          const dayEvents = getEventsForDate(day);
          const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
          const isToday = day.toDateString() === new Date().toDateString();

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[100px] p-2 border rounded-lg ${
                isCurrentMonth ? 'bg-background' : 'bg-muted/50'
              } ${isToday ? 'ring-2 ring-primary' : ''}`}
            >
              <div className={`text-sm font-medium ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}`}>
                {day.getDate()}
              </div>
              <div className="mt-1 space-y-1">
                {dayEvents.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    className="text-xs p-1 rounded bg-primary/10 text-primary truncate cursor-pointer hover:bg-primary/20 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEvent(event);
                      setIsEventDetailOpen(true);
                    }}
                  >
                    {event.event?.title || 'Untitled Event'}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const startOfWeekDate = startOfWeek(selectedDate);
    const weekEvents = getEventsForWeek(startOfWeekDate);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }, (_, i) => {
            const day = addDays(startOfWeekDate, i);
            const dayEvents = getEventsForDate(day);
            const isToday = day.toDateString() === new Date().toDateString();

            return (
              <div key={i} className={`p-3 border rounded-lg ${isToday ? 'bg-primary/10' : 'bg-background'}`}>
                <div className="text-sm font-medium mb-2">
                  {format(day, 'EEE')}
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  {day.getDate()}
                </div>
                <div className="space-y-1">
                  {dayEvents.map(event => (
                    <div
                      key={event.id}
                      className="text-xs p-1 rounded bg-primary/10 text-primary truncate cursor-pointer hover:bg-primary/20 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(event);
                        setIsEventDetailOpen(true);
                      }}
                    >
                      {event.event?.title || 'Untitled Event'}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDate(selectedDate);

    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">{format(selectedDate, 'EEEE, MMMM dd, yyyy')}</h3>
          <p className="text-sm text-muted-foreground">{dayEvents.length} events</p>
        </div>
        
        <div className="space-y-3">
          {dayEvents.length > 0 ? (
            dayEvents.map(event => (
              <div
                key={event.id}
                onClick={() => {
                  setSelectedEvent(event);
                  setIsEventDetailOpen(true);
                }}
              >
                <EventCard
                  event={event}
                  canManage={canManageEvents || false}
                  onRecordAttendance={(status, reason) => 
                    recordAttendanceMutation.mutate({ 
                      eventId: event.id, 
                      status, 
                      reason 
                    })
                  }
                  getEventTypeIcon={getEventTypeIcon}
                  getEventTypeColor={getEventTypeColor}
                  onEdit={() => {
                    setSelectedEvent(event);
                    setIsEditEventOpen(true);
                  }}
                  onDelete={() => {
                    setSelectedEvent(event);
                    setIsDeleteDialogOpen(true);
                  }}
                />
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No events scheduled for this day</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Group Calendar
            </CardTitle>
            <CardDescription>
              Events and activities for {groupName}
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="day">Day</SelectItem>
              </SelectContent>
            </Select>
            
            {canManageEvents && (
              <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Event
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Group Event</DialogTitle>
                    <DialogDescription>
                      Create a new event for the group.
                    </DialogDescription>
                  </DialogHeader>
                  <CreateEventForm 
                    onSubmit={(data) => createEventMutation.mutate(data)}
                    isLoading={createEventMutation.isPending}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Date Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newDate = new Date(selectedDate);
                if (viewMode === 'month') {
                  newDate.setMonth(newDate.getMonth() - 1);
                } else if (viewMode === 'week') {
                  newDate.setDate(newDate.getDate() - 7);
                } else {
                  newDate.setDate(newDate.getDate() - 1);
                }
                setSelectedDate(newDate);
              }}
            >
              ←
            </Button>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-48 justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, 'MMM dd, yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newDate = new Date(selectedDate);
                if (viewMode === 'month') {
                  newDate.setMonth(newDate.getMonth() + 1);
                } else if (viewMode === 'week') {
                  newDate.setDate(newDate.getDate() + 7);
                } else {
                  newDate.setDate(newDate.getDate() + 1);
                }
                setSelectedDate(newDate);
              }}
            >
              →
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDate(new Date())}
          >
            Today
          </Button>
        </div>

        {/* Calendar View */}
        {isLoadingEvents ? (
          <div className="h-96 bg-muted animate-pulse rounded-lg" />
        ) : (
          <div className="min-h-[400px]">
            {viewMode === 'month' && renderMonthView()}
            {viewMode === 'week' && renderWeekView()}
            {viewMode === 'day' && renderDayView()}
          </div>
        )}

        {/* Event Detail Dialog */}
        <EventDetailDialog
          event={selectedEvent}
          isOpen={isEventDetailOpen}
          onOpenChange={setIsEventDetailOpen}
          canManage={canManageEvents || false}
          onEdit={() => {
            setIsEventDetailOpen(false);
            setIsEditEventOpen(true);
          }}
          onDelete={() => {
            setIsEventDetailOpen(false);
            setIsDeleteDialogOpen(true);
          }}
          getEventTypeIcon={getEventTypeIcon}
          getEventTypeColor={getEventTypeColor}
          onRecordAttendance={(status, reason) => 
            recordAttendanceMutation.mutate({ 
              eventId: selectedEvent!.id, 
              status, 
              reason 
            })
          }
        />

        {/* Edit Event Dialog */}
        {selectedEvent && (
          <Dialog open={isEditEventOpen} onOpenChange={setIsEditEventOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Event</DialogTitle>
                <DialogDescription>
                  Update event details
                </DialogDescription>
              </DialogHeader>
              <EditEventForm
                event={selectedEvent}
                onSubmit={(data) => updateEventMutation.mutate({
                  eventId: selectedEvent.id,
                  ...data
                })}
                isLoading={updateEventMutation.isPending}
                onCancel={() => {
                  setIsEditEventOpen(false);
                  setSelectedEvent(null);
                }}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the event
                {selectedEvent?.event?.title && ` "${selectedEvent.event.title}"`}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => selectedEvent && deleteEventMutation.mutate(selectedEvent.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

interface EventCardProps {
  event: GroupEventWithDetails;
  canManage: boolean;
  onRecordAttendance: (status: string, reason?: string) => void;
  getEventTypeIcon: (eventType: string) => React.ReactNode;
  getEventTypeColor: (eventType: string) => string;
  onEdit?: () => void;
  onDelete?: () => void;
}

const EventCard = ({ 
  event, 
  canManage, 
  onRecordAttendance, 
  getEventTypeIcon, 
  getEventTypeColor,
  onEdit,
  onDelete
}: EventCardProps) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getEventTypeIcon(event.eventType)}
              <h4 className="font-medium">{event.event.title}</h4>
              {event.eventType && (
                <Badge className={getEventTypeColor(event.eventType)}>
                  {event.eventType.replace('_', ' ')}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{format(new Date(event.event.startDate), 'HH:mm')}</span>
                {event.event.endDate && (
                  <span>- {format(new Date(event.event.endDate), 'HH:mm')}</span>
                )}
              </div>
              
              {event.event.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{event.event.location}</span>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{event.attendanceCount}/{event.maxParticipants || '∞'}</span>
              </div>
            </div>
            
            {event.event.description && (
              <p className="text-sm text-muted-foreground">
                {event.event.description}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {canManage && onEdit && onDelete && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        
        {/* Attendance Actions */}
        {event.requiresAttendance && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Your attendance:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRecordAttendance('attending')}
              >
                <CheckCircle className="mr-1 h-3 w-3" />
                Attending
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRecordAttendance('not_attending')}
              >
                <XCircle className="mr-1 h-3 w-3" />
                Not Attending
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRecordAttendance('excused')}
              >
                <AlertCircle className="mr-1 h-3 w-3" />
                Excused
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Event Detail Dialog Component
interface EventDetailDialogProps {
  event: GroupEventWithDetails | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
  getEventTypeIcon: (eventType: string) => React.ReactNode;
  getEventTypeColor: (eventType: string) => string;
  onRecordAttendance: (status: string, reason?: string) => void;
}

const EventDetailDialog = ({
  event,
  isOpen,
  onOpenChange,
  canManage,
  onEdit,
  onDelete,
  getEventTypeIcon,
  getEventTypeColor,
  onRecordAttendance
}: EventDetailDialogProps) => {
  if (!event || !event.event) return null;

  const startDate = event.event.startDate instanceof Date 
    ? event.event.startDate 
    : event.event.startDate 
    ? new Date(event.event.startDate) 
    : null;
  const endDate = event.event.endDate instanceof Date 
    ? event.event.endDate 
    : event.event.endDate 
    ? new Date(event.event.endDate) 
    : null;

  const isValidStartDate = startDate && !isNaN(startDate.getTime());
  const isValidEndDate = endDate && !isNaN(endDate.getTime());

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {getEventTypeIcon(event.eventType || '')}
            <DialogTitle>{event.event.title}</DialogTitle>
            {event.eventType && (
              <Badge className={getEventTypeColor(event.eventType)}>
                {event.eventType.replace('_', ' ')}
              </Badge>
            )}
          </div>
          <DialogDescription>
            {isValidStartDate && format(startDate, 'EEEE, MMMM dd, yyyy')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {event.event.description && (
            <div>
              <Label className="text-sm font-semibold mb-2 block">Description</Label>
              <p className="text-sm text-muted-foreground">{event.event.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label className="text-xs text-muted-foreground">Time</Label>
                <p className="text-sm">
                  {isValidStartDate ? format(startDate, 'HH:mm') : 'N/A'}
                  {isValidEndDate && ` - ${format(endDate, 'HH:mm')}`}
                </p>
              </div>
            </div>

            {event.event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-xs text-muted-foreground">Location</Label>
                  <p className="text-sm">{event.event.location}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label className="text-xs text-muted-foreground">Attendance</Label>
                <p className="text-sm">{event.attendanceCount}/{event.maxParticipants || '∞'}</p>
              </div>
            </div>
          </div>

          {event.requiresAttendance && (
            <div className="pt-4 border-t">
              <Label className="text-sm font-semibold mb-2 block">Your Attendance</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRecordAttendance('attending')}
                >
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Attending
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRecordAttendance('not_attending')}
                >
                  <XCircle className="mr-1 h-3 w-3" />
                  Not Attending
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRecordAttendance('excused')}
                >
                  <AlertCircle className="mr-1 h-3 w-3" />
                  Excused
                </Button>
              </div>
            </div>
          )}

          {canManage && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={onDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface CreateEventFormProps {
  onSubmit: (data: { eventData: any; eventType: GroupEventType }) => void;
  isLoading: boolean;
}

// Edit Event Form Component
interface EditEventFormProps {
  event: GroupEventWithDetails;
  onSubmit: (data: { eventData: any; eventType: GroupEventType }) => void;
  isLoading: boolean;
  onCancel: () => void;
}

const EditEventForm = ({ event, onSubmit, isLoading, onCancel }: EditEventFormProps) => {
  const startDate = event.event.startDate instanceof Date 
    ? event.event.startDate 
    : event.event.startDate 
    ? new Date(event.event.startDate) 
    : new Date();
  const endDate = event.event.endDate instanceof Date 
    ? event.event.endDate 
    : event.event.endDate 
    ? new Date(event.event.endDate) 
    : null;

  // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState({
    title: event.event.title || '',
    description: event.event.description || '',
    eventType: event.eventType as GroupEventType,
    startDate: formatDateForInput(startDate),
    endDate: endDate ? formatDateForInput(endDate) : '',
    location: event.event.location || '',
    maxParticipants: event.maxParticipants?.toString() || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      eventData: {
        title: formData.title,
        description: formData.description,
        startDate: new Date(formData.startDate),
        endDate: formData.endDate ? new Date(formData.endDate) : null,
        location: formData.location,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
      },
      eventType: formData.eventType,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-title">Event Title</Label>
        <Input
          id="edit-title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter event title"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-description">Description</Label>
        <Textarea
          id="edit-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the event"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-eventType">Event Type</Label>
        <Select value={formData.eventType} onValueChange={(value) => setFormData({ ...formData, eventType: value as GroupEventType })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="study_session">Study Session</SelectItem>
            <SelectItem value="assignment_deadline">Assignment Deadline</SelectItem>
            <SelectItem value="exam_schedule">Exam Schedule</SelectItem>
            <SelectItem value="group_meeting">Group Meeting</SelectItem>
            <SelectItem value="teacher_office_hours">Teacher Office Hours</SelectItem>
            <SelectItem value="project_presentation">Project Presentation</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-startDate">Start Date & Time</Label>
          <Input
            id="edit-startDate"
            type="datetime-local"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-endDate">End Date & Time (Optional)</Label>
          <Input
            id="edit-endDate"
            type="datetime-local"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-location">Location (Optional)</Label>
          <Input
            id="edit-location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g., Room A101"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-maxParticipants">Max Participants (Optional)</Label>
          <Input
            id="edit-maxParticipants"
            type="number"
            value={formData.maxParticipants}
            onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
            placeholder="Leave empty for unlimited"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Updating...' : 'Update Event'}
        </Button>
      </div>
    </form>
  );
};

const CreateEventForm = ({ onSubmit, isLoading }: CreateEventFormProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: 'study_session' as GroupEventType,
    startDate: '',
    endDate: '',
    location: '',
    maxParticipants: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      eventData: {
        title: formData.title,
        description: formData.description,
        startDate: new Date(formData.startDate),
        endDate: formData.endDate ? new Date(formData.endDate) : null,
        location: formData.location,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
      },
      eventType: formData.eventType,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Event Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter event title"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the event"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="eventType">Event Type</Label>
        <Select value={formData.eventType} onValueChange={(value) => setFormData({ ...formData, eventType: value as GroupEventType })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="study_session">Study Session</SelectItem>
            <SelectItem value="assignment_deadline">Assignment Deadline</SelectItem>
            <SelectItem value="exam_schedule">Exam Schedule</SelectItem>
            <SelectItem value="group_meeting">Group Meeting</SelectItem>
            <SelectItem value="teacher_office_hours">Teacher Office Hours</SelectItem>
            <SelectItem value="project_presentation">Project Presentation</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date & Time</Label>
          <Input
            id="startDate"
            type="datetime-local"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">End Date & Time (Optional)</Label>
          <Input
            id="endDate"
            type="datetime-local"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="location">Location (Optional)</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g., Room A101"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxParticipants">Max Participants (Optional)</Label>
          <Input
            id="maxParticipants"
            type="number"
            value={formData.maxParticipants}
            onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
            placeholder="Leave empty for unlimited"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Event'}
        </Button>
      </div>
    </form>
  );
};
