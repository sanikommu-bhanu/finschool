import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  subscribeNotificationsForEmail,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  type NotificationDoc,
} from '@/services/notifications.service';
import { useAuthStore } from '@/store/authStore';

/**
 * Live (onSnapshot-backed) notification list for the signed-in user's email.
 * Using a subscription rather than a one-shot query means the bell badge and the
 * notification center both update instantly when a new notification is written
 * (e.g. a teacher fee reminder or a payment confirmation) — no manual refetch needed.
 */
export function useNotifications() {
  const email = useAuthStore((s) => s.user?.email);
  const [notifications, setNotifications] = useState<NotificationDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!email) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const unsubscribe = subscribeNotificationsForEmail(
      email,
      (items) => {
        setNotifications(items);
        setIsLoading(false);
      },
      () => setIsLoading(false)
    );
    return unsubscribe;
  }, [email]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount, isLoading };
}

/** Small standalone hook for places that only need the badge count (e.g. TopBar). */
export function useUnreadNotificationCount() {
  const { unreadCount } = useNotifications();
  return unreadCount;
}

export function useMarkNotificationRead() {
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onError: () => toast.error('Could not update notification'),
  });
}

export function useMarkAllNotificationsRead() {
  return useMutation({
    mutationFn: (ids: string[]) => markAllNotificationsRead(ids),
    onSuccess: () => toast.success('All caught up'),
    onError: () => toast.error('Could not mark all as read'),
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => {
      toast.success('Notification removed');
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => toast.error('Could not remove notification'),
  });
}
