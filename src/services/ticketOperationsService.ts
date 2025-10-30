import { supabase } from "@/integrations/supabase/client";
import { NotificationService } from "./notificationService";
import { normalizeTicketType } from "@/lib/utils";

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
  images?: string[];
  tags?: string[];
  creator?: {
    full_name?: string;
    email?: string;
    avatar_url?: string;
  };
  assignee?: {
    full_name?: string;
    email?: string;
    avatar_url?: string;
  };
}

export interface TicketListOptions {
  limit?: number;
  page?: number;
  creatorId?: string;
  assigneeId?: string;
  status?: string;
  priority?: string;
  type?: string;
  courseCode?: string;
  dateRange?: 'today' | 'week' | 'month';
  includeDeleted?: boolean;
  includeGroupTickets?: boolean;
}

export interface PaginatedTickets {
  tickets: Ticket[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export class TicketOperationsService {
  /**
   * Create a new ticket
   */
  static async createTicket(ticketData: any, creatorId: string): Promise<Ticket> {
    try {

      const { data, error } = await supabase
        .from("tickets")
        .insert({
          title: ticketData.title,
          description: ticketData.description,
          type: ticketData.type || "task",
          priority: ticketData.priority || "medium",
          creator_id: creatorId,
          assignee_id: ticketData.assigneeId || null, // Add assignee if provided
          course_code: ticketData.courseCode,
          class_name: ticketData.className,
          project_group: ticketData.projectGroup,
          images: ticketData.images || [],
          tags: ticketData.tags || [],
        } as any)
        .select("*")
        .single();

      if (error) {
        throw new Error(error.message || 'Không thể tạo ticket');
      }

      // If ticket was assigned, send notification to assignee
      if (data.assignee_id) {
        await this.notifyAssignee(data.assignee_id, data.id, data.title);
      }

      return data as Ticket;
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      throw new Error(error.message || 'Không thể tạo ticket');
    }
  }

  /**
   * Notify assignee when ticket is assigned
   */
  private static async notifyAssignee(assigneeId: string, ticketId: string, ticketTitle: string) {
    try {
      const { title, message } = NotificationService.formatNotificationContent(
        'ticket_assigned',
        {
          ticketTitle,
          ticketId,
        }
      );

      await NotificationService.send({
        type: 'ticket_assigned',
        title,
        message,
        recipients: [assigneeId],
        priority: 'medium',
        channels: ['in_app', 'email'],
        metadata: {
          ticketId,
          assigneeId,
        },
        actions: [
          { label: 'Xem Ticket', url: `/tickets/${ticketId}` },
          { label: 'Chấp nhận Assignment', url: `/tickets/${ticketId}#accept` },
        ],
      });
    } catch (error) {
      console.error('Error notifying assignee:', error);
      // Don't throw error as this shouldn't block ticket creation
    }
  }

  /**
   * Fetch a single ticket by ID with relations
   */
  static async getTicketById(ticketId: string): Promise<Ticket | null> {
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          *,
          creator:profiles!tickets_creator_id_profiles_id_fk(full_name, email, avatar_url),
          assignee:profiles!tickets_assignee_id_profiles_id_fk(full_name, email, avatar_url)
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
          creator:profiles!tickets_creator_id_profiles_id_fk(full_name, email, avatar_url),
          assignee:profiles!tickets_assignee_id_profiles_id_fk(full_name, email, avatar_url)
        `)
        .order("created_at", { ascending: false });

      if (options.creatorId) {
        query = query.eq("creator_id", options.creatorId) as any;
      }

      if (options.assigneeId) {
        query = query.eq("assignee_id", options.assigneeId) as any;
      }

      if (options.status) {
        query = query.eq("status", options.status);
      }

      // Always exclude deleted tickets unless specifically requested
      if (!options.includeDeleted) {
        query = query.neq("status", "deleted");
      }

      // Only show tickets with descriptions (non-empty)
      query = query.not("description", "is", null);
      query = query.neq("description", "");

      // Exclude group tickets unless specifically requested
      if (!options.includeGroupTickets) {
        // Get all ticket IDs that are in group_tickets table
        const { data: groupTicketIds } = await supabase
          .from('group_tickets')
          .select('ticket_id');
        
        if (groupTicketIds && groupTicketIds.length > 0) {
          const idsToExclude = groupTicketIds.map(gt => gt.ticket_id);
          console.log('Excluding group tickets:', idsToExclude);
          // Use individual neq() calls for each ID to avoid parsing issues
          idsToExclude.forEach(id => {
            query = query.neq('id', id);
          });
        } else {
          console.log('No group tickets found to exclude');
        }
      } else {
        console.log('Including group tickets as requested');
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
   * Fetch tickets with pagination
   */
  static async getTicketsPaginated(options: TicketListOptions = {}): Promise<PaginatedTickets> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 10;
      const offset = (page - 1) * limit;

      // Build base query
      let query = supabase
        .from("tickets")
        .select(`
          *,
          creator:profiles!tickets_creator_id_profiles_id_fk(full_name, email, avatar_url),
          assignee:profiles!tickets_assignee_id_profiles_id_fk(full_name, email, avatar_url)
        `, { count: 'exact' })
        .order("created_at", { ascending: false });

      // Apply filters
      if (options.creatorId) {
        query = query.eq("creator_id", options.creatorId) as any;
      }

      if (options.assigneeId) {
        query = query.eq("assignee_id", options.assigneeId) as any;
      }

      if (options.status) {
        query = query.eq("status", options.status);
      }

      if (options.priority) {
        query = query.eq("priority", options.priority);
      }

      if (options.type) {
        // Normalize UI-friendly type names to database enum values
        const normalizedType = normalizeTicketType(options.type);
        query = query.eq("type", normalizedType);
      }

      if (options.courseCode) {
        query = query.eq("course_code", options.courseCode) as any;
      }

      // Apply date range filter
      // Logic: Filter from current time going back in time (easier to understand)
      if (options.dateRange) {
        const now = new Date();
        let startDate: Date;
        const endDate = now; // Always end at current time

        switch (options.dateRange) {
          case 'today':
            // Last 24 hours from now
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case 'week':
            // Last 7 days from now
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            // Last 30 days from now (approximately 1 month)
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(0); // Beginning of time
        }

        // Convert to ISO string for Supabase
        const startISO = startDate.toISOString();
        const endISO = endDate.toISOString();

        // Debug logging
        console.log('Date range filter:', {
          range: options.dateRange,
          startLocal: startDate.toLocaleString('vi-VN'),
          endLocal: endDate.toLocaleString('vi-VN'),
          hoursAgo: options.dateRange === 'today' ? '24' : options.dateRange === 'week' ? '168 (7 days)' : '720 (30 days)',
          startISO,
          endISO,
          nowISO: now.toISOString()
        });

        // Use both gte and lte for proper date range filtering
        query = query.gte("created_at", startISO);
        query = query.lte("created_at", endISO);
      }

      // Always exclude deleted tickets unless specifically requested
      if (!options.includeDeleted) {
        query = query.neq("status", "deleted");
      }

      // Only show tickets with descriptions (non-empty) - commented out for debugging
      // query = query.not("description", "is", null);
      // query = query.neq("description", "");

      // Exclude tickets with project_group (group tickets) unless specifically requested
      if (!options.includeGroupTickets) {
        query = query.is("project_group", null);
      }

      // Exclude group tickets unless specifically requested
      let excludedGroupTicketIds: string[] = [];
      if (!options.includeGroupTickets) {
        // Get all ticket IDs that are in group_tickets table
        const { data: groupTicketIds } = await supabase
          .from('group_tickets')
          .select('ticket_id');
        
        if (groupTicketIds && groupTicketIds.length > 0) {
          excludedGroupTicketIds = groupTicketIds.map(gt => gt.ticket_id);
          // Use individual neq() calls for each ID to avoid parsing issues
          excludedGroupTicketIds.forEach(id => {
            query = query.neq('id', id);
          });
        }
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      // Debug logging
      console.log('getTicketsPaginated query result:', {
        options,
        dataCount: data?.length || 0,
        totalCount: count,
        error
      });

      if (error) {
        console.error('Error fetching paginated tickets:', error);
        return {
          tickets: [],
          totalCount: 0,
          totalPages: 0,
          currentPage: page,
          hasNextPage: false,
          hasPreviousPage: false
        };
      }


      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      return {
        tickets: data || [],
        totalCount,
        totalPages,
        currentPage: page,
        hasNextPage,
        hasPreviousPage
      };
    } catch (error) {
      console.error('Error in getTicketsPaginated:', error);
      return {
        tickets: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false
      };
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
        throw new Error(error.message || 'Không thể lấy dữ liệu ticket cho tháng');
      }

      // Month tickets fetched successfully

      return data || [];
    } catch (error: any) {
      console.error('Error in getTicketsForMonth:', error);
      throw new Error(error.message || 'Không thể lấy dữ liệu ticket cho tháng');
    }
  }

  /**
   * Update ticket with full information
   */
  static async updateTicket(
    ticketId: string,
    updates: {
      title?: string;
      description?: string;
      type?: string;
      priority?: string;
      courseCode?: string;
      className?: string;
      projectGroup?: string;
    },
    userId: string
  ): Promise<{ success: boolean; error?: string; ticket?: Ticket }> {
    try {
      // Get current ticket to check permissions
      const currentTicket = await this.getTicketById(ticketId);
      if (!currentTicket) {
        return { success: false, error: 'Ticket not found' };
      }

      // Check if user has permission to update
      const canUpdate = this.checkUpdatePermission(currentTicket, userId);
      if (!canUpdate.allowed) {
        return { success: false, error: canUpdate.reason };
      }

      // Validate updates
      const validation = this.validateTicketUpdates(updates);
      if (!validation.isValid) {
        return { success: false, error: validation.errors.join(', ') };
      }

      // Prepare update data
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.title !== undefined) updateData.title = updates.title.trim();
      if (updates.description !== undefined) updateData.description = updates.description.trim();
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.courseCode !== undefined) updateData.course_code = updates.courseCode;
      if (updates.className !== undefined) updateData.class_name = updates.className;
      if (updates.projectGroup !== undefined) updateData.project_group = updates.projectGroup;

      // Update ticket
      const { data, error } = await supabase
        .from('tickets')
        .update(updateData)
        .eq('id', ticketId)
        .select(`
          *,
          creator:profiles!tickets_creator_id_profiles_id_fk(full_name, email, avatar_url),
          assignee:profiles!tickets_assignee_id_profiles_id_fk(full_name, email, avatar_url)
        `)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Send notification about ticket update
      if (currentTicket.creator_id !== userId) {
        const { title, message } = NotificationService.formatNotificationContent(
          'ticket_updated',
          {
            ticketTitle: data.title,
            ticketId,
            updatedBy: userId,
          }
        );

        await NotificationService.send({
          type: 'ticket_updated',
          title,
          message,
          recipients: [currentTicket.creator_id],
          priority: 'medium',
          channels: ['in_app', 'email'],
          metadata: {
            ticketId,
            updatedFields: Object.keys(updates),
          },
          actions: [
            { label: 'View Ticket', url: `/tickets/${ticketId}` },
          ],
        });
      }

      return { success: true, ticket: data };
    } catch (error: any) {
      console.error('Error updating ticket:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete ticket (soft delete by setting status to 'deleted')
   */
  static async deleteTicket(
    ticketId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current ticket to check permissions
      const currentTicket = await this.getTicketById(ticketId);
      if (!currentTicket) {
        return { success: false, error: 'Ticket not found' };
      }

      // Check if user has permission to delete
      const canDelete = this.checkDeletePermission(currentTicket, userId);
      if (!canDelete.allowed) {
        return { success: false, error: canDelete.reason };
      }

      // Check if ticket can be deleted (not resolved/closed)
      if (currentTicket.status === 'resolved' || currentTicket.status === 'closed') {
        return {
          success: false,
          error: 'Cannot delete resolved or closed tickets. Please contact administrator.'
        };
      }

      // Soft delete by updating status to 'deleted'
      const { error } = await supabase
        .from('tickets')
        .update({
          status: 'deleted',
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) {
        throw new Error(error.message);
      }

      // Send notification about ticket deletion
      if (currentTicket.creator_id !== userId) {
        const { title, message } = NotificationService.formatNotificationContent(
          'ticket_deleted',
          {
            ticketTitle: currentTicket.title,
            ticketId,
            deletedBy: userId,
          }
        );

        await NotificationService.send({
          type: 'ticket_deleted',
          title,
          message,
          recipients: [
            currentTicket.creator_id,
            ...(currentTicket.assignee_id ? [currentTicket.assignee_id] : [])
          ],
          priority: 'high',
          channels: ['in_app', 'email'],
          metadata: {
            ticketId,
            deletedBy: userId,
          },
        });
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting ticket:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user has permission to update ticket
   */
  private static checkUpdatePermission(
    ticket: Ticket,
    userId: string
  ): { allowed: boolean; reason?: string } {
    // Creator can always update their own tickets
    if (ticket.creator_id === userId) {
      return { allowed: true };
    }

    // Assignee can update tickets assigned to them
    if (ticket.assignee_id === userId) {
      return { allowed: true };
    }

    // TODO: Add admin/instructor role check here
    // For now, only creator and assignee can update

    return {
      allowed: false,
      reason: 'You can only update tickets you created or are assigned to'
    };
  }

  /**
   * Check if user has permission to delete ticket
   */
  private static checkDeletePermission(
    ticket: Ticket,
    userId: string
  ): { allowed: boolean; reason?: string } {
    // Only creator can delete their own tickets
    if (ticket.creator_id === userId) {
      return { allowed: true };
    }

    // TODO: Add admin/instructor role check here
    // For now, only creator can delete

    return {
      allowed: false,
      reason: 'You can only delete tickets you created'
    };
  }

  /**
   * Validate ticket update data
   */
  private static validateTicketUpdates(updates: any): {
    isValid: boolean;
    errors: string[]
  } {
    const errors: string[] = [];

    if (updates.title !== undefined) {
      if (!updates.title.trim()) {
        errors.push('Title cannot be empty');
      } else if (updates.title.trim().length < 5) {
        errors.push('Title must be at least 5 characters long');
      } else if (updates.title.trim().length > 200) {
        errors.push('Title must be less than 200 characters');
      }
    }

    if (updates.description !== undefined) {
      if (!updates.description.trim()) {
        errors.push('Description cannot be empty');
      } else if (updates.description.trim().length < 10) {
        errors.push('Description must be at least 10 characters long');
      } else if (updates.description.trim().length > 5000) {
        errors.push('Description must be less than 5000 characters');
      }
    }

    if (updates.type !== undefined) {
      const validTypes = ['bug', 'feature', 'question', 'task', 'grading', 'report', 'config', 'assignment', 'exam', 'submission', 'technical', 'academic'];
      if (!validTypes.includes(updates.type)) {
        errors.push('Invalid ticket type');
      }
    }

    if (updates.priority !== undefined) {
      const validPriorities = ['low', 'medium', 'high', 'critical'];
      if (!validPriorities.includes(updates.priority)) {
        errors.push('Invalid priority level');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
