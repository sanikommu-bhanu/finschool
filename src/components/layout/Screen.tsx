import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import clsx from 'clsx';

interface ScreenProps {
  children: ReactNode;
  bg?: string;
  withNav?: boolean;
  className?: string;
}

export function Screen({ children, bg, withNav = true, className }: ScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="min-h-screen bg-animated relative"
    >
      {bg && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 dark:opacity-15"
          style={{ backgroundImage: `url(${bg})` }}
        />
      )}
      <div className="absolute inset-0 bg-white/10 dark:bg-black/20" />
      <div
        className={clsx(
          'relative z-10 max-w-md mx-auto px-4 pt-5 safe-top',
          withNav ? 'pb-28' : 'pb-6',
          className
        )}
      >
        {children}
      </div>
    </motion.div>
  );
}
