import { motion } from 'framer-motion';
import { HiOutlineBell, HiOutlineSearch } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import { useUnreadNotificationCount } from '@/hooks/useNotifications';
import { useAuthStore } from '@/store/authStore';

interface TopBarProps {
  greetingPrefix?: string;
  subtitle?: string;
  showSearch?: boolean;
}

export function TopBar({ greetingPrefix = 'Hello', subtitle, showSearch = true }: TopBarProps) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const unread = useUnreadNotificationCount();
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className="min-w-0">
        <motion.h1
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xl font-display font-semibold truncate"
        >
          {greetingPrefix}, {firstName} <span className="inline-block animate-float">👋</span>
        </motion.h1>
        {subtitle && <p className="text-xs text-blush-700/60 dark:text-blush-200/50 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {showSearch && (
          <button
            onClick={() => navigate('search')}
            className="glass-pill w-10 h-10 flex items-center justify-center active:scale-90 transition-transform"
            aria-label="Search"
          >
            <HiOutlineSearch size={18} />
          </button>
        )}
        <button
          onClick={() => navigate('notifications')}
          className="relative glass-pill w-10 h-10 flex items-center justify-center active:scale-90 transition-transform"
          aria-label="Notifications"
        >
          <HiOutlineBell size={18} />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-blush-600 text-white text-[9px] flex items-center justify-center font-bold border-2 border-cream-50 dark:border-[#241C2E]">
              {unread}
            </span>
          )}
        </button>
        <button onClick={() => navigate('profile')} className="active:scale-90 transition-transform" aria-label="Profile">
          <img
            src={user?.avatar}
            alt={user?.name}
            className="w-10 h-10 rounded-full object-cover border-2 border-white/70 shadow-glass"
          />
        </button>
      </div>
    </div>
  );
}
