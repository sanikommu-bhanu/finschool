import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { HiOutlineKey, HiOutlineCamera, HiOutlineQrcode, HiOutlineUser, HiOutlineIdentification, HiOutlinePhone, HiOutlineLocationMarker } from 'react-icons/hi';
import jsQR from 'jsqr';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { GlassCard } from '@/components/ui/GlassCard';
import { bgImages } from '@/constants/images';
import { useAuthStore } from '@/store/authStore';
import { ROLE_HOME } from '@/constants/roles';
import { useMyStudentRecord } from '@/hooks/useMyStudentRecord';
import { useMyChildren } from '@/hooks/useMyChildren';
import { redeemJoinCodeForStudent, redeemJoinCodeForParent } from '@/services/onboarding.service';
import { signOutUser } from '@/services/authService';

const FloatingInput = ({ label, icon: Icon, value, onChange, placeholder, maxLength }: any) => {
  const [focused, setFocused] = useState(false);
  const active = focused || value;
  
  return (
    <div className="relative mb-4 group">
      <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${active ? 'text-blush-600 dark:text-blush-400' : 'text-blush-700/40 dark:text-blush-200/30'}`}>
        <Icon size={18} />
      </div>
      <input
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        maxLength={maxLength}
        className={`w-full px-4 py-4 pl-11 bg-white/40 dark:bg-black/20 backdrop-blur-md border outline-none transition-all duration-300 rounded-2xl
          ${focused ? 'border-blush-400/60 dark:border-blush-500/60 shadow-[0_0_15px_rgba(255,182,193,0.3)]' : 'border-white/40 dark:border-white/10 hover:border-blush-300/50'}
          text-sm text-gray-900 dark:text-white placeholder-transparent`}
        placeholder={placeholder}
      />
      <label className={`absolute left-11 transition-all duration-300 pointer-events-none
        ${active ? '-top-2.5 bg-white/80 dark:bg-black/80 backdrop-blur-sm px-2 text-[10px] font-bold text-blush-600 dark:text-blush-400 rounded-full' : 'top-4 text-sm text-blush-700/40 dark:text-blush-200/30'}`}>
        {label}
      </label>
    </div>
  );
};

export default function JoinCodeEntry() {
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.role);
  const email = useAuthStore((s) => s.user?.email ?? '');
  const logout = useAuthStore((s) => s.logout);

  const { data: myStudent, isLoading: studentLoading } = useMyStudentRecord();
  const { data: myChildren, isLoading: childrenLoading } = useMyChildren();

  const alreadyLinked =
    (role === 'student' && !!myStudent) || (role === 'parent' && !!myChildren?.length);
  const checking = role === 'student' ? studentLoading : role === 'parent' ? childrenLoading : false;

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [guardian, setGuardian] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [childName, setChildName] = useState('');
  const [childRollNo, setChildRollNo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [showScanner, setShowScanner] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const stopCamera = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t: MediaStreamTrack) => t.stop());
    streamRef.current = null;
  };

  const startScanner = async () => {
    setShowScanner(true);
    setCameraError(null);
    let cancelled = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (!showScanner && cancelled) {
        stream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const tick = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const qr = jsQR(imageData.data, imageData.width, imageData.height);
            if (qr?.data) {
              try {
                const parsed = JSON.parse(qr.data);
                if (parsed.type === 'join_code' && parsed.code) {
                  setCode(parsed.code);
                  toast.success(`Found code for ${parsed.className || 'Class'}`);
                  setShowScanner(false);
                  stopCamera();
                  return;
                }
              } catch {
                // Ignore invalid JSON
              }
            }
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      setCameraError('Camera access denied or unavailable.');
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-animated flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-blush-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (alreadyLinked && role) {
    navigate(ROLE_HOME[role], { replace: true });
    return null;
  }

  if (role !== 'student' && role !== 'parent') {
    if (role) navigate(ROLE_HOME[role], { replace: true });
    return null;
  }

  /**
   * Previously this was "Skip to Dashboard", which dropped a parent/student onto a
   * dashboard with no child, no class and no fee profile — every widget empty. That is
   * the single biggest reason the app read as broken on a fresh account.
   *
   * There is no meaningful dashboard without a class link, so the escape hatch is now
   * sign-out rather than a bypass. Kept as sign-out (not removed outright) so a user
   * who doesn't have a code yet isn't trapped on this screen with no way off it.
   */
  const signOutAndExit = async () => {
    try {
      await signOutUser();
    } catch (err) {
      console.error(err);
    } finally {
      logout();
      navigate('/login', { replace: true });
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.error('Enter the join code your teacher shared');
      return;
    }
    setSubmitting(true);
    try {
      if (role === 'student') {
        if (!name.trim() || !rollNo.trim() || !guardian.trim() || !guardianPhone.trim()) {
          toast.error('Fill in all fields');
          setSubmitting(false);
          return;
        }
        const result = await redeemJoinCodeForStudent(code, {
          name,
          rollNo,
          guardian,
          guardianPhone,
          guardianEmail: '',
          studentEmail: email,
          attendance: 100,
          avatar: '',
        });
        if (result === 'invalid_code') {
          toast.error('That join code is invalid or inactive');
          setSubmitting(false);
          return;
        }
        toast.success('Class joined!');
        navigate('/student', { replace: true });
      } else {
        if (!name.trim() || !phone.trim() || !childName.trim()) {
          toast.error('Fill in all fields');
          setSubmitting(false);
          return;
        }
        const result = await redeemJoinCodeForParent(
          code,
          { name, email, phone, address, childrenNames: childName, avatar: '' },
          childName,
          childRollNo
        );
        if (result === 'invalid_code') {
          toast.error('That join code is invalid or inactive');
          setSubmitting(false);
          return;
        }
        toast.success('Child linked!');
        navigate('/parent', { replace: true });
      }
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-animated relative flex flex-col items-center justify-center py-10 px-4">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-25 fixed"
        style={{ backgroundImage: `url(${bgImages.campus})` }}
      />
      <div className="absolute inset-0 bg-white/30 dark:bg-black/40 backdrop-blur-sm fixed" />

      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="w-full max-w-md relative z-10">
        <GlassCard padding="lg" glow className="overflow-hidden border-white/60 dark:border-white/10 shadow-2xl">
          <div className="absolute top-0 right-0 w-40 h-40 bg-blush-300/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
          
          <div className="flex items-center justify-between mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blush-200 to-blush-100 dark:from-blush-900/50 dark:to-blush-800/30 flex items-center justify-center shadow-inner border border-white/50 dark:border-white/10">
              <HiOutlineKey size={26} className="text-blush-700 dark:text-blush-300" />
            </div>
            <button
              type="button"
              onClick={startScanner}
              className="flex items-center gap-1.5 text-xs font-bold text-blush-700 dark:text-blush-300 bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/40 px-3 py-1.5 rounded-full transition-all border border-blush-200/50 dark:border-blush-800/50 shadow-sm"
            >
              <HiOutlineCamera size={16} /> Scan QR
            </button>
          </div>
          
          <h1 className="font-display text-3xl font-bold mb-2 tracking-tight text-gray-900 dark:text-white">Join Your Class</h1>
          <p className="text-sm text-blush-800/70 dark:text-blush-100/60 mb-8 leading-relaxed">
            {role === 'student'
              ? "Your teacher shared a 6-character code — it connects you to your class and automates your learning journey."
              : "Your child's teacher shared a 6-character code — it connects you directly to their academic progress."}
          </p>

          <AnimatePresence mode="popLayout">
            <motion.div layout className="space-y-1">
              <FloatingInput label="Class Join Code" icon={HiOutlineKey} value={code} onChange={(e: any) => setCode(e.target.value.toUpperCase())} maxLength={6} placeholder="ABC123" />
              
              {role === 'student' ? (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-1 pt-2 border-t border-blush-200/30 dark:border-white/10 mt-4">
                  <FloatingInput label="Your Full Name" icon={HiOutlineUser} value={name} onChange={(e: any) => setName(e.target.value)} placeholder="e.g. Aarav Sharma" />
                  <div className="grid grid-cols-2 gap-3">
                    <FloatingInput label="Roll No." icon={HiOutlineIdentification} value={rollNo} onChange={(e: any) => setRollNo(e.target.value)} placeholder="e.g. 21" />
                    <FloatingInput label="Guardian Phone" icon={HiOutlinePhone} value={guardianPhone} onChange={(e: any) => setGuardianPhone(e.target.value)} placeholder="+91..." />
                  </div>
                  <FloatingInput label="Guardian Name" icon={HiOutlineUser} value={guardian} onChange={(e: any) => setGuardian(e.target.value)} placeholder="e.g. Rohan Sharma" />
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-1 pt-2 border-t border-blush-200/30 dark:border-white/10 mt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <FloatingInput label="Your Name" icon={HiOutlineUser} value={name} onChange={(e: any) => setName(e.target.value)} placeholder="e.g. Priya" />
                    <FloatingInput label="Your Phone" icon={HiOutlinePhone} value={phone} onChange={(e: any) => setPhone(e.target.value)} placeholder="+91..." />
                  </div>
                  <FloatingInput label="Address (Optional)" icon={HiOutlineLocationMarker} value={address} onChange={(e: any) => setAddress(e.target.value)} placeholder="e.g. 123 Main St" />
                  <div className="grid grid-cols-2 gap-3">
                    <FloatingInput label="Child's Name" icon={HiOutlineUser} value={childName} onChange={(e: any) => setChildName(e.target.value)} placeholder="e.g. Aarav" />
                    <FloatingInput label="Roll No. (Optional)" icon={HiOutlineIdentification} value={childRollNo} onChange={(e: any) => setChildRollNo(e.target.value)} placeholder="e.g. 21" />
                  </div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>

          <Button
            fullWidth
            size="lg"
            className={`mt-8 font-bold text-[15px] shadow-lg shadow-blush-500/20 transition-all ${submitting ? 'opacity-80 cursor-wait scale-[0.98]' : 'hover:scale-[1.02]'}`}
            disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Connecting...
              </span>
            ) : (
              'Connect Account'
            )}
          </Button>

          <p className="text-center text-xs font-semibold text-blush-700/50 dark:text-blush-200/40 mt-6">
            Already setup by the school?{' '}
            <button onClick={signOutAndExit} className="text-blush-600 dark:text-blush-400 hover:underline transition-all">Sign out</button>
          </p>
        </GlassCard>
      </motion.div>

      <BottomSheet
        open={showScanner}
        onClose={() => {
          setShowScanner(false);
          stopCamera();
        }}
        title="Scan Join Code"
      >
        <div className="flex flex-col items-center">
          <p className="text-xs text-blush-700/60 dark:text-blush-200/50 text-center mb-6 max-w-[250px]">
            Position the teacher's QR code within the frame to scan automatically.
          </p>
          <div className="w-full max-w-[280px] aspect-square rounded-[32px] overflow-hidden glass relative shadow-2xl border-4 border-white/50">
            {cameraError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-white/50 dark:bg-black/50">
                <HiOutlineQrcode size={40} className="text-blush-700/40 mb-3" />
                <p className="text-sm font-semibold text-blush-800/70">{cameraError}</p>
              </div>
            ) : (
              <>
                <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 shadow-[inset_0_0_0_1000px_rgba(0,0,0,0.3)]">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-[3px] border-white/90 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]">
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-[4px] border-l-[4px] border-blush-400 rounded-tl-xl" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-[4px] border-r-[4px] border-blush-400 rounded-tr-xl" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-[4px] border-l-[4px] border-blush-400 rounded-bl-xl" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-[4px] border-r-[4px] border-blush-400 rounded-br-xl" />
                  </div>
                </div>
              </>
            )}
          </div>
          <Button
            variant="glass"
            className="mt-8 px-8 font-bold text-blush-700"
            onClick={() => {
              setShowScanner(false);
              stopCamera();
            }}
          >
            Cancel Scan
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
