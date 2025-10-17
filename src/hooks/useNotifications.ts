import {
  type Notification,
  NotificationFilters,
  NotificationService,
} from "@/services/notificationService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";

export const useNotifications = (userId: string | null, filters?: NotificationFilters) => {
  const queryClient = useQueryClient();

  // Query key for notifications
  const notificationsKey = ["notifications", userId, filters];
  const unreadCountKey = ["notifications", "unread-count", userId];

  // Fetch notifications using React Query
  const {
    data: notifications = [],
    isLoading: loading,
    error,
    refetch: refetchNotifications,
  } = useQuery({
    queryKey: notificationsKey,
    queryFn: () => NotificationService.getUserNotifications(userId!, filters),
    enabled: !!userId,
    staleTime: 30 * 1000, // Cache for 30 seconds
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  // Fetch unread count
  const { data: unreadCount = 0, refetch: refetchUnreadCount } = useQuery({
    queryKey: unreadCountKey,
    queryFn: () => NotificationService.getUnreadCount(userId!),
    enabled: !!userId,
    staleTime: 30 * 1000, // Cache for 30 seconds
    refetchInterval: 60 * 1000, // Auto-refresh every 60 seconds
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => NotificationService.markAsRead(notificationId),
    onSuccess: (_, notificationId) => {
      // Optimistic update
      queryClient.setQueryData<Notification[]>(notificationsKey, (old) =>
        old?.map((n) =>
          n.id === notificationId
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );

      // Update unread count
      queryClient.setQueryData<number>(unreadCountKey, (old) => Math.max(0, (old || 0) - 1));
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => NotificationService.markAllAsRead(userId!),
    onSuccess: () => {
      // Update all notifications to read
      queryClient.setQueryData<Notification[]>(notificationsKey, (old) =>
        old?.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );

      // Reset unread count
      queryClient.setQueryData<number>(unreadCountKey, 0);
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) =>
      NotificationService.deleteNotification(notificationId),
    onSuccess: (_, notificationId) => {
      // Remove from list
      queryClient.setQueryData<Notification[]>(notificationsKey, (old) =>
        old?.filter((n) => n.id !== notificationId)
      );

      // Update unread count if deleted notification was unread
      const deletedNotification = notifications.find((n) => n.id === notificationId);
      if (deletedNotification && !deletedNotification.is_read) {
        queryClient.setQueryData<number>(unreadCountKey, (old) => Math.max(0, (old || 0) - 1));
      }
    },
  });

  // Mark as read callback
  const markAsRead = useCallback(
    async (notificationId: string) => {
      const result = await markAsReadMutation.mutateAsync(notificationId);
      return result.success;
    },
    [markAsReadMutation]
  );

  // Mark all as read callback
  const markAllAsRead = useCallback(async () => {
    const result = await markAllAsReadMutation.mutateAsync();
    return result.success;
  }, [markAllAsReadMutation]);

  // Delete notification callback
  const deleteNotification = useCallback(
    async (notificationId: string) => {
      const result = await deleteNotificationMutation.mutateAsync(notificationId);
      return result.success;
    },
    [deleteNotificationMutation]
  );

  // Refresh callback
  const refresh = useCallback(() => {
    refetchNotifications();
    refetchUnreadCount();
  }, [refetchNotifications, refetchUnreadCount]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = NotificationService.subscribeToUserNotifications(
      userId,
      (notification) => {
        // Add new notification to cache
        queryClient.setQueryData<Notification[]>(notificationsKey, (old) => {
          if (!old) return [notification];
          
          // Check if notification already exists
          const exists = old.some((n) => n.id === notification.id);
          if (exists) {
            // Update existing notification
            return old.map((n) => (n.id === notification.id ? notification : n));
          } else {
            // Add new notification to the top
            return [notification, ...old];
          }
        });

        // Update unread count if notification is unread
        if (!notification.is_read) {
          queryClient.setQueryData<number>(unreadCountKey, (old) => (old || 0) + 1);
        }

        // Show browser notification (optional)
        if (typeof window !== "undefined" && "Notification" in window) {
          if (Notification.permission === "granted") {
            new Notification(notification.title, {
              body: notification.message,
              icon: "/favicon.ico",
              tag: notification.id, // Prevent duplicates
            });
          } else if (Notification.permission !== "denied") {
            // Request permission if not denied
            Notification.requestPermission();
          }
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userId, queryClient, notificationsKey, unreadCountKey]);

  return {
    notifications,
    unreadCount,
    loading,
    error: error ? (error as Error).message : null,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  };
};
