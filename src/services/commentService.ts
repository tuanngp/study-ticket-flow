import { supabase } from "@/integrations/supabase/client";
import { NotificationService } from "./notificationService";

export interface Comment {
  id: string;
  ticket_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: {
    full_name?: string;
    email?: string;
  };
}

export interface CreateCommentData {
  ticketId: string;
  userId: string;
  content: string;
}

export class CommentService {
  /**
   * Get comments for a specific ticket
   */
  static async getCommentsByTicketId(ticketId: string): Promise<Comment[]> {
    try {
      const { data, error } = await supabase
        .from("ticket_comments")
        .select(`
          *,
          user:profiles(full_name, email)
        `)
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error('Error fetching comments:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getCommentsByTicketId:', error);
      return [];
    }
  }

  /**
   * Create a new comment
   */
  static async createComment(data: CreateCommentData): Promise<{ success: boolean; error?: string; comment?: Comment }> {
    try {
      const { data: result, error } = await supabase
        .from("ticket_comments")
        .insert({
          ticket_id: data.ticketId,
          user_id: data.userId,
          content: data.content,
        })
        .select(`
          *,
          user:profiles(full_name, email)
        `)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Get ticket details
      const { data: ticket } = await supabase
        .from("tickets")
        .select("title, creator_id, assignee_id")
        .eq("id", data.ticketId)
        .single();

      if (ticket && result) {
        // Detect @mentions in comment
        const mentionRegex = /@(\w+)/g;
        const mentions = data.content.match(mentionRegex);
        
        if (mentions) {
          // Get mentioned users
          const mentionedUsernames = mentions.map(m => m.substring(1));
          const { data: mentionedUsers } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("full_name", mentionedUsernames);

          if (mentionedUsers && mentionedUsers.length > 0) {
            // Send mention notifications
            await NotificationService.send({
              type: 'mention',
              title: 'You Were Mentioned',
              message: `${result.user?.full_name || 'Someone'} mentioned you in a comment on "${ticket.title}".`,
              recipients: mentionedUsers.map(u => u.id),
              priority: 'medium',
              channels: ['in_app', 'email'],
              metadata: {
                ticketId: data.ticketId,
                commentId: result.id,
              },
              actions: [
                { label: 'View Comment', url: `/tickets/${data.ticketId}` },
              ],
            });
          }
        }

        // Send comment notification to ticket participants
        const recipients = await NotificationService.determineRecipients(
          'comment_added',
          {
            ticketId: data.ticketId,
            creatorId: ticket.creator_id,
            assigneeId: ticket.assignee_id || undefined,
            commentAuthorId: data.userId,
          }
        );

        if (recipients.length > 0) {
          const { title, message } = NotificationService.formatNotificationContent(
            'comment_added',
            {
              ticketTitle: ticket.title,
              ticketId: data.ticketId,
              userName: result.user?.full_name || 'Someone',
            }
          );

          await NotificationService.send({
            type: 'comment_added',
            title,
            message,
            recipients,
            priority: 'low',
            channels: ['in_app'],
            metadata: {
              ticketId: data.ticketId,
              commentId: result.id,
            },
            actions: [
              { label: 'View Comment', url: `/tickets/${data.ticketId}` },
              { label: 'Reply', url: `/tickets/${data.ticketId}#reply` },
            ],
          });
        }
      }

      return { success: true, comment: result };
    } catch (error: any) {
      console.error('Error creating comment:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update a comment
   */
  static async updateComment(
    commentId: string,
    content: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from("ticket_comments")
        .update({ content })
        .eq("id", commentId);

      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error updating comment:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a comment
   */
  static async deleteComment(commentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from("ticket_comments")
        .delete()
        .eq("id", commentId);

      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Subscribe to comment changes for a ticket
   */
  static subscribeToComments(ticketId: string, callback: () => void): () => void {
    const channel = supabase
      .channel(`comments-${ticketId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ticket_comments",
          filter: `ticket_id=eq.${ticketId}`,
        },
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}
