import { useNavigate } from 'react-router-dom';
import { HiOutlineSparkles, HiOutlineLogout } from 'react-icons/hi';
import { Screen } from '@/components/layout/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { signOutUser } from '@/services/authService';

export default function ComingSoon({ roleLabel }: { roleLabel: string }) {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  return (
    <Screen withNav={false} className="flex flex-col justify-center min-h-screen">
      <GlassCard className="text-center py-10">
        <div className="w-14 h-14 rounded-full glass shadow-glow flex items-center justify-center mx-auto mb-4">
          <HiOutlineSparkles size={24} className="text-blush-600" />
        </div>
        <h1 className="font-display text-xl font-semibold mb-2">{roleLabel} module in progress</h1>
        <p className="text-sm text-blush-700/60 dark:text-blush-200/50 mb-6 max-w-[30ch] mx-auto">
          This dashboard is being built next. The Admin module ships first, followed by the rest, one role at a time.
        </p>
        <Button
          variant="glass"
          icon={<HiOutlineLogout size={16} />}
          onClick={async () => {
            try {
              await signOutUser();
            } finally {
              logout();
              navigate('/login');
            }
          }}
        >
          Switch account
        </Button>
      </GlassCard>
    </Screen>
  );
}
