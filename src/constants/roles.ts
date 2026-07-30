import type { Role, RoleConfig } from '@/types';

export const ROLES: RoleConfig[] = [
  {
    id: 'admin',
    label: 'Admin',
    description: 'Manage everything',
    icon: 'shield',
    gradient: 'from-blush-400 to-blush-600',
  },
  {
    id: 'accountant',
    label: 'Accountant',
    description: 'Manage finance',
    icon: 'wallet',
    gradient: 'from-peach-300 to-peach-400',
  },
  {
    id: 'parent',
    label: 'Parent',
    description: 'Pay & track fees',
    icon: 'heart',
    gradient: 'from-rose-soft to-rose-dusty',
  },
  {
    id: 'student',
    label: 'Student',
    description: 'View my info',
    icon: 'book',
    gradient: 'from-lavender-200 to-lavender-300',
  },
  {
    id: 'teacher',
    label: 'Teacher',
    description: 'Manage classes',
    icon: 'chalkboard',
    gradient: 'from-blush-300 to-rose-dusty',
  },
  {
    id: 'transport',
    label: 'Transport',
    description: 'Manage transport',
    icon: 'bus',
    gradient: 'from-peach-200 to-blush-300',
  },
];

export const ROLE_HOME: Record<string, string> = {
  admin: '/admin',
  accountant: '/accountant',
  parent: '/parent',
  student: '/student',
  teacher: '/teacher',
  transport: '/transport',
};

/**
 * Where a user goes the FIRST time their role is assigned — i.e. straight into that
 * role's required setup step, not the dashboard. Returning users with a role already
 * on their Firestore doc go to ROLE_HOME instead and let RequireRole bounce them to
 * setup if their profile is still incomplete.
 *
 * Single source of truth: both RoleSelect (already-authenticated edge case) and Login
 * (the normal choose-role-then-authenticate path) call this, so the two can't drift.
 */
export function postRoleDestination(role: Role): string {
  if (role === 'parent' || role === 'student') return '/join-code';
  if (role === 'admin') return '/admin/setup';
  return '/profile-setup';
}
