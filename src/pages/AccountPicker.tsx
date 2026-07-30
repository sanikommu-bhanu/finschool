import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { HiOutlineUserCircle } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { signInWithGoogle, getUserDocument } from '@/services/authService';
import { ROLE_HOME } from '@/constants/roles';
import { bgImages } from '@/constants/images';

/**
 * Reached only if someone lands on /accounts directly with a session already
 * established by useAuthListener (e.g. via a bookmarked link). Login.tsx owns
 * the actual Google popup + redirect flow; this screen just confirms the
 * signed-in account and lets you switch to a different Google account.
 */
export default function AccountPicker() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(false);

  const continueAsCurrent = async () => {
    if (!user) return;
    const userDoc = await getUserDocument(user.uid);
    navigate(userDoc?.role ? ROLE_HOME[userDoc.role] : '/role-select');
  };

  const switchAccount = async () => {
    setLoading(true);
    try {
      const fbUser = await signInWithGoogle();
      toast.success(`Signed in as ${fbUser.displayName ?? fbUser.email}`);
      const userDoc = await getUserDocument(fbUser.uid);
      navigate(userDoc?.role ? ROLE_HOME[userDoc.role] : '/role-select');
    } catch (err) {
      console.error(err);
      toast.error('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-animated relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${bgImages.cherryBlossom})` }} />
      <div className="absolute inset-0 bg-white/30 dark:bg-black/30" />
      <div className="relative z-10 flex-1 flex flex-col justify-center max-w-md mx-auto w-full px-6 safe-top safe-bottom">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <FcGoogle size={28} className="mb-4" />
          <h1 className="font-display text-xl font-semibold mb-1">Choose an account</h1>
          <p className="text-sm text-blush-800/60 dark:text-blush-100/50 mb-5">to continue to Smart School FinTech</p>

          <div className="space-y-1.5">
            {user && (
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                whileTap={{ scale: 0.98 }}
                onClick={continueAsCurrent}
                disabled={loading}
                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/40 transition-colors text-left disabled:opacity-50"
              >
                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{user.name}</p>
                  <p className="text-xs text-blush-700/50 truncate">{user.email}</p>
                </div>
              </motion.button>
            )}
            <button
              onClick={switchAccount}
              disabled={loading}
              className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/40 transition-colors text-left disabled:opacity-50"
            >
              <div className="w-10 h-10 rounded-full glass flex items-center justify-center shrink-0">
                <FcGoogle size={18} />
              </div>
              <p className="text-sm font-medium">{loading ? 'Signing in…' : 'Use another account'}</p>
            </button>
          </div>

          <p className="text-[11px] text-blush-700/40 mt-6 leading-relaxed flex gap-2">
            <HiOutlineUserCircle size={28} className="shrink-0" />
            To continue, Google will share your name, email address and profile picture with Smart School FinTech.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
