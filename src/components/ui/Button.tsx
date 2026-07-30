import { motion, type HTMLMotionProps } from 'framer-motion';
import clsx from 'clsx';
import { useState, type ReactNode } from 'react';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: ReactNode;
  variant?: 'primary' | 'glass' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: ReactNode;
}

const sizes = {
  sm: 'text-sm px-4 py-2',
  md: 'text-base px-6 py-3',
  lg: 'text-base px-8 py-4',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth,
  icon,
  className,
  onClick,
  ...rest
}: ButtonProps) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples((r) => [...r, { x: e.clientX - rect.left, y: e.clientY - rect.top, id }]);
    setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 600);
    onClick?.(e);
  };

  const base = clsx(
    'relative overflow-hidden flex items-center justify-center gap-2 font-semibold transition-all duration-150',
    sizes[size],
    fullWidth && 'w-full',
    variant === 'primary' && 'btn-primary rounded-full',
    variant === 'glass' && 'btn-glass rounded-full',
    variant === 'outline' && 'rounded-full border-2 border-blush-400 text-blush-600 dark:text-blush-300 active:scale-95',
    variant === 'ghost' && 'rounded-full text-blush-700 dark:text-blush-200 active:scale-95',
    className
  );

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      className={base}
      onClick={handleClick}
      {...rest}
    >
      {icon}
      {children}
      {ripples.map((r) => (
        <span
          key={r.id}
          className="absolute rounded-full bg-white/50 pointer-events-none animate-ripple"
          style={{ left: r.x - 40, top: r.y - 40, width: 80, height: 80 }}
        />
      ))}
    </motion.button>
  );
}
