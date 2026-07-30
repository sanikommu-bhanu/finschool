import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { IconType } from 'react-icons';
import clsx from 'clsx';

export interface BottomNavItem {
  path: string;
  label: string;
  icon: IconType;
  end?: boolean;
}

export function BottomNav({ items }: { items: BottomNavItem[] }) {
  return (
    <nav className="fixed bottom-3 left-0 right-0 z-40 px-4 safe-bottom">
      <div className="max-w-md mx-auto glass-pill flex items-center justify-between px-2 py-2 shadow-bloom">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className="relative flex-1"
          >
            {({ isActive }) => (
              <div className="flex flex-col items-center gap-0.5 py-1.5 px-1">
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-gradient-cta rounded-full -z-10"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <item.icon
                  size={18}
                  className={clsx(isActive ? 'text-white' : 'text-blush-700/70 dark:text-blush-200/60')}
                />
                <span
                  className={clsx(
                    'text-[10px] font-medium',
                    isActive ? 'text-white' : 'text-blush-700/70 dark:text-blush-200/60'
                  )}
                >
                  {item.label}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
