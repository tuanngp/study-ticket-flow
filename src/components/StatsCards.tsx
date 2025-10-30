import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatisticsService, TicketStats } from "@/services/statisticsService";
import { AlertCircle, CheckCircle2, Clock, Ticket } from "lucide-react";
import { useEffect, useState } from "react";

interface StatsCardsProps {
  userId: string;
}

export const StatsCards = ({ userId }: StatsCardsProps) => {
  const [stats, setStats] = useState<TicketStats>({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const ticketStats = await StatisticsService.getTicketStats(userId);
      setStats(ticketStats);
    };

    fetchStats();

    // Subscribe to stats changes
    const unsubscribe = StatisticsService.subscribeToStatsChanges(userId, fetchStats);

    return unsubscribe;
  }, [userId]);

  const cards = [
    {
      title: "Tổng Ticket",
      value: stats.total,
      icon: Ticket,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Đang Mở",
      value: stats.open,
      icon: AlertCircle,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Đang Xử Lý",
      value: stats.inProgress,
      icon: Clock,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Đã Giải Quyết",
      value: stats.resolved,
      icon: CheckCircle2,
      color: "text-success",
      bgColor: "bg-success/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card key={index} className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
