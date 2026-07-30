import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { HiOutlineUserCircle, HiOutlineUser, HiOutlineMail, HiOutlinePhone, HiOutlineBookOpen, HiOutlineIdentification, HiOutlineTruck } from 'react-icons/hi';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { bgImages } from '@/constants/images';
import { useAuthStore } from '@/store/authStore';
import { markProfileCompleted } from '@/services/authService';
import { ROLE_HOME } from '@/constants/roles';

const FloatingInput = ({ label, icon: Icon, value, onChange, placeholder, type = 'text', readOnly = false }: any) => {
  const [focused, setFocused] = useState(false);
  const active = focused || value;
  
  return (
    <div className={`relative mb-4 group ${readOnly ? 'opacity-70' : ''}`}>
      <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${active && !readOnly ? 'text-blush-600 dark:text-blush-400' : 'text-blush-700/40 dark:text-blush-200/30'}`}>
        <Icon size={18} />
      </div>
      <input
        type={type}
        readOnly={readOnly}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`w-full px-4 py-4 pl-11 bg-white/40 dark:bg-black/20 backdrop-blur-md border outline-none transition-all duration-300 rounded-2xl
          ${focused && !readOnly ? 'border-blush-400/60 dark:border-blush-500/60 shadow-[0_0_15px_rgba(255,182,193,0.3)]' : 'border-white/40 dark:border-white/10'}
          ${!readOnly && 'hover:border-blush-300/50'}
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

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { user, role, setProfileCompleted } = useAuthStore();
  
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !role) return;

    if (role === 'teacher' && !subject) {
      toast.error('Please enter your subject specialization.');
      return;
    }

    setSubmitting(true);
    try {
      const extraFields: Record<string, string> = { phone };
      if (role === 'teacher') extraFields.subject = subject;
      if (role === 'accountant') extraFields.employeeId = employeeId;
      if (role === 'transport') extraFields.licenseNumber = licenseNumber;

      await markProfileCompleted(user.uid, extraFields);
      setProfileCompleted();
      
      toast.success('Profile completed!');
      if (role === 'teacher') {
        navigate('/teacher-verify', { replace: true });
      } else {
        navigate(ROLE_HOME[role] || '/', { replace: true });
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not save profile.');
    } finally {
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
          <div className="absolute top-0 right-0 w-40 h-40 bg-sky-300/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-white/80 to-white/40 dark:from-black/80 dark:to-black/40 p-1 shadow-lg mb-4">
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full rounded-full flex items-center justify-center bg-blush-100 dark:bg-blush-900/50">
                  <HiOutlineUserCircle size={40} className="text-blush-600 dark:text-blush-300" />
                </div>
              )}
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-gray-900 dark:text-white text-center">Complete Profile</h1>
            <p className="text-sm text-blush-800/70 dark:text-blush-100/60 mt-2 text-center max-w-[280px]">
              Just a few more details to set up your {role} account.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="popLayout">
              <motion.div layout className="space-y-1">
                <FloatingInput label="Full Name" icon={HiOutlineUser} value={user?.name || ''} readOnly />
                <FloatingInput label="Email Address" icon={HiOutlineMail} value={user?.email || ''} readOnly />
                
                <div className="pt-2 border-t border-blush-200/30 dark:border-white/10 mt-4">
                  <FloatingInput label="Phone Number (Optional)" icon={HiOutlinePhone} value={phone} onChange={(e: any) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
                  
                  {role === 'teacher' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                      <FloatingInput label="Subject Specialization" icon={HiOutlineBookOpen} value={subject} onChange={(e: any) => setSubject(e.target.value)} placeholder="e.g. Mathematics" />
                    </motion.div>
                  )}
                  
                  {role === 'accountant' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                      <FloatingInput label="Employee ID (Optional)" icon={HiOutlineIdentification} value={employeeId} onChange={(e: any) => setEmployeeId(e.target.value)} placeholder="e.g. EMP-1234" />
                    </motion.div>
                  )}
                  
                  {role === 'transport' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                      <FloatingInput label="License Number (Optional)" icon={HiOutlineTruck} value={licenseNumber} onChange={(e: any) => setLicenseNumber(e.target.value)} placeholder="e.g. DL-XXXX-YYYY" />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            <Button
              fullWidth
              size="lg"
              type="submit"
              className={`mt-6 font-bold text-[15px] shadow-lg shadow-blush-500/20 transition-all ${submitting ? 'opacity-80 cursor-wait scale-[0.98]' : 'hover:scale-[1.02]'}`}
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                'Save Profile'
              )}
            </Button>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
}
