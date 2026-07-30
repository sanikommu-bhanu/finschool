import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { HiOutlineArrowRight, HiOutlineArrowLeft, HiOutlineShieldCheck } from 'react-icons/hi';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { bgImages } from '@/constants/images';

const slides = [
  {
    title: 'Welcome to\nSmart School.',
    desc: 'The complete management ecosystem for modern education.',
    bg: bgImages.campus,
  },
  {
    title: 'AI Powered\nInsights.',
    desc: 'Real-time analytics and smart features for everyone.',
    bg: bgImages.library,
  },
  {
    title: 'Secure.\nConnected.',
    desc: 'Enterprise-grade protection linking all roles seamlessly.',
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
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out scale-105"
        style={{ backgroundImage: `url(${slide.bg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/20 to-white/60 dark:from-black/40 dark:via-black/30 dark:to-black/70 backdrop-blur-sm" />

      <div className="relative z-10 flex-1 flex flex-col justify-between max-w-md mx-auto w-full px-6 pt-8 pb-8 safe-top safe-bottom">
        <div className="flex justify-between items-center h-10">
          {index > 0 ? (
            <button
              onClick={() => setIndex(index - 1)}
              className="w-10 h-10 rounded-full glass flex items-center justify-center text-gray-800 dark:text-gray-200 transition-transform active:scale-95"
            >
              <HiOutlineArrowLeft size={18} />
            </button>
          ) : (
            <div /> // Spacer
          )}
          {!isLast && (
            <button onClick={finish} className="px-4 h-10 rounded-full glass text-sm font-medium text-gray-800 dark:text-gray-200 transition-transform active:scale-95">
              Skip
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 40, filter: 'blur(4px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: -40, filter: 'blur(4px)' }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="glass-card p-8 shadow-2xl relative overflow-hidden"
          >
            {slide.icon && (
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-16 h-16 rounded-2xl glass shadow-glow flex items-center justify-center mb-6 mx-auto"
              >
                <HiOutlineShieldCheck size={32} className="text-emerald-500" />
              </motion.div>
            )}
            <h2 className="font-display text-4xl font-bold leading-tight whitespace-pre-line mb-4 text-gray-900 dark:text-white">
              {slide.title}
            </h2>
            <p className="text-base text-gray-700 dark:text-gray-300 font-medium">{slide.desc}</p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-10">
          <div className="flex justify-center gap-2 mb-6">
            {slides.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-500 ${
                  i === index ? 'w-8 bg-blush-600 shadow-glow' : 'w-2 bg-gray-400/40 dark:bg-gray-600/50'
                }`}
              />
            ))}
          </div>
          <Button
            fullWidth
            size="lg"
            icon={<HiOutlineArrowRight size={20} />}
            onClick={() => (isLast ? finish() : setIndex((i) => i + 1))}
            className="shadow-xl shadow-blush-500/20"
          >
            {isLast ? 'Get Started' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
}
