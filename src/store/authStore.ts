import { create } from 'zustand';
import type { Role } from '@/types';

export interface AuthUser {
  uid: string;
  name: string;
  email: string;
  avatar: string;
}

interface AuthState {
  hasOnboarded: boolean;
  /** True once the initial Firebase onAuthStateChanged callback has fired — prevents a login-page flash on refresh. */
  initialized: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  role: Role | null;
  /**
   * Role picked on /role-select BEFORE authentication. There's no uid at that point,
   * so it can't be written to Firestore yet — it's parked here (and in localStorage,
   * so it survives the Google redirect/popup round-trip) and committed by Login once
   * a uid exists. Cleared as soon as it's persisted.
   */
  pendingRole: Role | null;
  profileCompleted: boolean;
  setOnboarded: () => void;
  setSession: (user: AuthUser | null, role: Role | null, profileCompleted?: boolean) => void;
  setRole: (role: Role) => void;
  setPendingRole: (role: Role) => void;
  clearPendingRole: () => void;
  setProfileCompleted: () => void;
  setInitialized: () => void;
  logout: () => void;
}

function readPendingRole(): Role | null {
  if (typeof window === 'undefined') return null;
  return (localStorage.getItem('ssf-pending-role') as Role | null) ?? null;
}

export const useAuthStore = create<AuthState>()((set) => ({
  hasOnboarded: typeof window !== 'undefined' && localStorage.getItem('ssf-onboarded') === '1',
  initialized: false,
  isAuthenticated: false,
  user: null,
  role: null,
  pendingRole: readPendingRole(),
  profileCompleted: typeof window !== 'undefined' && localStorage.getItem('ssf-profile-done') === '1',
  setOnboarded: () => {
    localStorage.setItem('ssf-onboarded', '1');
    set({ hasOnboarded: true });
  },
  setSession: (user, role, profileCompleted) => set({
    user,
    role,
    isAuthenticated: !!user,
    profileCompleted: profileCompleted ?? false,
  }),
  setRole: (role) => set({ role }),
  setPendingRole: (role) => {
    localStorage.setItem('ssf-pending-role', role);
    set({ pendingRole: role });
  },
  clearPendingRole: () => {
    localStorage.removeItem('ssf-pending-role');
    set({ pendingRole: null });
  },
  setProfileCompleted: () => {
    localStorage.setItem('ssf-profile-done', '1');
    set({ profileCompleted: true });
  },
  setInitialized: () => set({ initialized: true }),
  logout: () => {
    localStorage.removeItem('ssf-profile-done');
    localStorage.removeItem('ssf-pending-role');
    set({ isAuthenticated: false, user: null, role: null, pendingRole: null, profileCompleted: false });
  },
}));
