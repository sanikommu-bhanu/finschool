import { HiOutlineBell, HiOutlineCalendar, HiOutlineDocumentText, HiOutlineTruck, HiOutlineBookOpen, HiOutlineCash, HiOutlineX } from 'react-icons/hi';
import clsx from 'clsx';
import type { NotificationDoc, NotificationType } from '@/services/notifications.service';
import { formatNotificationTime } from '@/lib/timeAgo';
import { GlassCard } from './GlassCard';

const iconMap: Record<NotificationType, typeof HiOutlineBell> = {
  fee_reminder: HiOutlineCash,
  payment: HiOutlineCash,
  attendance: HiOutlineCalendar,
  assignment: HiOutlineBookOpen,
  announcement: HiOutlineDocumentText,
  system: HiOutlineTruck,
};

interface NotificationCardProps {
  item: NotificationDoc;
  onClick?: () => void;
  onDelete?: () => void;
}

export function NotificationCard({ item, onClick, onDelete }: NotificationCardProps) {
  const Icon = iconMap[item.type] || HiOutlineBell;
  return (
    <GlassCard padding="sm" className="flex items-start gap-3" onClick={onClick}>
      <div className={clsx('w-10 h-10 rounded-xl2 flex items-center justify-center shrink-0', item.read ? 'bg-blush-100/60' : 'bg-gradient-cta')}>
        <Icon size={16} className={item.read ? 'text-blush-600' : 'text-white'} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold truncate">{item.title}</p>
          {!item.read && <span className="w-2 h-2 rounded-full bg-blush-600 shrink-0" />}
        </div>
        <p className="text-xs text-blush-700/60 dark:text-blush-200/50 truncate">{item.description}</p>
        <p className="text-[10px] text-blush-700/40 dark:text-blush-200/30 mt-1">{formatNotificationTime(item.createdAt)}</p>
      </div>
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-blush-700/40 hover:text-blush-600 hover:bg-blush-100/60 transition-colors"
          aria-label="Delete notification"
        >
          <HiOutlineX size={14} />
        </button>
      )}
    </GlassCard>
  );
}
