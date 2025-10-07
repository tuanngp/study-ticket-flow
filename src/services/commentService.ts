import { supabase } from "@/integrations/supabase/client";

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
