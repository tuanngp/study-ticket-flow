import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Notification } from "@/services/notificationService";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  MessageSquare,
  TrendingUp,
  User,
} from "lucide-react";
import { FC } from "react";
import { useNavigate } from "react-router-dom";

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const getNotificationIcon = (type: string) => {
  const icons: Record<string, any> = {
    ticket_created: FileText,
    ticket_assigned: User,
    ticket_status_changed: CheckCircle,
    ticket_resolved: CheckCircle,
    ticket_due_soon: Calendar,
    comment_added: MessageSquare,
    mention: MessageSquare,
    ai_triage_complete: Bell,
    assignment_failed: AlertCircle,
    deadline_warning: AlertTriangle,
    similar_ticket_found: TrendingUp,
    weekly_report: TrendingUp,
    trend_alert: TrendingUp,
    workload_high: AlertTriangle,
    sla_breach: AlertTriangle,
  };

  const Icon = icons[type] || Bell;
  return Icon;
};

const getPriorityColor = (priority: string) => {
  const colors = {
    low: "bg-blue-500/10 text-blue-500",
    medium: "bg-yellow-500/10 text-yellow-500",
    high: "bg-orange-500/10 text-orange-500",
    urgent: "bg-red-500/10 text-red-500 animate-pulse",
  };

  return colors[priority as keyof typeof colors] || colors.medium;
};

export const NotificationItem: FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
}) => {
  const navigate = useNavigate();
  const Icon = getNotificationIcon(notification.type);

  const handleClick = () => {
    // Mark as read when clicked
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }

    // Navigate to related page
    if (notification.ticket_id) {
      navigate(`/tickets/${notification.ticket_id}`);
    } else if (notification.actions && notification.actions.length > 0) {
      navigate(notification.actions[0].url);
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkAsRead(notification.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(notification.id);
  };

  return (
    <div
      onClick={handleClick}
      className={`
        relative p-4 border rounded-lg cursor-pointer transition-all
        hover:shadow-md hover:border-primary/50
        ${notification.is_read ? "bg-card/50 opacity-75" : "bg-card"}
      `}
    >
      {/* Unread indicator */}
      {!notification.is_read && (
        <div className="absolute top-4 left-0 w-1 h-12 bg-primary rounded-r-full" />
      )}

      <div className="flex items-start gap-3 ml-2">
        {/* Icon */}
        <div className={`p-2 rounded-full ${getPriorityColor(notification.priority)}`}>
          <Icon className="h-4 w-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-semibold text-sm text-foreground line-clamp-1">
              {notification.title}
            </h4>

            {/* Priority badge for high/urgent */}
            {["high", "urgent"].includes(notification.priority) && (
              <Badge variant="destructive" className="text-xs">
                {notification.priority}
              </Badge>
            )}
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {notification.message}
          </p>

          {/* Educational context */}
          {notification.metadata?.courseCode && (
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                📚 {notification.metadata.courseCode}
              </Badge>
              {notification.metadata?.educationalContext?.academicLevel && (
                <Badge variant="secondary" className="text-xs">
                  {notification.metadata.educationalContext.academicLevel}
                </Badge>
              )}
            </div>
          )}

          {/* Timestamp */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: vi })}</span>
          </div>

          {/* Actions */}
          {notification.actions && notification.actions.length > 0 && (
            <div className="flex items-center gap-2 mt-3">
              {notification.actions.slice(0, 2).map((action, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(action.url);
                  }}
                  className="text-xs"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-1">
          {!notification.is_read && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleMarkAsRead}
              className="h-8 w-8 p-0"
              title="Đánh dấu đã đọc"
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            title="Xóa"
          >
            ×
          </Button>
        </div>
      </div>
    </div>
  );
};

