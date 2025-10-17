import { supabase } from "@/integrations/supabase/client";

// Notification Types
export type NotificationType =
  | "ticket_created"
  | "ticket_assigned"
  | "ticket_status_changed"
  | "ticket_resolved"
  | "ticket_due_soon"
  | "comment_added"
  | "mention"
  | "ai_triage_complete"
  | "assignment_failed"
  | "deadline_warning"
  | "similar_ticket_found"
  | "weekly_report"
  | "trend_alert"
  | "workload_high"
  | "sla_breach";

export type NotificationPriority = "low" | "medium" | "high" | "urgent";

export type NotificationChannel = "in_app" | "email" | "discord" | "sms";

export interface NotificationAction {
  label: string;
  url: string;
}

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  recipients: string[]; // user IDs
  priority?: NotificationPriority;
  channels?: NotificationChannel[];
  metadata?: {
    ticketId?: string;
    courseCode?: string;
    classId?: string;
    commentId?: string;
    assigneeId?: string;
    [key: string]: any;
  };
  actions?: NotificationAction[];
  educationalContext?: {
    academicLevel?: string;
    deadline?: string;
    urgencyScore?: number;
  };
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  ticket_id?: string;
  metadata: Record<string, any>;
  is_read: boolean;
  read_at?: string;
  delivered_channels: string[];
  actions: NotificationAction[];
  created_at: string;
  updated_at: string;
}

export interface NotificationFilters {
  type?: NotificationType;
  isRead?: boolean;
  priority?: NotificationPriority;
  limit?: number;
  offset?: number;
}

