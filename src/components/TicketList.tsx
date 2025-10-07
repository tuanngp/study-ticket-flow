import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Clock, User } from "lucide-react";

interface TicketListProps {
  userId: string;
}

export const TicketList = ({ userId }: TicketListProps) => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      const { data } = await supabase
        .from("tickets")
        .select(`
          *,
          creator:profiles!tickets_creator_id_fkey(full_name, email),
          assignee:profiles!tickets_assignee_id_fkey(full_name, email)
        `)
        .order("created_at", { ascending: false })
        .limit(10);

      setTickets(data || []);
      setIsLoading(false);
    };

    fetchTickets();

    const channel = supabase
      .channel("tickets-list")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tickets",
        },
        () => fetchTickets()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      critical: "bg-red-500/10 text-red-500 border-red-500/20",
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      open: "bg-warning/10 text-warning border-warning/20",
      in_progress: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      resolved: "bg-success/10 text-success border-success/20",
      closed: "bg-muted text-muted-foreground border-muted",
    };
    return colors[status as keyof typeof colors] || colors.open;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No tickets found. Create your first ticket to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tickets.map((ticket) => (
        <div
          key={ticket.id}
          onClick={() => navigate(`/tickets/${ticket.id}`)}
          className="p-4 border rounded-lg hover:border-primary hover:shadow-md transition-all cursor-pointer bg-card"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg mb-2 truncate">
                {ticket.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {ticket.description}
              </p>
              <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(ticket.created_at), {
                    addSuffix: true,
                  })}
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {ticket.creator?.full_name || ticket.creator?.email}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <Badge className={getPriorityColor(ticket.priority)}>
                {ticket.priority}
              </Badge>
              <Badge className={getStatusColor(ticket.status)}>
                {ticket.status.replace("_", " ")}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {ticket.type}
              </Badge>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
