import { useEffect } from 'react';
import { useThemeStore } from '@/store/themeStore';

export function useThemeSync() {
  const isDark = useThemeStore((s) => s.isDark);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);
}
