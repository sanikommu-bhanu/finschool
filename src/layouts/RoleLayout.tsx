import { Outlet } from 'react-router-dom';
import { BottomNav, type BottomNavItem } from '@/components/layout/BottomNav';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export function RoleLayout({ items }: { items: BottomNavItem[] }) {
  return (
    <div className="relative">
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
      <BottomNav items={items} />
    </div>
  );
}
