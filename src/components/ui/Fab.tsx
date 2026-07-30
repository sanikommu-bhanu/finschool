import { motion } from 'framer-motion';
import type { IconType } from 'react-icons';

interface FabProps {
  icon: IconType;
  onClick?: () => void;
  label?: string;
}

export function Fab({ icon: Icon, onClick, label }: FabProps) {
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
      onClick={onClick}
      aria-label={label || 'Action'}
      className="fixed right-5 bottom-24 z-40 w-14 h-14 rounded-full bg-gradient-cta shadow-bloom flex items-center justify-center text-white"
    >
      <Icon size={22} />
    </motion.button>
  );
}
