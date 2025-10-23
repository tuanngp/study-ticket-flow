import { supabase } from '@/integrations/supabase/client';

// Helper function to handle Supabase errors
const handleSupabaseError = (error: any, operation: string) => {
  console.error(`Error in ${operation}:`, error);
  
  if (error?.message?.includes('WebSocket')) {
    console.warn('WebSocket connection issue detected, retrying...');
    // For WebSocket issues, we can continue without realtime updates
    return null;
  }
  
  throw new Error(error?.message || `Failed to ${operation}`);
};

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  type: 'personal' | 'academic' | 'assignment' | 'exam' | 'meeting' | 'deadline' | 'reminder';
  startDate: Date;
  endDate?: Date;
  isAllDay: boolean;
  location?: string;
  color?: string;
  userId: string;
  ticketId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEventData {
  title: string;
  description?: string;
  type: 'personal' | 'academic' | 'assignment' | 'exam' | 'meeting' | 'deadline' | 'reminder';
  startDate: Date;
  endDate?: Date;
  isAllDay?: boolean;
  location?: string;
  color?: string;
  ticketId?: string;
  metadata?: Record<string, any>;
}

export interface UpdateEventData extends Partial<CreateEventData> {
  id: string;
}

export interface CalendarFilters {
  startDate?: Date;
  endDate?: Date;
  type?: string;
  status?: string;
  ticketId?: string;
}

export class CalendarService {
  /**
   * Create a new calendar event
   */
  static async createEvent(
    eventData: CreateEventData,
    userId: string
  ): Promise<CalendarEvent> {
    try {
      // Creating event with Supabase

      const insertData = {
        title: eventData.title,
        description: eventData.description,
        type: eventData.type,
        start_date: eventData.startDate.toISOString(),
        end_date: eventData.endDate?.toISOString(),
        is_all_day: eventData.isAllDay || false,
        location: eventData.location,
        color: eventData.color,
        user_id: userId,
        ticket_id: eventData.ticketId,
        metadata: eventData.metadata,
      };
      
      // Inserting event data

      const { data, error } = await supabase
        .from('calendar_events')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        const handledError = handleSupabaseError(error, 'create event');
        if (handledError) throw handledError;
        return; // Skip if WebSocket error
      }

      return {
        id: data.id,
        title: data.title,
        description: data.description,
        type: data.type,
        startDate: new Date(data.start_date),
        endDate: data.end_date ? new Date(data.end_date) : undefined,
        isAllDay: data.is_all_day,
        location: data.location,
        color: data.color,
        userId: data.user_id,
        ticketId: data.ticket_id,
        metadata: data.metadata,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error: any) {
      console.error('Error in createEvent:', error);
      throw new Error(error.message || 'Failed to create event');
    }
  }

