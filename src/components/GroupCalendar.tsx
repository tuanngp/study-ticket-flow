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

  const canManageEvents = group && (
    group.createdBy === user?.id || 
    group.instructorId === user?.id ||
    profile?.role === 'admin'
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

  const getEventTypeIcon = (eventType: string) => {
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

  const getEventTypeColor = (eventType: string) => {
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
                    className="text-xs p-1 rounded bg-primary/10 text-primary truncate"
                  >
                    {event.event.title}
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
                      className="text-xs p-1 rounded bg-primary/10 text-primary truncate"
                    >
                      {event.event.title}
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
              <EventCard
                key={event.id}
                event={event}
                canManage={canManageEvents}
                onRecordAttendance={(status, reason) => 
                  recordAttendanceMutation.mutate({ 
                    eventId: event.id, 
                    status, 
                    reason 
                  })
                }
                getEventTypeIcon={getEventTypeIcon}
                getEventTypeColor={getEventTypeColor}
              />
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
}

const EventCard = ({ 
  event, 
  canManage, 
  onRecordAttendance, 
  getEventTypeIcon, 
  getEventTypeColor 
}: EventCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getEventTypeIcon(event.eventType)}
              <h4 className="font-medium">{event.event.title}</h4>
              <Badge className={getEventTypeColor(event.eventType)}>
                {event.eventType.replace('_', ' ')}
              </Badge>
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
            {canManage && (
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
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

interface CreateEventFormProps {
  onSubmit: (data: { eventData: any; eventType: GroupEventType }) => void;
  isLoading: boolean;
}

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
