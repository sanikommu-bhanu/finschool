import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { ROLE_HOME } from '@/constants/roles';
import { bgImages } from '@/constants/images';

export default function Splash() {
  const navigate = useNavigate();
  const { hasOnboarded, isAuthenticated, role, pendingRole } = useAuthStore();

  useEffect(() => {
    // Splash's 2200ms window is idle time — use it to warm the browser cache for
    // Onboarding's photos, so they don't pop in empty on a cold first visit.
    [bgImages.campus, bgImages.mountainSunrise, bgImages.architecture].forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

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

      {/* Radial dark vignette behind the hero typography, for legibility over the photo */}
      <div
        className="absolute inset-0 z-[5] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 55% at 50% 45%, rgba(0,0,0,0.55) 0%, transparent 70%)' }}
      />

      <motion.h1
        initial={{ scale: 0.85, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="font-display text-6xl sm:text-7xl font-bold text-center leading-tight relative z-10 text-white px-6"
        style={{ textShadow: '0 0 40px rgba(255,255,255,0.35), 0 4px 24px rgba(0,0,0,0.5)' }}
      >
        Smart School<br />FinTech
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-sm font-medium text-white/60 mt-5 relative z-10 tracking-wide text-center leading-relaxed"
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
