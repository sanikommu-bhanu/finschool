import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { HiOutlineArrowRight, HiOutlineShieldCheck } from 'react-icons/hi';
import { useAuthStore } from '@/store/authStore';
import { bgImages } from '@/constants/images';

const slides = [
  {
    headline: 'Manage.\nCollect.\nGrow.',
    subtitle: 'A complete finance management solution for modern schools.',
    bg: bgImages.campus,
  },
  {
    headline: 'Real-time\ninsights,\nBetter\ndecisions.',
    subtitle: 'Track collections, fees, expenses and everything in real-time.',
    bg: bgImages.mountainSunrise,
  },
  {
    headline: 'Secure.\nSimple.\nReliable.',
    subtitle: 'Your data is 100% secure with enterprise grade protection.',
    bg: bgImages.architecture,
    icon: true,
  },
];

export default function Onboarding() {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();
  const setOnboarded = useAuthStore((s) => s.setOnboarded);
  const isLast = index === slides.length - 1;

  const finish = () => {
    setOnboarded();
    // Role selection comes before authentication.
    navigate('/role-select');
  };

  const slide = slides[index];

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Full-bleed slide image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out scale-105"
        style={{ backgroundImage: `url(${slide.bg})` }}
      />
      {/* Dark gradient overlay for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/10 to-black/80" />

      <div className="relative z-10 flex-1 flex flex-col max-w-md mx-auto w-full px-6 pt-12 pb-8 safe-top safe-bottom">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 40, filter: 'blur(4px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: -40, filter: 'blur(4px)' }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <h2 className="font-display text-5xl font-bold leading-tight whitespace-pre-line text-white">
              {slide.headline}
            </h2>
            <p className="text-sm font-medium text-white/70 mt-3 max-w-xs">{slide.subtitle}</p>
          </motion.div>
        </AnimatePresence>

        <div className="flex-1 flex items-center justify-center">
          {slide.icon && (
            <motion.div
              initial={{ scale: 0, rotate: -20, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-32 h-32 rounded-full glass shadow-glow flex items-center justify-center"
            >
              <HiOutlineShieldCheck size={64} className="text-blush-500" />
            </motion.div>
          )}
        </div>

        <div className="mt-6">
          <div className="flex justify-center gap-2 mb-6">
            {slides.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-500 ${
                  i === index ? 'w-8 bg-blush-600 shadow-glow' : 'w-2 bg-white/30'
                }`}
              />
            ))}
          </div>

          {isLast ? (
            <button
              onClick={finish}
              className="btn-primary w-full py-4 text-base font-semibold"
            >
              Get Started
            </button>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={() => setIndex((i) => i + 1)}
                className="btn-primary pl-6 pr-1.5 py-1.5 flex items-center gap-4 text-base font-semibold"
              >
                Next
                <span className="w-9 h-9 rounded-full bg-white/25 flex items-center justify-center shrink-0">
                  <HiOutlineArrowRight size={18} />
                </span>
              </button>
              <button onClick={finish} className="text-sm font-medium text-white/70 active:scale-95 transition-transform">
                Skip
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
