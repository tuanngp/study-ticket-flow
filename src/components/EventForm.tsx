import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Calendar as CalendarIcon, Clock, MapPin, Tag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CalendarService, CreateEventData, CalendarEvent } from '@/services/calendarService';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { toast } from 'sonner';

const eventFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().optional(),
  type: z.enum(['personal', 'academic', 'assignment', 'exam', 'meeting', 'deadline', 'reminder']),
  startDate: z.string().min(1, 'Start date is required'),
  startTime: z.string().optional(),
  endDate: z.string().optional(),
  endTime: z.string().optional(),
  isAllDay: z.boolean().default(false),
  location: z.string().optional(),
  color: z.string().default('#3b82f6'),
});

type EventFormData = z.infer<typeof eventFormSchema>;

interface EventFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  event?: CalendarEvent;
  selectedDate?: Date;
}

export const EventForm: React.FC<EventFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  event,
  selectedDate,
}) => {
  const { user } = useAuth();
  const isEditing = !!event;

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'personal',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      isAllDay: false,
      location: '',
      color: '#3b82f6',
    },
  });

  const isAllDay = form.watch('isAllDay');

  // Reset form when dialog opens/closes or event changes
  useEffect(() => {
    if (isOpen) {
      if (event) {
        // Editing existing event
        form.reset({
          title: event.title,
          description: event.description || '',
          type: event.type,
          startDate: format(new Date(event.startDate), 'yyyy-MM-dd'),
          startTime: event.isAllDay ? '' : format(new Date(event.startDate), 'HH:mm'),
          endDate: event.endDate ? format(new Date(event.endDate), 'yyyy-MM-dd') : '',
          endTime: event.endDate && !event.isAllDay ? format(new Date(event.endDate), 'HH:mm') : '',
          isAllDay: event.isAllDay,
          location: event.location || '',
          color: event.color,
        });
      } else if (selectedDate) {
        // Creating new event with selected date
        form.reset({
          title: '',
          description: '',
          type: 'personal',
          startDate: format(selectedDate, 'yyyy-MM-dd'),
          startTime: format(new Date(), 'HH:mm'),
          endDate: '',
          endTime: '',
          isAllDay: false,
          location: '',
          color: '#3b82f6',
        });
      }
    } else {
      form.reset();
    }
  }, [isOpen, event, selectedDate, form]);

  const onSubmit = async (data: EventFormData) => {
    if (!user) {
      console.error('No user found');
      return;
    }

    try {
      console.log('Creating event with data:', data);
      
      // Parse dates
      const startDate = new Date(`${data.startDate}T${data.startTime || '00:00'}`);
      const endDate = data.endDate ? new Date(`${data.endDate}T${data.endTime || '00:00'}`) : undefined;

      const eventData: CreateEventData = {
        title: data.title,
        description: data.description,
        type: data.type,
        startDate,
        endDate,
        isAllDay: data.isAllDay,
        location: data.location,
        color: data.color,
      };

      console.log('Event data to create:', eventData);

      if (isEditing && event) {
        console.log('Updating event:', event.id);
        await CalendarService.updateEvent(event.id, eventData, user.id);
        console.log('Event updated successfully');
      } else {
        console.log('Creating new event...');
        const createdEvent = await CalendarService.createEvent(eventData, user.id);
        console.log('Event created successfully:', createdEvent);
      }

      toast.success(isEditing ? 'Event updated successfully!' : 'Event created successfully!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving event:', error);
      toast.error(`Error ${isEditing ? 'updating' : 'creating'} event: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDelete = async () => {
    if (!event || !user) return;

    if (confirm('Are you sure you want to delete this event?')) {
      try {
        await CalendarService.deleteEvent(event.id, user.id);
        onSuccess();
        onClose();
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const colorOptions = [
    { value: '#3b82f6', label: 'Blue', color: 'bg-blue-500' },
    { value: '#10b981', label: 'Green', color: 'bg-green-500' },
    { value: '#f59e0b', label: 'Yellow', color: 'bg-yellow-500' },
    { value: '#ef4444', label: 'Red', color: 'bg-red-500' },
    { value: '#8b5cf6', label: 'Purple', color: 'bg-purple-500' },
    { value: '#f97316', label: 'Orange', color: 'bg-orange-500' },
    { value: '#6b7280', label: 'Gray', color: 'bg-gray-500' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-glass">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {isEditing ? 'Edit Event' : 'Create Event'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update your event details below.' : 'Fill in the details to create a new calendar event.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>
              
              {/* Title and Type in a row on desktop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter event title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select event type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="personal">Personal</SelectItem>
                          <SelectItem value="academic">Academic</SelectItem>
                          <SelectItem value="assignment">Assignment</SelectItem>
                          <SelectItem value="exam">Exam</SelectItem>
                          <SelectItem value="meeting">Meeting</SelectItem>
                          <SelectItem value="deadline">Deadline</SelectItem>
                          <SelectItem value="reminder">Reminder</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter event description (optional)" 
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Date & Time Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Date & Time</h3>
              
              {/* All Day Toggle */}
              <FormField
                control={form.control}
                name="isAllDay"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-muted/50">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-medium">All Day Event</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Event lasts the entire day
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Date and Time Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Start Date/Time */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Start</h4>
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {!isAllDay && (
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* End Date/Time */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">End (Optional)</h4>
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {!isAllDay && (
                    <FormField
                      control={form.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Additional Details Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Additional Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Location */}
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Event location (optional)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Color */}
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Color</FormLabel>
                      <div className="flex flex-wrap gap-2">
                        {colorOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={`
                              w-8 h-8 rounded-full border-2 transition-all hover:scale-110
                              ${field.value === option.value ? 'border-primary scale-110 shadow-lg' : 'border-muted hover:border-primary/50'}
                            `}
                            style={{ backgroundColor: option.value }}
                            onClick={() => field.onChange(option.value)}
                            title={option.label}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
              <div className="flex-1">
                {isEditing && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    className="w-full sm:w-auto"
                  >
                    Delete Event
                  </Button>
                )}
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  className="flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="flex-1 sm:flex-none"
                >
                  {isEditing ? 'Update Event' : 'Create Event'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
