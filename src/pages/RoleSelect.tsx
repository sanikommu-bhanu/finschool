import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineShieldCheck,
  HiOutlineCreditCard,
  HiOutlineHeart,
  HiOutlineBookOpen,
  HiOutlinePresentationChartLine,
  HiOutlineTruck,
} from 'react-icons/hi';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { ROLES, postRoleDestination } from '@/constants/roles';
import { useAuthStore } from '@/store/authStore';
import { setUserRole } from '@/services/authService';
import { Button } from '@/components/ui/Button';
import type { Role } from '@/types';

const icons: Record<string, typeof HiOutlineShieldCheck> = {
  shield: HiOutlineShieldCheck,
  wallet: HiOutlineCreditCard,
  heart: HiOutlineHeart,
  book: HiOutlineBookOpen,
  chalkboard: HiOutlinePresentationChartLine,
  bus: HiOutlineTruck,
};

export default function RoleSelect() {
  const navigate = useNavigate();
  const setRole = useAuthStore((s) => s.setRole);
  const setPendingRole = useAuthStore((s) => s.setPendingRole);
  const uid = useAuthStore((s) => s.user?.uid);
  const [selected, setSelected] = useState<Role | null>(null);
  const [saving, setSaving] = useState(false);

  const confirm = async () => {
    if (!selected || saving) return;

    // Normal path: role is chosen BEFORE authentication, so there's no uid to write
    // to yet. Park the choice and send them to Login, which commits it once signed in.
    // Deliberately NOT setting `saving` here — this navigation is not a replace, so
    // pressing back would otherwise return to a permanently disabled "Setting up…" button.
    if (!uid) {
      setPendingRole(selected);
      navigate('/login');
      return;
    }

    // Edge case: already signed in but the Firestore doc has no role yet (e.g. a
    // session that was interrupted mid-signup). We have a uid, so write it now.
    setSaving(true);
    try {
      await setUserRole(uid, selected);
      setRole(selected);
      navigate(postRoleDestination(selected), { replace: true });
    } catch (err) {
      console.error(err);
      toast.error('Could not save your role. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-animated flex flex-col justify-center px-6 safe-top safe-bottom">
      <div className="max-w-md mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 text-center">
          <h1 className="font-display text-2xl font-semibold">Choose your role</h1>
          <p className="text-sm text-blush-700/60 dark:text-blush-200/50 mt-1">Select the one that describes you</p>
        </motion.div>

        <div className="grid grid-cols-2 gap-3">
          {ROLES.map((role, i) => {
            const Icon = icons[role.icon];
            const isSelected = selected === role.id;
            return (
              <motion.button
                key={role.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelected(role.id)}
                disabled={saving}
                className={`glass-card p-4 flex flex-col items-start gap-3 text-left transition-all duration-200 ${
                  isSelected
                    ? 'ring-2 ring-blush-500 shadow-glow scale-[1.02]'
                    : selected && !isSelected
                    ? 'opacity-50'
                    : ''
                }`}
              >
                <div className={`w-10 h-10 rounded-xl2 bg-gradient-to-br ${role.gradient} flex items-center justify-center shadow-glow`}>
                  <Icon size={18} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{role.label}</p>
                  <p className="text-[11px] text-blush-700/50 dark:text-blush-200/40">{role.description}</p>
                </div>
              </motion.button>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: selected ? 1 : 0, y: selected ? 0 : 20 }}
          transition={{ duration: 0.3 }}
          className="mt-6"
        >
          <Button
            fullWidth
            size="lg"
            disabled={!selected || saving}
            onClick={confirm}
            className={`shadow-xl shadow-blush-500/20 ${saving ? '!opacity-70 !cursor-wait' : ''}`}
          >
            {saving ? 'Setting up…' : 'Continue'}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
