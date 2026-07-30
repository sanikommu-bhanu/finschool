import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineAcademicCap, HiOutlineCurrencyRupee } from 'react-icons/hi';
import { useAuthStore } from '@/store/authStore';
import { ROLE_HOME } from '@/constants/roles';
import { bgImages } from '@/constants/images';

export default function Splash() {
  const navigate = useNavigate();
  const { hasOnboarded, isAuthenticated, role, pendingRole } = useAuthStore();

  useEffect(() => {
    const t = setTimeout(() => {
      // Flow order: logo (this screen) → onboarding → role select → login → module.
      if (isAuthenticated && role) navigate(ROLE_HOME[role], { replace: true });
      // Signed in but no role on the doc — pick one, then Login commits it.
      else if (isAuthenticated) navigate('/role-select', { replace: true });
      else if (!hasOnboarded) navigate('/onboarding', { replace: true });
      // Role already picked this session, just needs to authenticate.
      else if (pendingRole) navigate('/login', { replace: true });
      // Onboarded but no role chosen yet — role select comes before auth.
      else navigate('/role-select', { replace: true });
    }, 2200);
    return () => clearTimeout(t);
  }, [hasOnboarded, isAuthenticated, navigate, role, pendingRole]);

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center">
      {/* Cherry blossom background */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-[2s] ease-in-out scale-105"
        style={{ backgroundImage: `url(${bgImages.cherryBlossom})` }}
      />
      {/* Soft dark gradient overlay for legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/45 to-black/75" />

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-blush-400/40 blur-3xl animate-float mix-blend-screen" />
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 rounded-full bg-lavender-400/40 blur-3xl animate-float mix-blend-screen" style={{ animationDelay: '1s' }} />
      </div>

      {/* Glowing hexagonal logo — rupee + graduation cap */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="w-28 h-28 glass-card shadow-glow flex items-center justify-center mb-8 relative z-10"
        style={{ clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }}
      >
        <HiOutlineAcademicCap size={44} className="text-blush-600 relative z-10" />
        <div className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-gradient-cta shadow-glow flex items-center justify-center">
          <HiOutlineCurrencyRupee size={14} className="text-white" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-tr from-blush-400/30 to-lavender-400/20 animate-pulse" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="font-display text-5xl font-bold text-center leading-tight relative z-10 text-white"
      >
        Smart School<br />FinTech
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-sm font-medium text-white/60 mt-3 relative z-10 tracking-wide text-center leading-relaxed"
      >
        Smarter Finance<br />Stronger Future
      </motion.p>

      {/* Premium Loading Animation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-20 flex gap-2 z-10"
      >
        <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0 }} className="w-2 h-2 rounded-full bg-blush-600" />
        <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.15 }} className="w-2 h-2 rounded-full bg-blush-500" />
        <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.3 }} className="w-2 h-2 rounded-full bg-blush-400" />
      </motion.div>
    </div>
  );
}
