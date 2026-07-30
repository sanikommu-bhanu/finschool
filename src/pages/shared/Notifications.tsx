import { useNavigate } from 'react-router-dom';
import { HiOutlineChevronLeft, HiOutlineBell } from 'react-icons/hi';
import { Screen } from '@/components/layout/Screen';
import { NotificationCard } from '@/components/ui/NotificationCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from '@/hooks/useNotifications';

export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, unreadCount, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotif = useDeleteNotification();

  const handleOpen = (id: string, read: boolean) => {
    if (!read) markRead.mutate(id);
  };

  const handleMarkAll = () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    markAllRead.mutate(unreadIds);
  };

  return (
    <Screen withNav={false}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="glass-pill w-9 h-9 flex items-center justify-center">
            <HiOutlineChevronLeft size={18} />
          </button>
          <h1 className="font-display text-lg font-semibold">Notifications</h1>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAll} className="text-xs font-semibold text-blush-600 disabled:opacity-50" disabled={markAllRead.isPending}>
            Mark all as read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2.5">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl3" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState icon={HiOutlineBell} title="You're all caught up" description="New notifications will show up here." />
      ) : (
        <div className="space-y-2.5">
          {notifications.map((n) => (
            <NotificationCard
              key={n.id}
              item={n}
              onClick={() => handleOpen(n.id, n.read)}
              onDelete={() => deleteNotif.mutate(n.id)}
            />
          ))}
        </div>
      )}
    </Screen>
  );
}
