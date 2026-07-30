import type { IconType } from 'react-icons';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon: IconType;
  title: string;
  description: string;
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center text-center py-16 px-6"
    >
      <div className="w-16 h-16 rounded-full glass flex items-center justify-center mb-4">
        <Icon size={26} className="text-blush-500" />
      </div>
      <h3 className="font-display font-semibold text-base mb-1">{title}</h3>
      <p className="text-sm text-blush-700/60 dark:text-blush-200/50 max-w-[26ch]">{description}</p>
    </motion.div>
  );
}
