import { Notification } from "@/services/notificationService";
import { isThisWeek, isToday, isYesterday } from "date-fns";
import { FC, useMemo } from "react";
import { NotificationItem } from "./NotificationItem";

interface NotificationListProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

interface GroupedNotifications {
  today: Notification[];
  yesterday: Notification[];
  thisWeek: Notification[];
  older: Notification[];
}

export const NotificationList: FC<NotificationListProps> = ({
  notifications,
  onMarkAsRead,
  onDelete,
}) => {
  // Group notifications by date
  const groupedNotifications = useMemo<GroupedNotifications>(() => {
    const groups: GroupedNotifications = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: [],
    };

    notifications.forEach((notification) => {
      const date = new Date(notification.created_at);

      if (isToday(date)) {
        groups.today.push(notification);
      } else if (isYesterday(date)) {
        groups.yesterday.push(notification);
      } else if (isThisWeek(date)) {
        groups.thisWeek.push(notification);
      } else {
        groups.older.push(notification);
      }
    });

    return groups;
  }, [notifications]);

  const renderGroup = (title: string, notifications: Notification[]) => {
    if (notifications.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-1">
          {title}
        </h3>
        <div className="space-y-2">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={onMarkAsRead}
              onDelete={onDelete}
            />
          ))}
        </div>
      </div>
    );
  };

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <div className="text-6xl mb-4">🔔</div>
        <h3 className="text-lg font-semibold mb-2">Không có thông báo</h3>
        <p className="text-sm">Bạn đã xem hết rồi!</p>
      </div>
    );
  }

  return (
    <div>
      {renderGroup("Hôm nay", groupedNotifications.today)}
      {renderGroup("Hôm qua", groupedNotifications.yesterday)}
      {renderGroup("Tuần này", groupedNotifications.thisWeek)}
      {renderGroup("Cũ hơn", groupedNotifications.older)}
    </div>
  );
};

