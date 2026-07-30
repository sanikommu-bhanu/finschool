import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { HiOutlineCube } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { bgImages } from '@/constants/images';
import { signInWithGoogle, signInWithEmail, signUpWithEmail, getUserDocument, sendPasswordReset, setUserRole } from '@/services/authService';
import { ROLE_HOME, postRoleDestination } from '@/constants/roles';
import { useAuthStore } from '@/store/authStore';

export default function Login() {
  const navigate = useNavigate();
  const pendingRole = useAuthStore((s) => s.pendingRole);
  const setRole = useAuthStore((s) => s.setRole);
  const clearPendingRole = useAuthStore((s) => s.clearPendingRole);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');

  const navigateAfterAuth = async (uid: string) => {
    const userDoc = await getUserDocument(uid);

    // Returning user who already has a role on their doc — straight to their module.
    // RequireRole handles bouncing them to setup if their profile is still incomplete.
    if (userDoc?.role) {
      clearPendingRole();
      navigate(ROLE_HOME[userDoc.role], { replace: true });
      return;
    }

    // First-time user: the role was chosen on /role-select before they authenticated.
    // Now that a uid exists, commit it to Firestore and go into that role's setup step.
    if (pendingRole) {
      try {
        await setUserRole(uid, pendingRole);
        setRole(pendingRole);
        clearPendingRole();
        navigate(postRoleDestination(pendingRole), { replace: true });
        return;
      } catch (err) {
        console.error(err);
        toast.error('Signed in, but could not save your role. Please pick it again.');
      }
    }

    // No role on the doc and nothing parked (e.g. someone deep-linked to /login) —
    // send them back to pick one rather than into an empty dashboard.
    navigate('/role-select', { replace: true });
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      toast.success(`Signed in as ${user.displayName ?? user.email}`);
      await navigateAfterAuth(user.uid);
    } catch (err) {
      console.error(err);
      toast.error('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Enter your email address.');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordReset(email);
      toast.success('Password reset email sent! Check your inbox.');
      setMode('login');
    } catch (err) {
      console.error(err);
      toast.error('Could not send reset email. Check the address and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'signup') {
      if (!name || !email || !password || !confirmPassword) {
        toast.error('Please fill in all required fields.');
        return;
      }
      if (password.length < 6) {
        toast.error('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        toast.error('Passwords do not match.');
        return;
      }
      setLoading(true);
      try {
        const user = await signUpWithEmail(email, password, name);
        toast.success(`Welcome, ${name}!`);
        // Role was already chosen on /role-select before this point — commit it and
        // go into that role's setup step.
        await navigateAfterAuth(user.uid);
      } catch (err: unknown) {
        console.error(err);
        toast.error(err instanceof Error ? err.message : 'Signup failed.');
      } finally {
        setLoading(false);
      }
    } else {
      if (!email || !password) {
        toast.error('Please enter email and password.');
        return;
      }
      setLoading(true);
      try {
        const user = await signInWithEmail(email, password);
        toast.success(`Welcome back!`);
        await navigateAfterAuth(user.uid);
      } catch (err: unknown) {
        console.error(err);
        toast.error(err instanceof Error ? err.message : 'Login failed.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-animated relative overflow-hidden flex flex-col">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-25"
        style={{ backgroundImage: `url(${bgImages.cherryBlossom})` }}
      />
      <div className="absolute inset-0 bg-white/20 dark:bg-black/30" />

      <div className="relative z-10 flex-1 flex flex-col justify-center max-w-md mx-auto w-full px-6 safe-top safe-bottom">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="glass-card p-6 max-h-[85vh] overflow-y-auto no-scrollbar"
          >
            <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center mb-5">
              <HiOutlineCube size={22} className="text-blush-600" />
            </div>
            <h1 className="font-display text-2xl font-semibold mb-1">
              {mode === 'login' ? 'Welcome back! 👋' : mode === 'signup' ? 'Create an account' : 'Reset Password'}
            </h1>
            <p className="text-sm text-blush-800/60 dark:text-blush-100/50 mb-6">
              {mode === 'login'
                ? 'Login to your account'
                : mode === 'signup'
                ? 'Sign up to get started'
                : 'Enter your email and we\'ll send you a reset link'}
            </p>

            {mode === 'forgot' ? (
              <form onSubmit={handleForgotPassword} className="space-y-3 mb-5">
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  className="glass-input w-full px-4 py-3.5 text-sm placeholder:text-blush-700/40"
                />
                <Button fullWidth size="lg" disabled={loading} type="submit" className={loading ? '!opacity-70 !cursor-wait mt-2' : 'mt-2'}>
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleEmailSubmit} className="space-y-3 mb-5">
                {mode === 'signup' && (
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name"
                    className="glass-input w-full px-4 py-3.5 text-sm placeholder:text-blush-700/40"
                  />
                )}
                
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  className="glass-input w-full px-4 py-3.5 text-sm placeholder:text-blush-700/40"
                />
                
                {mode === 'signup' && (
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone Number (optional)"
                    className="glass-input w-full px-4 py-3.5 text-sm placeholder:text-blush-700/40"
                  />
                )}

                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="glass-input w-full px-4 py-3.5 text-sm placeholder:text-blush-700/40"
                />
                
                {mode === 'signup' && (
                  <input
                    required
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm Password"
                    className="glass-input w-full px-4 py-3.5 text-sm placeholder:text-blush-700/40"
                  />
                )}

                {mode === 'login' && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-xs text-blush-600 font-semibold hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                <Button fullWidth size="lg" disabled={loading} type="submit" className={loading ? '!opacity-70 !cursor-wait mt-2' : 'mt-2'}>
                  {loading ? 'Please wait…' : mode === 'login' ? 'Login' : 'Sign Up'}
                </Button>
              </form>
            )}

            <div className="flex items-center gap-3 my-5">
              <div className="h-px flex-1 bg-blush-300/40" />
              <span className="text-xs text-blush-700/50">or continue with</span>
              <div className="h-px flex-1 bg-blush-300/40" />
            </div>

            <Button
              fullWidth
              size="lg"
              type="button"
              variant="glass"
              icon={<FcGoogle size={20} />}
              onClick={handleGoogleLogin}
              disabled={loading}
              className={loading ? '!opacity-70 !cursor-wait' : ''}
            >
              Google
            </Button>

            <p className="text-center text-xs text-blush-700/50 mt-5">
              {mode === 'forgot' ? (
                <>
                  Remember your password?{' '}
                  <button type="button" onClick={() => setMode('login')} className="text-blush-600 font-semibold hover:underline">
                    Login
                  </button>
                </>
              ) : mode === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <button type="button" onClick={() => setMode('signup')} className="text-blush-600 font-semibold hover:underline">
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button type="button" onClick={() => setMode('login')} className="text-blush-600 font-semibold hover:underline">
                    Login
                  </button>
                </>
              )}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
