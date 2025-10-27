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
   * Get comprehensive analytics dashboard data with timeout
   */
  static async getAnalyticsDashboard(userId: string, timeRange: 'week' | 'month' | 'quarter' | 'year' = 'month') {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Analytics fetch timeout')), 20000)
      );

      const analyticsPromise = this.fetchAnalyticsData(userId, timeRange);
      return await Promise.race([analyticsPromise, timeoutPromise]);
    } catch (error) {
      console.error('Error in getAnalyticsDashboard:', error);
      // Return empty data structure instead of throwing error
      return {
        overview: {
          totalTickets: 0,
          openTickets: 0,
          resolvedTickets: 0,
          closedTickets: 0,
          averageResolutionTime: 0,
          userSatisfaction: 0,
        },
        trends: {
          ticketsByStatus: [],
          ticketsByPriority: [],
          ticketsByType: [],
          resolutionTimeByMonth: [],
        },
        performance: {
          topPerformers: [],
          departmentStats: [],
          courseStats: [],
        },
        insights: {
          peakHours: [],
          commonIssues: [],
          seasonalPatterns: [],
        },
      };
    }
  }

  /**
   * Internal method to fetch analytics data
   */
  private static async fetchAnalyticsData(userId: string, timeRange: 'week' | 'month' | 'quarter' | 'year') {
    try {
      // Calculate date range
      const now = new Date();
      const startDate = new Date();

      switch (timeRange) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Get tickets for current user only
      const { data: tickets, error: ticketsError } = await supabase
        .from("tickets")
        .select("*")
        .eq("creator_id", userId)
        .gte('created_at', startDate.toISOString());

      if (ticketsError) {
        console.error('Error fetching tickets for analytics:', ticketsError);
        // Return empty data instead of throwing error
        return {
          overview: {
            totalTickets: 0,
            openTickets: 0,
            resolvedTickets: 0,
            closedTickets: 0,
            averageResolutionTime: 0,
            userSatisfaction: 0,
          },
          trends: {
            ticketsByStatus: [],
            ticketsByPriority: [],
            ticketsByType: [],
            resolutionTimeByMonth: [],
          },
          performance: {
            topPerformers: [],
            departmentStats: [],
            courseStats: [],
          },
          insights: {
            peakHours: [],
            commonIssues: [],
            seasonalPatterns: [],
          },
        };
      }

      // Get current user profile for analytics
      const { data: currentUserProfile } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("id", userId)
        .single();

      // Calculate overview statistics
      const totalTickets = tickets?.length || 0;
      const openTickets = tickets?.filter(t => t.status === 'open').length || 0;
      const resolvedTickets = tickets?.filter(t => t.status === 'resolved').length || 0;
      const closedTickets = tickets?.filter(t => t.status === 'closed').length || 0;

      // Calculate average resolution time
      const resolvedTicketsWithTime = tickets?.filter(t =>
        (t.status === 'resolved' || t.status === 'closed') &&
        t.created_at && t.updated_at
      ) || [];

      const totalResolutionTime = resolvedTicketsWithTime.reduce((sum, ticket) => {
        const created = new Date(ticket.created_at).getTime();
        const resolved = new Date(ticket.updated_at).getTime();
        return sum + (resolved - created);
      }, 0);

      const averageResolutionTime = resolvedTicketsWithTime.length > 0
        ? Math.round(totalResolutionTime / resolvedTicketsWithTime.length / (1000 * 60 * 60)) // Convert to hours
        : 0;

      // Calculate user satisfaction based on resolution rate and time
      const userSatisfaction = (() => {
        if (totalTickets === 0) return 0;

        const resolutionRate = (resolvedTickets + closedTickets) / totalTickets;
        const timeScore = averageResolutionTime > 0 ? Math.max(0, 100 - (averageResolutionTime * 2)) : 100;
        const activityScore = Math.min(100, totalTickets * 5); // More tickets = higher activity score

        return Math.round((resolutionRate * 40) + (timeScore * 0.3) + (activityScore * 0.3));
      })();

      // Calculate trends
      const ticketsByStatus = [
        { status: 'open', count: openTickets, percentage: totalTickets > 0 ? Math.round((openTickets / totalTickets) * 100) : 0 },
        { status: 'in_progress', count: tickets?.filter(t => t.status === 'in_progress').length || 0, percentage: totalTickets > 0 ? Math.round(((tickets?.filter(t => t.status === 'in_progress').length || 0) / totalTickets) * 100) : 0 },
        { status: 'resolved', count: resolvedTickets, percentage: totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0 },
        { status: 'closed', count: closedTickets, percentage: totalTickets > 0 ? Math.round((closedTickets / totalTickets) * 100) : 0 },
      ];

      const ticketsByPriority = [
        { priority: 'low', count: tickets?.filter(t => t.priority === 'low').length || 0, percentage: totalTickets > 0 ? Math.round(((tickets?.filter(t => t.priority === 'low').length || 0) / totalTickets) * 100) : 0 },
        { priority: 'medium', count: tickets?.filter(t => t.priority === 'medium').length || 0, percentage: totalTickets > 0 ? Math.round(((tickets?.filter(t => t.priority === 'medium').length || 0) / totalTickets) * 100) : 0 },
        { priority: 'high', count: tickets?.filter(t => t.priority === 'high').length || 0, percentage: totalTickets > 0 ? Math.round(((tickets?.filter(t => t.priority === 'high').length || 0) / totalTickets) * 100) : 0 },
        { priority: 'critical', count: tickets?.filter(t => t.priority === 'critical').length || 0, percentage: totalTickets > 0 ? Math.round(((tickets?.filter(t => t.priority === 'critical').length || 0) / totalTickets) * 100) : 0 },
      ];

      const ticketsByType = [
        { type: 'bug', count: tickets?.filter(t => t.type === 'bug').length || 0, percentage: totalTickets > 0 ? Math.round(((tickets?.filter(t => t.type === 'bug').length || 0) / totalTickets) * 100) : 0 },
        { type: 'feature', count: tickets?.filter(t => t.type === 'feature').length || 0, percentage: totalTickets > 0 ? Math.round(((tickets?.filter(t => t.type === 'feature').length || 0) / totalTickets) * 100) : 0 },
        { type: 'question', count: tickets?.filter(t => t.type === 'question').length || 0, percentage: totalTickets > 0 ? Math.round(((tickets?.filter(t => t.type === 'question').length || 0) / totalTickets) * 100) : 0 },
        { type: 'task', count: tickets?.filter(t => t.type === 'task').length || 0, percentage: totalTickets > 0 ? Math.round(((tickets?.filter(t => t.type === 'task').length || 0) / totalTickets) * 100) : 0 },
      ];

      // Calculate resolution time by month based on real data
      const resolutionTimeByMonth = (() => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = new Date().getMonth();

        return months.slice(0, currentMonth + 1).map((month, index) => {
          const monthTickets = tickets?.filter(ticket => {
            const ticketDate = new Date(ticket.created_at);
            return ticketDate.getMonth() === index &&
              (ticket.status === 'resolved' || ticket.status === 'closed');
          }) || [];

          if (monthTickets.length === 0) {
            return { month, averageTime: 0 };
          }

          const totalTime = monthTickets.reduce((sum, ticket) => {
            const created = new Date(ticket.created_at).getTime();
            const resolved = new Date(ticket.updated_at).getTime();
            return sum + (resolved - created);
          }, 0);

          const avgTime = totalTime / monthTickets.length / (1000 * 60 * 60); // Convert to hours
          return { month, averageTime: Math.round(avgTime) };
        });
      })();

      // Personal performance data (based on user's own tickets)
      const userResolvedTickets = tickets?.filter(t => t.status === 'resolved' || t.status === 'closed') || [];
      const userAvgResolutionTime = userResolvedTickets.length > 0
        ? userResolvedTickets.reduce((sum, ticket) => {
          const created = new Date(ticket.created_at).getTime();
          const resolved = new Date(ticket.updated_at).getTime();
          return sum + (resolved - created);
        }, 0) / userResolvedTickets.length / (1000 * 60 * 60)
        : 0;

      const topPerformers = [
        {
          name: currentUserProfile?.full_name || 'You',
          resolvedTickets: userResolvedTickets.length,
          averageTime: Math.round(userAvgResolutionTime),
          rating: Math.min(5, Math.max(3, 5 - (userAvgResolutionTime / 10)))
        },
      ];

      // Personal department/course stats (if user has role info)
      const userRole = currentUserProfile?.role || 'student';
      const departmentStats = [
        {
          department: userRole === 'student' ? 'Student Support' : 'Staff Support',
          tickets: totalTickets,
          resolutionTime: Math.round(userAvgResolutionTime),
          satisfaction: userSatisfaction
        },
      ];

      const courseStats = [
        {
          course: 'Your Tickets',
          tickets: totalTickets,
          resolutionTime: Math.round(userAvgResolutionTime),
          satisfaction: userSatisfaction
        },
      ];

      // Personal insights data based on user's tickets
      const peakHours = Array.from({ length: 24 }, (_, hour) => {
        const hourTickets = tickets?.filter(ticket => {
          const ticketHour = new Date(ticket.created_at).getHours();
          return ticketHour === hour;
        }).length || 0;
        return {
          hour,
          ticketCount: hourTickets
        };
      });

      // Analyze user's ticket types for common issues
      const ticketTypes = tickets?.reduce((acc, ticket) => {
        acc[ticket.type] = (acc[ticket.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const commonIssues = Object.entries(ticketTypes)
        .map(([type, count]) => ({
          issue: type.charAt(0).toUpperCase() + type.slice(1) + ' Issues',
          count,
          trend: 'stable' as const
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);

      // If no real data, show placeholder
      if (commonIssues.length === 0) {
        commonIssues.push(
          { issue: 'No Issues Yet', count: 0, trend: 'stable' as const }
        );
      }

      const seasonalPatterns = [
        {
          period: 'Your Activity',
          pattern: totalTickets > 0 ? 'Active ticket creator' : 'No tickets created yet',
          impact: Math.min(100, totalTickets * 10)
        },
        {
          period: 'Resolution Rate',
          pattern: resolvedTickets > 0 ? `${Math.round((resolvedTickets / totalTickets) * 100)}% resolved` : 'No resolved tickets',
          impact: Math.round((resolvedTickets / Math.max(totalTickets, 1)) * 100)
        },
      ];

      return {
        overview: {
          totalTickets,
          openTickets,
          resolvedTickets,
          closedTickets,
          averageResolutionTime,
          userSatisfaction,
        },
        trends: {
          ticketsByStatus,
          ticketsByPriority,
          ticketsByType,
          resolutionTimeByMonth,
        },
        performance: {
          topPerformers,
          departmentStats,
          courseStats,
        },
        insights: {
          peakHours,
          commonIssues,
          seasonalPatterns,
        },
      };
    } catch (error) {
      console.error('Error in fetchAnalyticsData:', error);
      throw error; // Re-throw to be caught by parent method
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
