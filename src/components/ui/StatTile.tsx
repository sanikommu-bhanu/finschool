import type { IconType } from 'react-icons';
import { GlassCard } from './GlassCard';
import { AnimatedCounter } from './AnimatedCounter';
import clsx from 'clsx';

interface StatTileProps {
  icon: IconType;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  delta?: string;
  deltaPositive?: boolean;
  iconBg?: string;
}

export function StatTile({ icon: Icon, label, value, prefix, suffix, delta, deltaPositive, iconBg }: StatTileProps) {
  return (
    <GlassCard padding="md" className="flex flex-col gap-2 min-w-0">
      <div className={clsx('w-9 h-9 rounded-xl2 flex items-center justify-center', iconBg || 'bg-blush-200/70')}>
        <Icon className="text-blush-700 dark:text-blush-100" size={16} />
      </div>
      <div className="text-lg font-display font-semibold truncate">
        <AnimatedCounter value={value} prefix={prefix} suffix={suffix} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-blush-700/70 dark:text-blush-200/60 truncate">{label}</span>
        {delta && (
          <span className={clsx('text-[10px] font-semibold', deltaPositive ? 'text-emerald-600' : 'text-rose-600')}>
            {delta}
          </span>
        )}
      </div>
    </GlassCard>
  );
}
