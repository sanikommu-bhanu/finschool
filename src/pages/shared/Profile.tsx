import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlinePencil, HiOutlineKey, HiOutlineUsers, HiOutlineCreditCard, HiOutlineQuestionMarkCircle, HiOutlineLogout, HiOutlineLockClosed, HiOutlineDeviceMobile, HiOutlineChatAlt2, HiOutlineCreditCard as HiCard } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { Screen } from '@/components/layout/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthStore } from '@/store/authStore';
import { signOutUser, updateUserProfile } from '@/services/authService';
import { useMyChildren } from '@/hooks/useMyChildren';

type SheetKind = 'edit' | 'password' | 'children' | 'payment' | null;

const items: { icon: typeof HiOutlinePencil; label: string; path?: string; sheet?: SheetKind }[] = [
  { icon: HiOutlinePencil, label: 'Edit Profile', sheet: 'edit' },
  { icon: HiOutlineKey, label: 'Change Password', sheet: 'password' },
  { icon: HiOutlineUsers, label: 'My Children', sheet: 'children' },
  { icon: HiOutlineCreditCard, label: 'Payment Methods', sheet: 'payment' },
  { icon: HiOutlineChatAlt2, label: 'Messages', path: 'messages' },
  { icon: HiOutlineQuestionMarkCircle, label: 'Help & Support', path: 'help' },
];

const PAYMENT_METHODS = [
  { icon: HiOutlineDeviceMobile, label: 'UPI', detail: 'Google Pay, PhonePe, Paytm' },
  { icon: HiCard, label: 'Debit / Credit Card', detail: 'Visa, Mastercard, RuPay' },
  { icon: HiOutlineDeviceMobile, label: 'Net Banking', detail: 'All major banks' },
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, role, logout } = useAuthStore();
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [name, setName] = useState(user?.name ?? '');
  const { data: children, isLoading: childrenLoading } = useMyChildren();

  const doLogout = async () => {
    try {
      await signOutUser();
    } catch (err) {
      console.error(err);
    } finally {
      logout();
      toast.success('Signed out');
      navigate('/login', { replace: true });
    }
  };

  return (
    <Screen withNav={false}>
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => navigate(-1)} className="glass-pill w-9 h-9 flex items-center justify-center">
          <HiOutlineChevronLeft size={18} />
        </button>
        <h1 className="font-display text-lg font-semibold">Profile</h1>
      </div>

      <GlassCard className="flex items-center gap-3 mb-5">
        <img src={user?.avatar} className="w-16 h-16 rounded-full object-cover" alt={user?.name} />
        <div className="min-w-0">
          <p className="font-display font-semibold truncate">{user?.name}</p>
          <p className="text-xs text-blush-700/50 truncate">{user?.email}</p>
          <span className="inline-block mt-1 text-[10px] font-semibold bg-gradient-cta text-white px-2 py-0.5 rounded-full capitalize">
            {role}
          </span>
        </div>
      </GlassCard>

      <GlassCard padding="none" className="divide-y divide-white/40 dark:divide-white/5">
        {items
          .filter((item) => item.sheet !== 'children' || role === 'parent')
          .map((item) => (
            <button
              key={item.label}
              onClick={() => (item.path ? navigate(item.path) : setSheet(item.sheet ?? null))}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-white/30 dark:active:bg-white/5 transition-colors"
            >
              <item.icon size={18} className="text-blush-600 shrink-0" />
              <span className="text-sm flex-1">{item.label}</span>
              <HiOutlineChevronRight size={16} className="text-blush-700/30" />
            </button>
          ))}
      </GlassCard>

      <button
        onClick={doLogout}
        className="w-full mt-4 flex items-center justify-center gap-2 glass-pill py-3.5 text-rose-600 font-semibold text-sm"
      >
        <HiOutlineLogout size={18} /> Logout
      </button>

      <BottomSheet open={sheet === 'edit'} onClose={() => setSheet(null)} title="Edit Profile">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-blush-700/60 mb-1 block">Display name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="glass-input w-full px-4 py-3 text-sm"
              placeholder="Your name"
            />
          </div>
          <p className="text-xs text-blush-700/50">
            Name and photo are synced from your Google account. Changes here only apply to this app's display name.
          </p>
          <Button
            fullWidth
            size="lg"
            onClick={async () => {
              try {
                await updateUserProfile(name);
                toast.success('Profile updated');
                setSheet(null);
              } catch (err) {
                console.error(err);
                toast.error('Failed to update profile');
              }
            }}
          >
            Save changes
          </Button>
        </div>
      </BottomSheet>

      <BottomSheet open={sheet === 'password'} onClose={() => setSheet(null)} title="Change password">
        <div className="flex items-start gap-3 mb-4 p-3 rounded-xl2 glass">
          <HiOutlineLockClosed size={18} className="text-blush-600 mt-0.5 shrink-0" />
          <p className="text-xs text-blush-800/70 dark:text-blush-100/60 leading-relaxed">
            This account signs in with Google only, so there's no separate app password to change. Manage your
            Google account's password and 2-step verification directly from your Google account settings.
          </p>
        </div>
        <Button fullWidth size="lg" onClick={() => { window.open('https://myaccount.google.com/security', '_blank'); setSheet(null); }}>
          Open Google Account Security
        </Button>
      </BottomSheet>

      <BottomSheet open={sheet === 'children'} onClose={() => setSheet(null)} title="My Children">
        {childrenLoading ? (
          <div className="space-y-2.5">
            <Skeleton className="h-16 rounded-xl3" />
            <Skeleton className="h-16 rounded-xl3" />
          </div>
        ) : !children || children.length === 0 ? (
          <EmptyState icon={HiOutlineUsers} title="No children linked" description="Ask the school admin to link your child's record to your email." />
        ) : (
          <div className="space-y-2.5">
            {children.map((c) => (
              <div key={c.id} className="glass-card flex items-center gap-3 p-3">
                <img src={c.avatar || `https://i.pravatar.cc/150?u=${c.id}`} className="w-11 h-11 rounded-full object-cover" alt={c.name} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{c.name}</p>
                  <p className="text-xs text-blush-700/50 truncate">Class {c.className} · Roll No. {c.rollNo}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </BottomSheet>

      <BottomSheet open={sheet === 'payment'} onClose={() => setSheet(null)} title="Payment Methods">
        <div className="space-y-2.5">
          {PAYMENT_METHODS.map((m) => (
            <div key={m.label} className="glass-card flex items-center gap-3 p-3.5">
              <div className="w-10 h-10 rounded-xl2 glass flex items-center justify-center shrink-0">
                <m.icon size={18} className="text-blush-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{m.label}</p>
                <p className="text-xs text-blush-700/50 truncate">{m.detail}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-blush-700/50 mt-3">
          Fees are collected securely at the time of payment — no card or bank details are stored in the app.
        </p>
      </BottomSheet>
    </Screen>
  );
}