export class NotificationService {
  /**
   * Send notification to users
   */
  static async send(payload: NotificationPayload): Promise<{ success: boolean; error?: string }> {
    try {
      const {
        type,
        title,
        message,
        recipients,
        priority = "medium",
        channels = ["in_app"],
        metadata = {},
        actions = [],
      } = payload;

      // Create notification records for each recipient
      const notifications = recipients.map((userId) => ({
        user_id: userId,
        type,
        title,
        message,
        priority,
        ticket_id: metadata.ticketId || null,
        metadata: {
          ...metadata,
          educationalContext: payload.educationalContext,
        },
        delivered_channels: channels,
        actions,
      }));

      const { error } = await supabase.from("notifications").insert(notifications);

      if (error) {
        throw new Error(error.message);
      }

      // If email is in channels, send emails
      if (channels.includes("email")) {
        await this.sendEmailNotifications(payload);
      }

      return { success: true };
    } catch (error: any) {
      console.error("Error sending notification:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send notification to multiple users in batch
   */
  static async sendBatch(
    payloads: NotificationPayload[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const results = await Promise.allSettled(payloads.map((payload) => this.send(payload)));

      const failures = results.filter((r) => r.status === "rejected");
      if (failures.length > 0) {
        console.warn(`${failures.length} notifications failed to send`);
      }

      return { success: true };
    } catch (error: any) {
      console.error("Error sending batch notifications:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(
    notificationId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", notificationId);

      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    } catch (error: any) {
      console.error("Error marking notification as read:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark all user notifications as read
   */
  static async markAllAsRead(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc("mark_all_notifications_read", {
        p_user_id: userId,
      });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    } catch (error: any) {
      console.error("Error marking all notifications as read:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user notifications with pagination
   */
  static async getUserNotifications(
    userId: string,
    filters?: NotificationFilters
  ): Promise<Notification[]> {
    try {
      let query = supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (filters?.type) {
        query = query.eq("type", filters.type);
      }

      if (filters?.isRead !== undefined) {
        query = query.eq("is_read", filters.isRead);
      }

      if (filters?.priority) {
        query = query.eq("priority", filters.priority);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    } catch (error: any) {
      console.error("Error fetching user notifications:", error);
      return [];
    }
  }

  /**
   * Get unread notification count for user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc("get_unread_notification_count", {
        p_user_id: userId,
      });

      if (error) {
        throw new Error(error.message);
      }

      return data || 0;
    } catch (error: any) {
      console.error("Error fetching unread count:", error);
      return 0;
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(
    notificationId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from("notifications").delete().eq("id", notificationId);

      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    } catch (error: any) {
      console.error("Error deleting notification:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Subscribe to user notifications in real-time
   */
  static subscribeToUserNotifications(
    userId: string,
    callback: (notification: Notification) => void
  ): () => void {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Helper: Determine recipients based on notification type and context
   */
  static async determineRecipients(
    type: NotificationType,
    context: {
      ticketId?: string;
      creatorId?: string;
      assigneeId?: string;
      commentAuthorId?: string;
    }
  ): Promise<string[]> {
    const recipients: Set<string> = new Set();

    try {
      if (context.ticketId) {
        const { data: ticket } = await supabase
          .from("tickets")
          .select("creator_id, assignee_id")
          .eq("id", context.ticketId)
          .single();

        if (ticket) {
          // Add creator for most notifications
          if (
            [
              "ticket_assigned",
              "ticket_status_changed",
              "ticket_resolved",
              "comment_added",
            ].includes(type) &&
            ticket.creator_id
          ) {
            recipients.add(ticket.creator_id);
          }

          // Add assignee for relevant notifications
          if (
            ["ticket_created", "ticket_assigned", "comment_added", "ticket_due_soon"].includes(
              type
            ) &&
            ticket.assignee_id
          ) {
            recipients.add(ticket.assignee_id);
          }
        }
      }

      // Add specific recipients from context
      if (context.assigneeId) {
        recipients.add(context.assigneeId);
      }

      // Remove comment author from recipients for their own comment
      if (context.commentAuthorId && type === "comment_added") {
        recipients.delete(context.commentAuthorId);
      }

      return Array.from(recipients);
    } catch (error) {
      console.error("Error determining recipients:", error);
      return [];
    }
  }

  /**
   * Helper: Format notification content with educational context
   */
  static formatNotificationContent(
    type: NotificationType,
    context: {
      ticketTitle?: string;
      ticketId?: string;
      courseCode?: string;
      userName?: string;
      status?: string;
      priority?: string;
    }
  ): { title: string; message: string } {
    const { ticketTitle, courseCode, userName, status, priority } = context;

    const templates: Record<NotificationType, { title: string; message: string }> = {
      ticket_created: {
        title: "New Ticket Created",
        message: `A new ticket "${ticketTitle}" has been created${courseCode ? ` for ${courseCode}` : ""}.`,
      },
      ticket_assigned: {
        title: "Ticket Assigned to You",
        message: `You have been assigned to ticket "${ticketTitle}"${courseCode ? ` (${courseCode})` : ""}.`,
      },
      ticket_status_changed: {
        title: "Ticket Status Updated",
        message: `Ticket "${ticketTitle}" status changed to ${status || "updated"}.`,
      },
      ticket_resolved: {
        title: "Ticket Resolved",
        message: `Your ticket "${ticketTitle}" has been resolved. Please provide feedback if needed.`,
      },
      ticket_due_soon: {
        title: "Ticket Due Soon",
        message: `Ticket "${ticketTitle}" is approaching its due date. Please take action.`,
      },
      comment_added: {
        title: "New Comment",
        message: `${userName || "Someone"} commented on ticket "${ticketTitle}".`,
      },
      mention: {
        title: "You Were Mentioned",
        message: `${userName || "Someone"} mentioned you in a comment on "${ticketTitle}".`,
      },
      ai_triage_complete: {
        title: "AI Analysis Complete",
        message: `AI has analyzed your ticket "${ticketTitle}" and provided suggestions.`,
      },
      assignment_failed: {
        title: "Auto-Assignment Failed",
        message: `Failed to automatically assign ticket "${ticketTitle}". Manual assignment required.`,
      },
      deadline_warning: {
        title: "Assignment Deadline Warning",
        message: `Assignment deadline approaching for ticket "${ticketTitle}".`,
      },
      similar_ticket_found: {
        title: "Similar Ticket Found",
        message: `A similar ticket to "${ticketTitle}" has been resolved. Check it out!`,
      },
      weekly_report: {
        title: "Weekly Performance Report",
        message: `Your weekly ticket resolution report is ready${courseCode ? ` for ${courseCode}` : ""}.`,
      },
      trend_alert: {
        title: "Trend Alert",
        message: `Unusual pattern detected${courseCode ? ` in ${courseCode}` : ""}: High volume of similar issues.`,
      },
      workload_high: {
        title: "High Workload Alert",
        message: `${userName || "An assignee"} has high workload. Consider redistributing tickets.`,
      },
      sla_breach: {
        title: "SLA Breach Warning",
        message: `Ticket "${ticketTitle}" is at risk of breaching response time SLA.`,
      },
    };

    return templates[type] || { title: "Notification", message: "You have a new notification." };
  }

  /**
   * Private: Send email notifications (to be implemented with email service)
   */
  private static async sendEmailNotifications(payload: NotificationPayload): Promise<void> {
    // This will be implemented in emailNotificationService
    // For now, just log that email should be sent
    console.log("Email notification queued:", payload.title);
  }
}

