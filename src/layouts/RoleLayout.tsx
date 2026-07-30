import { Outlet } from 'react-router-dom';
import { BottomNav, type BottomNavItem } from '@/components/layout/BottomNav';

export function RoleLayout({ items }: { items: BottomNavItem[] }) {
  return (
    <div className="relative">
      <Outlet />
      <BottomNav items={items} />
    </div>
  );
}
