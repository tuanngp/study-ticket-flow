import { supabase } from "@/integrations/supabase/client";

export interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
}

export interface UserStats {
  totalTickets: number;
  resolvedTickets: number;
  avgResolutionTime?: number;
  activeTickets: number;
}

export class StatisticsService {
  /**
   * Get ticket statistics for a user
   */
  static async getTicketStats(userId: string): Promise<TicketStats> {
    try {
      const { data: tickets, error } = await supabase
        .from("tickets")
        .select("status")
        .eq("creator_id", userId);

      if (error) {
        console.error('Error fetching ticket stats:', error);
        return {
          total: 0,
          open: 0,
          inProgress: 0,
          resolved: 0,
          closed: 0,
        };
      }

      if (!tickets) {
        return {
          total: 0,
          open: 0,
          inProgress: 0,
          resolved: 0,
          closed: 0,
        };
      }

      const stats: TicketStats = {
        total: tickets.length,
        open: tickets.filter((t) => t.status === "open").length,
        inProgress: tickets.filter((t) => t.status === "in_progress").length,
        resolved: tickets.filter((t) => t.status === "resolved").length,
        closed: tickets.filter((t) => t.status === "closed").length,
      };

      return stats;
    } catch (error) {
      console.error('Error in getTicketStats:', error);
      return {
        total: 0,
        open: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0,
      };
    }
  }

  /**
   * Get comprehensive user statistics
   */
  static async getUserStats(userId: string): Promise<UserStats> {
    try {
      const { data: tickets, error } = await supabase
        .from("tickets")
        .select("status, created_at, updated_at")
        .eq("creator_id", userId);

      if (error) {
        console.error('Error fetching user stats:', error);
        return {
          totalTickets: 0,
          resolvedTickets: 0,
          activeTickets: 0,
        };
      }

      if (!tickets) {
        return {
          totalTickets: 0,
          resolvedTickets: 0,
          activeTickets: 0,
        };
      }

      const resolvedTickets = tickets.filter((t) => t.status === "resolved" || t.status === "closed");
      const activeTickets = tickets.filter((t) => t.status === "open" || t.status === "in_progress");

      // Calculate average resolution time (simplified)
      let totalResolutionTime = 0;
      let resolvedCount = 0;

      resolvedTickets.forEach((ticket) => {
        if (ticket.updated_at && ticket.created_at) {
          const created = new Date(ticket.created_at).getTime();
          const resolved = new Date(ticket.updated_at).getTime();
          totalResolutionTime += (resolved - created);
          resolvedCount++;
        }
      });

      const avgResolutionTime = resolvedCount > 0 ? totalResolutionTime / resolvedCount : undefined;

      return {
        totalTickets: tickets.length,
        resolvedTickets: resolvedTickets.length,
        avgResolutionTime,
        activeTickets: activeTickets.length,
      };
    } catch (error) {
      console.error('Error in getUserStats:', error);
      return {
        totalTickets: 0,
        resolvedTickets: 0,
        activeTickets: 0,
      };
    }
  }

  /**
   * Get global statistics (for admin dashboard)
   */
  static async getGlobalStats(): Promise<{
    totalTickets: number;
    totalUsers: number;
    totalComments: number;
    activeTickets: number;
  }> {
    try {
      const [ticketsResult, usersResult, commentsResult] = await Promise.all([
        supabase.from("tickets").select("status", { count: "exact" }),
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("ticket_comments").select("id", { count: "exact" }),
      ]);

      const activeTickets = ticketsResult.data?.filter(
        (t) => t.status === "open" || t.status === "in_progress"
      ).length || 0;

      return {
        totalTickets: ticketsResult.count || 0,
        totalUsers: usersResult.count || 0,
        totalComments: commentsResult.count || 0,
        activeTickets,
      };
    } catch (error) {
      console.error('Error in getGlobalStats:', error);
      return {
        totalTickets: 0,
        totalUsers: 0,
        totalComments: 0,
        activeTickets: 0,
      };
    }
  }

  /**
   * Subscribe to statistics changes
   */
  static subscribeToStatsChanges(userId: string, callback: () => void): () => void {
    const channel = supabase
      .channel("stats-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tickets",
          filter: `creator_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}