  /**
   * Get events for a specific date range
   */
  static async getEvents(
    userId: string,
    filters: CalendarFilters = {}
  ): Promise<CalendarEvent[]> {
    try {
      console.log('Fetching events with Supabase...');
      console.log('User ID:', userId);
      console.log('Filters:', filters);

      let query = supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', userId)
        .order('start_date', { ascending: true });

      if (filters.startDate) {
        query = query.gte('start_date', filters.startDate.toISOString());
      }

      if (filters.endDate) {
        query = query.lte('start_date', filters.endDate.toISOString());
      }

      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      if (filters.ticketId) {
        query = query.eq('ticket_id', filters.ticketId);
      }

      const { data, error } = await query;

      if (error) {
        const handledError = handleSupabaseError(error, 'fetch events');
        if (handledError) throw handledError;
        return []; // Return empty array if WebSocket error
      }

      console.log('Events fetched successfully:', data?.length || 0);

      return (data || []).map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        type: event.type,
        startDate: new Date(event.start_date),
        endDate: event.end_date ? new Date(event.end_date) : undefined,
        isAllDay: event.is_all_day,
        location: event.location,
        color: event.color,
        userId: event.user_id,
        ticketId: event.ticket_id,
        metadata: event.metadata,
        createdAt: new Date(event.created_at),
        updatedAt: new Date(event.updated_at),
      }));
    } catch (error: any) {
      console.error('Error in getEvents:', error);
      throw new Error(error.message || 'Failed to fetch events');
    }
  }

  /**
   * Get a single event by ID
   */
  static async getEventById(eventId: string, userId: string): Promise<CalendarEvent | null> {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('id', eventId)
        .eq('user_id', userId)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        title: data.title,
        description: data.description,
        type: data.type,
        startDate: new Date(data.start_date),
        endDate: data.end_date ? new Date(data.end_date) : undefined,
        isAllDay: data.is_all_day,
        location: data.location,
        color: data.color,
        userId: data.user_id,
        ticketId: data.ticket_id,
        metadata: data.metadata,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error: any) {
      console.error('Error in getEventById:', error);
      throw new Error(error.message || 'Failed to fetch event');
    }
  }

  /**
   * Update an existing event
   */
  static async updateEvent(
    eventId: string,
    eventData: CreateEventData,
    userId: string
  ): Promise<CalendarEvent> {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .update({
          title: eventData.title,
          description: eventData.description,
          type: eventData.type,
          start_date: eventData.startDate.toISOString(),
          end_date: eventData.endDate?.toISOString(),
          is_all_day: eventData.isAllDay,
          location: eventData.location,
          color: eventData.color,
          ticket_id: eventData.ticketId,
          metadata: eventData.metadata,
          updated_at: new Date().toISOString(),
        })
        .eq('id', eventId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error || !data) {
        throw new Error('Event not found or access denied');
      }

      return {
        id: data.id,
        title: data.title,
        description: data.description,
        type: data.type,
        startDate: new Date(data.start_date),
        endDate: data.end_date ? new Date(data.end_date) : undefined,
        isAllDay: data.is_all_day,
        location: data.location,
        color: data.color,
        userId: data.user_id,
        ticketId: data.ticket_id,
        metadata: data.metadata,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error: any) {
      console.error('Error in updateEvent:', error);
      throw new Error(error.message || 'Failed to update event');
    }
  }

  /**
   * Delete an event
   */
  static async deleteEvent(eventId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(error.message || 'Failed to delete event');
      }
    } catch (error: any) {
      console.error('Error in deleteEvent:', error);
      throw new Error(error.message || 'Failed to delete event');
    }
  }

  /**
   * Get upcoming events (next 7 days)
   */
  static async getUpcomingEvents(userId: string, limit: number = 5): Promise<CalendarEvent[]> {
    try {
      console.log('Fetching upcoming events with Supabase...');
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', userId)
        .gte('start_date', now.toISOString())
        .lte('start_date', nextWeek.toISOString())
        .order('start_date', { ascending: true })
        .limit(limit);

      if (error) {
        const handledError = handleSupabaseError(error, 'fetch upcoming events');
        if (handledError) throw handledError;
        return []; // Return empty array if WebSocket error
      }

      console.log('Upcoming events fetched successfully:', data?.length || 0);

      return (data || []).map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        type: event.type,
        startDate: new Date(event.start_date),
        endDate: event.end_date ? new Date(event.end_date) : undefined,
        isAllDay: event.is_all_day,
        location: event.location,
        color: event.color,
        userId: event.user_id,
        ticketId: event.ticket_id,
        metadata: event.metadata,
        createdAt: new Date(event.created_at),
        updatedAt: new Date(event.updated_at),
      }));
    } catch (error: any) {
      console.error('Error in getUpcomingEvents:', error);
      throw new Error(error.message || 'Failed to fetch upcoming events');
    }
  }

  /**
   * Get events for a specific month
   */
  static async getEventsForMonth(
    userId: string,
    year: number,
    month: number
  ): Promise<CalendarEvent[]> {
    try {
      console.log('Fetching events for month with Supabase...');
      console.log('User ID:', userId);
      console.log('Year:', year, 'Month:', month);

      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', userId)
        .gte('start_date', startOfMonth.toISOString())
        .lte('start_date', endOfMonth.toISOString())
        .order('start_date', { ascending: true });

      if (error) {
        const handledError = handleSupabaseError(error, 'fetch events for month');
        if (handledError) throw handledError;
        return []; // Return empty array if WebSocket error
      }

      console.log('Month events fetched successfully:', data?.length || 0);

      return (data || []).map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        type: event.type,
        startDate: new Date(event.start_date),
        endDate: event.end_date ? new Date(event.end_date) : undefined,
        isAllDay: event.is_all_day,
        location: event.location,
        color: event.color,
        userId: event.user_id,
        ticketId: event.ticket_id,
        metadata: event.metadata,
        createdAt: new Date(event.created_at),
        updatedAt: new Date(event.updated_at),
      }));
    } catch (error: any) {
      console.error('Error in getEventsForMonth:', error);
      throw new Error(error.message || 'Failed to fetch events for month');
    }
  }

  /**
   * Get events for a specific day
   */
  static async getEventsForDay(
    userId: string,
    date: Date
  ): Promise<CalendarEvent[]> {
    try {
      console.log('Fetching events for day with Supabase...');
      console.log('User ID:', userId);
      console.log('Date:', date);

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', userId)
        .gte('start_date', startOfDay.toISOString())
        .lte('start_date', endOfDay.toISOString())
        .order('start_date', { ascending: true });

      if (error) {
        const handledError = handleSupabaseError(error, 'fetch events for day');
        if (handledError) throw handledError;
        return []; // Return empty array if WebSocket error
      }

      console.log('Day events fetched successfully:', data?.length || 0);

      return (data || []).map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        type: event.type,
        startDate: new Date(event.start_date),
        endDate: event.end_date ? new Date(event.end_date) : undefined,
        isAllDay: event.is_all_day,
        location: event.location,
        color: event.color,
        userId: event.user_id,
        ticketId: event.ticket_id,
        metadata: event.metadata,
        createdAt: new Date(event.created_at),
        updatedAt: new Date(event.updated_at),
      }));
    } catch (error: any) {
      console.error('Error in getEventsForDay:', error);
      throw new Error(error.message || 'Failed to fetch events for day');
    }
  }

  /**
   * Get events by type
   */
  static async getEventsByType(
    userId: string,
    type: string,
    limit: number = 10
  ): Promise<CalendarEvent[]> {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', userId)
        .eq('type', type)
        .order('start_date', { ascending: true })
        .limit(limit);

      if (error) {
        throw new Error(error.message || 'Failed to fetch events by type');
      }

      return (data || []).map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        type: event.type,
        startDate: new Date(event.start_date),
        endDate: event.end_date ? new Date(event.end_date) : undefined,
        isAllDay: event.is_all_day,
        location: event.location,
        color: event.color,
        userId: event.user_id,
        ticketId: event.ticket_id,
        metadata: event.metadata,
        createdAt: new Date(event.created_at),
        updatedAt: new Date(event.updated_at),
      }));
    } catch (error: any) {
      console.error('Error in getEventsByType:', error);
      throw new Error(error.message || 'Failed to fetch events by type');
    }
  }

  /**
   * Get tickets by date (for calendar integration)
   */
  static async getTicketsByDate(userId: string, date: Date): Promise<any[]> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .or(`creator_id.eq.${userId},assignee_id.eq.${userId}`)
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(error.message || 'Failed to fetch tickets by date');
      }

      return data || [];
    } catch (error: any) {
      console.error('Error in getTicketsByDate:', error);
      throw new Error(error.message || 'Failed to fetch tickets by date');
    }
  }

  /**
   * Validate event data
   */
  static validateEventData(data: CreateEventData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.title || data.title.trim().length === 0) {
      errors.push('Title is required');
    }

    if (data.title && data.title.length > 200) {
      errors.push('Title must be less than 200 characters');
    }

    if (!data.startDate) {
      errors.push('Start date is required');
    }

    if (data.endDate && data.endDate < data.startDate) {
      errors.push('End date must be after start date');
    }

    if (data.description && data.description.length > 1000) {
      errors.push('Description must be less than 1000 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}