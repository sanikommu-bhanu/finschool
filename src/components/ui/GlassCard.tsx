import { motion, type HTMLMotionProps } from 'framer-motion';
import clsx from 'clsx';
import type { ReactNode } from 'react';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddings = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function GlassCard({ children, className, glow, padding = 'md', ...rest }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={clsx('glass-card', paddings[padding], glow && 'shadow-glow', className)}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
