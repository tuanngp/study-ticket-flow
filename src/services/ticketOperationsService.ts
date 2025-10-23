import { supabase } from "@/integrations/supabase/client";
import { NotificationService } from "./notificationService";

export interface Ticket {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  creator_id: string;
  assignee_id?: string;
  ai_suggested_priority?: string;
  created_at: string;
  updated_at: string;
  creator?: {
    full_name?: string;
    email?: string;
  };
  assignee?: {
    full_name?: string;
    email?: string;
  };
}

export interface TicketListOptions {
  limit?: number;
  creatorId?: string;
  assigneeId?: string;
  status?: string;
}

export class TicketOperationsService {
  /**
   * Fetch a single ticket by ID with relations
   */
  static async getTicketById(ticketId: string): Promise<Ticket | null> {
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          *,
          creator:profiles!tickets_creator_id_profiles_id_fk(full_name, email),
          assignee:profiles!tickets_assignee_id_profiles_id_fk(full_name, email)
        `)
        .eq("id", ticketId)
        .single();

      if (error) {
        console.error('Error fetching ticket:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getTicketById:', error);
      return null;
    }
  }

  /**
   * Fetch tickets with optional filters
   */
  static async getTickets(options: TicketListOptions = {}): Promise<Ticket[]> {
    try {
      let query = supabase
        .from("tickets")
        .select(`
          *,
          creator:profiles!tickets_creator_id_profiles_id_fk(full_name, email),
          assignee:profiles!tickets_assignee_id_profiles_id_fk(full_name, email)
        `)
        .order("created_at", { ascending: false });

      if (options.creatorId) {
        query = query.eq("creator_id", options.creatorId);
      }

      if (options.assigneeId) {
        query = query.eq("assignee_id", options.assigneeId);
      }

      if (options.status) {
        query = query.eq("status", options.status);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching tickets:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTickets:', error);
      return [];
    }
  }

  /**
   * Update ticket status
   */
  static async updateTicketStatus(
    ticketId: string,
    status: 'open' | 'in_progress' | 'resolved' | 'closed'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get ticket details first
      const ticket = await this.getTicketById(ticketId);
      
      const { error } = await supabase
        .from("tickets")
        .update({ status })
        .eq("id", ticketId);

      if (error) {
        throw new Error(error.message);
      }

      // Send notifications based on status
      if (ticket) {
        const recipients = await NotificationService.determineRecipients(
          status === 'resolved' ? 'ticket_resolved' : 'ticket_status_changed',
          {
            ticketId,
            creatorId: ticket.creator_id,
            assigneeId: ticket.assignee_id || undefined,
          }
        );

        const { title, message } = NotificationService.formatNotificationContent(
          status === 'resolved' ? 'ticket_resolved' : 'ticket_status_changed',
          {
            ticketTitle: ticket.title,
            ticketId,
            status,
          }
        );

        await NotificationService.send({
          type: status === 'resolved' ? 'ticket_resolved' : 'ticket_status_changed',
          title,
          message,
          recipients,
          priority: status === 'resolved' ? 'medium' : 'low',
          channels: ['in_app', 'email'],
          metadata: {
            ticketId,
            status,
          },
          actions: [
            { label: 'View Ticket', url: `/tickets/${ticketId}` },
          ],
        });
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error updating ticket status:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update ticket assignee
   */
  static async updateTicketAssignee(
    ticketId: string,
    assigneeId: string | null
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get ticket details first
      const ticket = await this.getTicketById(ticketId);
      
      const { error } = await supabase
        .from("tickets")
        .update({ assignee_id: assigneeId })
        .eq("id", ticketId);

      if (error) {
        throw new Error(error.message);
      }

      // Send notification to new assignee
      if (ticket && assigneeId) {
        const { title, message } = NotificationService.formatNotificationContent(
          'ticket_assigned',
          {
            ticketTitle: ticket.title,
            ticketId,
          }
        );

        await NotificationService.send({
          type: 'ticket_assigned',
          title,
          message,
          recipients: [assigneeId],
          priority: ticket.priority === 'critical' || ticket.priority === 'high' ? 'high' : 'medium',
          channels: ['in_app', 'email'],
          metadata: {
            ticketId,
            assigneeId,
          },
          actions: [
            { label: 'View Ticket', url: `/tickets/${ticketId}` },
            { label: 'Accept Assignment', url: `/tickets/${ticketId}#accept` },
          ],
        });
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error updating ticket assignee:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get tickets created on a specific date
   */
  static async getTicketsByDate(date: Date): Promise<Ticket[]> {
    try {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from("tickets")
        .select(`
          *,
          creator:profiles!tickets_creator_id_profiles_id_fk(full_name, email, avatar_url),
          assignee:profiles!tickets_assignee_id_profiles_id_fk(full_name, email, avatar_url)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tickets by date:', error);
        return [];
      }

      return data || [];
    } catch (error: any) {
      console.error('Error in getTicketsByDate:', error);
      return [];
    }
  }

  /**
   * Subscribe to ticket changes
   */
  static subscribeToTickets(callback: () => void): () => void {
    const channel = supabase
      .channel("tickets-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tickets",
        },
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Get tickets for a specific month
   */
  static async getTicketsForMonth(
    userId: string,
    year: number,
    month: number
  ): Promise<Ticket[]> {
    try {
      // Fetching tickets for month

      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
      
      // Date range for tickets

      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .or(`creator_id.eq.${userId},assignee_id.eq.${userId}`)
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching tickets for month:', error);
        throw new Error(error.message || 'Failed to fetch tickets for month');
      }

      // Month tickets fetched successfully

      return data || [];
    } catch (error: any) {
      console.error('Error in getTicketsForMonth:', error);
      throw new Error(error.message || 'Failed to fetch tickets for month');
    }
  }
}
