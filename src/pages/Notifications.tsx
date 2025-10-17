import { Navbar } from "@/components/Navbar";
import { NotificationList } from "@/components/NotificationList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNotifications } from "@/hooks/useNotifications";
import { AuthService, UserProfile } from "@/services/authService";
import { NotificationPriority, NotificationType } from "@/services/notificationService";
import { ArrowLeft, Filter } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Notifications = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [priorityFilter, setPriorityFilter] = useState<NotificationPriority | "all">("all");
  const [typeFilter, setTypeFilter] = useState<NotificationType | "all">("all");

  // Get notifications based on filters
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  } = useNotifications(user?.id, {
    isRead: activeTab === "unread" ? false : undefined,
    priority: priorityFilter !== "all" ? priorityFilter : undefined,
    type: typeFilter !== "all" ? typeFilter : undefined,
    limit: 100,
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await AuthService.getCurrentSession();

        if (!session) {
          navigate("/auth");
          return;
        }

        setUser(session.user);
        setProfile(session.profile);
      } catch (error) {
        console.error("Auth check failed:", error);
        navigate("/auth");
      } finally {
        setIsAuthLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleMarkAllAsRead = async () => {
    const success = await markAllAsRead();
    if (success) {
      toast.success("All notifications marked as read");
    } else {
      toast.error("Failed to mark all as read");
    }
  };

  const handleDeleteNotification = async (id: string) => {
    const success = await deleteNotification(id);
    if (success) {
      toast.success("Notification deleted");
    } else {
      toast.error("Failed to delete notification");
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar user={user} profile={profile} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Notifications</h1>
              <p className="text-muted-foreground">
                {unreadCount > 0 && `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`}
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead} variant="outline">
              Mark all as read
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters sidebar */}
          <Card className="lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Priority</label>
                <Select
                  value={priorityFilter}
                  onValueChange={(value) => setPriorityFilter(value as NotificationPriority | "all")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <Select
                  value={typeFilter}
                  onValueChange={(value) => setTypeFilter(value as NotificationType | "all")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="ticket_assigned">Ticket Assigned</SelectItem>
                    <SelectItem value="ticket_status_changed">Status Changed</SelectItem>
                    <SelectItem value="comment_added">New Comment</SelectItem>
                    <SelectItem value="mention">Mentions</SelectItem>
                    <SelectItem value="ticket_resolved">Resolved</SelectItem>
                    <SelectItem value="ticket_due_soon">Due Soon</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" onClick={refresh} className="w-full">
                Refresh
              </Button>
            </CardContent>
          </Card>

          {/* Notifications list */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "all" | "unread")}>
                  <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="all">
                      All ({notifications.length})
                    </TabsTrigger>
                    <TabsTrigger value="unread">
                      Unread ({unreadCount})
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <NotificationList
                    notifications={notifications}
                    onMarkAsRead={markAsRead}
                    onDelete={handleDeleteNotification}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Notifications;

