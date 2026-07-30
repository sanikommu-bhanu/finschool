import { Navigate, Outlet } from 'react-router-dom';
import type { Role } from '@/types';
import { useAuthStore } from '@/store/authStore';

function FullScreenLoader() {
  return (
    <div className="min-h-screen bg-animated flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-blush-400 border-t-transparent animate-spin" />
    </div>
  );
}

export function RequireAuth() {
  const { isAuthenticated, role, initialized } = useAuthStore();
  if (!initialized) return <FullScreenLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!role) return <Navigate to="/role-select" replace />;
  return <Outlet />;
}

/**
 * Guards a role's route tree (e.g. everything under /admin) so a signed-in user
 * whose actual role is different can't reach it by typing the URL directly —
 * they're redirected back to their own dashboard instead.
 */
export function RequireRole({ allow }: { allow: Role }) {
  const { isAuthenticated, role, initialized, profileCompleted } = useAuthStore();
  if (!initialized) return <FullScreenLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!role) return <Navigate to="/role-select" replace />;
  if (role !== allow) return <Navigate to={`/${role}`} replace />;
  
  if (!profileCompleted) {
    if (role === 'admin') return <Navigate to="/admin/setup" replace />;
    if (role === 'teacher' || role === 'accountant' || role === 'transport') {
      return <Navigate to="/profile-setup" replace />;
    }
  }

  return <Outlet />;
}

export function RequireAccount() {
  const { isAuthenticated, initialized } = useAuthStore();
  if (!initialized) return <FullScreenLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}
