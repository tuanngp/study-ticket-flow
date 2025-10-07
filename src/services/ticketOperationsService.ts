import { supabase } from "@/integrations/supabase/client";

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
          creator:profiles!tickets_creator_id_fkey(full_name, email),
          assignee:profiles!tickets_assignee_id_fkey(full_name, email)
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
          creator:profiles!tickets_creator_id_fkey(full_name, email),
          assignee:profiles!tickets_assignee_id_fkey(full_name, email)
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
      const { error } = await supabase
        .from("tickets")
        .update({ status })
        .eq("id", ticketId);

      if (error) {
        throw new Error(error.message);
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
      const { error } = await supabase
        .from("tickets")
        .update({ assignee_id: assigneeId })
        .eq("id", ticketId);

      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error updating ticket assignee:', error);
      return { success: false, error: error.message };
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
}
