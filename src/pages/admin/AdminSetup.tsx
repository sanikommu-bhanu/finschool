import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { getSchoolProfile, saveSchoolProfile, createAcademicYear, createGrade, createClassSection } from '@/services/academicStructure.service';
import { seedDefaultSchoolData } from '@/services/demoData.service';
import { CLASS_OPTIONS } from '@/schemas/student.schema';
import { HiOutlineOfficeBuilding, HiOutlineAcademicCap, HiOutlineViewGrid, HiOutlineBookOpen, HiOutlineUserGroup, HiOutlineCreditCard, HiOutlineTruck, HiOutlineArrowLeft, HiOutlineMail, HiOutlineCalendar } from 'react-icons/hi';
import { bgImages } from '@/constants/images';
import { useAuthStore } from '@/store/authStore';

const GRADES = ['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

/**
 * Maps this wizard's short grade labels onto the canonical CLASS_OPTIONS vocabulary
 * used by every other module ("5" -> "Class 5"; "LKG" stays "LKG"). Falls back to the
 * raw label if there's no match, so an unexpected grade never silently becomes "".
 */
function canonicalClassName(gradeName: string): string {
  if (CLASS_OPTIONS.includes(gradeName)) return gradeName;
  const prefixed = `Class ${gradeName}`;
  if (CLASS_OPTIONS.includes(prefixed)) return prefixed;
  return gradeName;
}
const SECTIONS = ['A', 'B', 'C', 'D'];

const FloatingInput = ({ label, icon: Icon, value, onChange, placeholder, type = 'text' }: any) => {
  const [focused, setFocused] = useState(false);
  const active = focused || value;
  
  return (
    <div className="relative mb-4 group">
      <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${active ? 'text-blush-600 dark:text-blush-400' : 'text-blush-700/40 dark:text-blush-200/30'}`}>
        <Icon size={18} />
      </div>
      <input
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
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

export default function AdminSetup() {
  const navigate = useNavigate();
  const setProfileCompleted = useAuthStore((s) => s.setProfileCompleted);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  
  // Step 1
  const [schoolName, setSchoolName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [academicYearName, setAcademicYearName] = useState('2026-2027');

  // Step 2
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);

  // Step 3
  const [selectedSections, setSelectedSections] = useState<Record<string, string[]>>({});

  // Step 4
  const [subjects, setSubjects] = useState<string>('Mathematics, Science, English, History');

  useEffect(() => {
    getSchoolProfile().then((profile) => {
      if (profile && profile.name) {
        setProfileCompleted();
        navigate('/admin', { replace: true });
      } else {
        setLoading(false);
      }
    });
  }, [navigate, setProfileCompleted]);

  const handleNext = () => {
    if (step === 1 && (!schoolName || !academicYearName)) {
      toast.error('Please fill in required fields');
      return;
    }
    if (step === 2 && selectedGrades.length === 0) {
      toast.error('Select at least one grade');
      return;
    }
    setStep((s) => s + 1);
  };

  const handlePrev = () => setStep((s) => s - 1);

  const toggleGrade = (g: string) => {
    setSelectedGrades((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  };

  const toggleSection = (grade: string, section: string) => {
    setSelectedSections((prev) => {
      const current = prev[grade] || [];
      return {
        ...prev,
        [grade]: current.includes(section) ? current.filter((x) => x !== section) : [...current, section],
      };
    });
  };

  const finishSetup = async () => {
    setSubmitting(true);
    try {
      const today = new Date();
      const nextYear = new Date();
      nextYear.setFullYear(today.getFullYear() + 1);
      
      const yearId = await createAcademicYear({
        label: academicYearName,
        startDate: today.toISOString().split('T')[0],
        endDate: nextYear.toISOString().split('T')[0],
        isActive: true,
      });

      await saveSchoolProfile({
        name: schoolName,
        address: '',
        phone: '',
        email: contactEmail,
        website: '',
        activeAcademicYearId: yearId,
      });

      // Create grades and sections.
      //
      // className MUST match the CLASS_OPTIONS vocabulary ("Class 5", "LKG") that
      // students, teachers, fee templates, join codes, attendance and assignments all
      // key off. This previously emitted `${gradeName}-${sec}` ("5-A"), a third naming
      // scheme that matched nothing else in the app — so a class created here could
      // never link to a fee template, a join code, or a student roster. Sections are
      // preserved in the `section` field rather than being baked into className.
      for (const gradeName of selectedGrades) {
        const gradeId = await createGrade({
          name: `Grade ${gradeName}`,
          order: GRADES.indexOf(gradeName),
        });
        const secs = selectedSections[gradeName] || ['A'];
        for (const sec of secs) {
          await createClassSection({
            gradeId,
            gradeName: `Grade ${gradeName}`,
            section: sec,
            className: canonicalClassName(gradeName),
            academicYearId: yearId,
            classTeacherId: '',
            capacity: 40,
          });
        }
      }

      // Fee templates + transport fleet. Runs last and never throws, so a seeding
      // problem can't undo a school setup that already succeeded. Everything it
      // creates is editable from the normal admin screens afterwards.
      const seeded = await seedDefaultSchoolData(academicYearName);

      setProfileCompleted();
      if (seeded.feeTemplates > 0 || seeded.transportRecords > 0) {
        toast.success(
          `School setup complete! Added ${seeded.feeTemplates} fee templates and ${seeded.transportRecords} transport records — all editable.`
        );
      } else {
        toast.success('School setup complete!');
      }
      navigate('/admin', { replace: true });
    } catch (err) {
      console.error(err);
      toast.error('Setup failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-animated flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-blush-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  const stepAnimations = {
    initial: { opacity: 0, scale: 0.95, x: 20 },
    animate: { opacity: 1, scale: 1, x: 0 },
    exit: { opacity: 0, scale: 0.95, x: -20 },
    transition: { duration: 0.4, ease: "easeOut" }
  };

  return (
    <div className="min-h-screen bg-animated relative overflow-hidden flex flex-col py-8 px-4">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-25 fixed"
        style={{ backgroundImage: `url(${bgImages.campus})` }}
      />
      <div className="absolute inset-0 bg-white/30 dark:bg-black/40 backdrop-blur-sm fixed" />
      
      <div className="relative z-10 flex-1 flex flex-col justify-between max-w-md mx-auto w-full">
        
        <div className="flex justify-between items-center h-12 mb-4">
          {step > 1 ? (
            <button onClick={handlePrev} className="w-10 h-10 rounded-full bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/40 border border-white/50 dark:border-white/10 flex items-center justify-center text-gray-800 dark:text-gray-200 transition-all shadow-sm">
              <HiOutlineArrowLeft size={18} />
            </button>
          ) : (
            <div className="w-10 h-10" />
          )}
          {step > 4 && step < 7 && (
            <button onClick={handleNext} className="px-5 h-10 rounded-full bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/40 border border-white/50 dark:border-white/10 text-sm font-bold text-gray-800 dark:text-gray-200 transition-all shadow-sm">
              Skip
            </button>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-center relative">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="1" {...stepAnimations} className="w-full">
                <GlassCard padding="lg" glow className="shadow-2xl border-white/60 dark:border-white/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-sky-300/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blush-200 to-blush-100 dark:from-blush-900/50 dark:to-blush-800/30 flex items-center justify-center mb-6 mx-auto shadow-inner border border-white/50 dark:border-white/10">
                    <HiOutlineOfficeBuilding size={32} className="text-blush-700 dark:text-blush-300" />
                  </div>
                  <h1 className="font-display text-3xl font-bold mb-2 tracking-tight text-gray-900 dark:text-white text-center">School Profile</h1>
                  <p className="text-sm text-blush-800/70 dark:text-blush-100/60 mb-8 text-center leading-relaxed">Let's set up the basics for your institution.</p>
                  <div className="space-y-2">
                    <FloatingInput label="School Name" icon={HiOutlineOfficeBuilding} value={schoolName} onChange={(e: any) => setSchoolName(e.target.value)} placeholder="e.g. Smart International" />
                    <FloatingInput label="Contact Email" icon={HiOutlineMail} type="email" value={contactEmail} onChange={(e: any) => setContactEmail(e.target.value)} placeholder="admin@school.com" />
                    <FloatingInput label="Academic Year" icon={HiOutlineCalendar} value={academicYearName} onChange={(e: any) => setAcademicYearName(e.target.value)} placeholder="2026-2027" />
                  </div>
                </GlassCard>
              </motion.div>
            )}
            
            {step === 2 && (
              <motion.div key="2" {...stepAnimations} className="w-full">
                <GlassCard padding="lg" glow className="shadow-2xl border-white/60 dark:border-white/10 relative overflow-hidden">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blush-200 to-blush-100 dark:from-blush-900/50 dark:to-blush-800/30 flex items-center justify-center mb-6 mx-auto shadow-inner border border-white/50 dark:border-white/10">
                    <HiOutlineAcademicCap size={32} className="text-blush-700 dark:text-blush-300" />
                  </div>
                  <h1 className="font-display text-3xl font-bold mb-2 tracking-tight text-gray-900 dark:text-white text-center">Grades Offered</h1>
                  <p className="text-sm text-blush-800/70 dark:text-blush-100/60 mb-8 text-center leading-relaxed">Select all the grades your school currently offers.</p>
                  
                  <div className="flex flex-wrap gap-2.5 justify-center">
                    {GRADES.map(g => (
                      <button 
                        key={g} 
                        onClick={() => toggleGrade(g)} 
                        className={`px-5 py-3 rounded-2xl border-2 text-sm font-bold transition-all duration-300 ${
                          selectedGrades.includes(g) 
                            ? 'bg-blush-500 border-blush-500 text-white shadow-lg shadow-blush-500/30 scale-105' 
                            : 'bg-white/40 dark:bg-black/20 border-white/50 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-blush-300/50'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="3" {...stepAnimations} className="w-full">
                <GlassCard padding="lg" glow className="shadow-2xl border-white/60 dark:border-white/10 relative max-h-[65vh] flex flex-col">
                  <div className="shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blush-200 to-blush-100 dark:from-blush-900/50 dark:to-blush-800/30 flex items-center justify-center mb-6 mx-auto shadow-inner border border-white/50 dark:border-white/10">
                      <HiOutlineViewGrid size={32} className="text-blush-700 dark:text-blush-300" />
                    </div>
                    <h1 className="font-display text-3xl font-bold mb-2 tracking-tight text-gray-900 dark:text-white text-center">Class Sections</h1>
                    <p className="text-sm text-blush-800/70 dark:text-blush-100/60 mb-6 text-center leading-relaxed">Assign sections (A, B, C...) to each grade.</p>
                  </div>
                  
                  <div className="space-y-3 overflow-y-auto pr-2 no-scrollbar pb-4 flex-1">
                    {selectedGrades.map(g => (
                      <div key={g} className="bg-white/40 dark:bg-black/20 border border-white/50 dark:border-white/10 p-4 rounded-2xl">
                        <p className="text-sm font-bold text-gray-900 dark:text-white mb-3">Grade {g}</p>
                        <div className="flex flex-wrap gap-2">
                          {SECTIONS.map(s => (
                            <button 
                              key={s} 
                              onClick={() => toggleSection(g, s)} 
                              className={`w-10 h-10 rounded-xl text-sm font-bold transition-all duration-300 ${
                                (selectedSections[g] || []).includes(s) 
                                  ? 'bg-blush-500 text-white shadow-md shadow-blush-500/30' 
                                  : 'bg-white/60 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-blush-100 dark:hover:bg-blush-900/30'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="4" {...stepAnimations} className="w-full">
                <GlassCard padding="lg" glow className="shadow-2xl border-white/60 dark:border-white/10 relative overflow-hidden">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blush-200 to-blush-100 dark:from-blush-900/50 dark:to-blush-800/30 flex items-center justify-center mb-6 mx-auto shadow-inner border border-white/50 dark:border-white/10">
                    <HiOutlineBookOpen size={32} className="text-blush-700 dark:text-blush-300" />
                  </div>
                  <h1 className="font-display text-3xl font-bold mb-2 tracking-tight text-gray-900 dark:text-white text-center">Core Subjects</h1>
                  <p className="text-sm text-blush-800/70 dark:text-blush-100/60 mb-8 text-center leading-relaxed">Add comma-separated subjects offered.</p>
                  
                  <div className="relative group">
                    <div className="absolute top-4 left-4 text-blush-700/40 dark:text-blush-200/30 pointer-events-none">
                      <HiOutlineBookOpen size={18} />
                    </div>
                    <textarea
                      value={subjects}
                      onChange={(e) => setSubjects(e.target.value)}
                      rows={4}
                      className="w-full p-4 pl-11 bg-white/40 dark:bg-black/20 backdrop-blur-md border border-white/40 dark:border-white/10 hover:border-blush-300/50 outline-none transition-all duration-300 rounded-2xl text-sm text-gray-900 dark:text-white resize-none"
                    />
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div key="5" {...stepAnimations} className="w-full">
                <GlassCard padding="lg" glow className="shadow-2xl border-white/60 dark:border-white/10 relative overflow-hidden flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-[28px] bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center mb-6 shadow-inner border border-white/50">
                    <HiOutlineUserGroup size={36} className="text-sky-600 dark:text-sky-400" />
                  </div>
                  <h1 className="font-display text-3xl font-bold mb-3 tracking-tight text-gray-900 dark:text-white">Teacher Profiles</h1>
                  <p className="text-sm text-blush-800/70 dark:text-blush-100/60 leading-relaxed mb-4">
                    Once setup is complete, you can onboard teachers via the Admin Dashboard and assign them to the classes you just created.
                  </p>
                </GlassCard>
              </motion.div>
            )}

            {step === 6 && (
              <motion.div key="6" {...stepAnimations} className="w-full">
                <GlassCard padding="lg" glow className="shadow-2xl border-white/60 dark:border-white/10 relative overflow-hidden flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-[28px] bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-6 shadow-inner border border-white/50">
                    <HiOutlineCreditCard size={36} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h1 className="font-display text-3xl font-bold mb-3 tracking-tight text-gray-900 dark:text-white">Fee Management</h1>
                  <p className="text-sm text-blush-800/70 dark:text-blush-100/60 leading-relaxed mb-4">
                    You can configure term fee templates, transport fees, and payment methods from the Accountant dashboard later.
                  </p>
                </GlassCard>
              </motion.div>
            )}

            {step === 7 && (
              <motion.div key="7" {...stepAnimations} className="w-full">
                <GlassCard padding="lg" glow className="shadow-2xl border-white/60 dark:border-white/10 relative overflow-hidden flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-[28px] bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-6 shadow-inner border border-white/50">
                    <HiOutlineTruck size={36} className="text-amber-600 dark:text-amber-400" />
                  </div>
                  <h1 className="font-display text-3xl font-bold mb-3 tracking-tight text-gray-900 dark:text-white">Fleet Management</h1>
                  <p className="text-sm text-blush-800/70 dark:text-blush-100/60 leading-relaxed mb-4">
                    Configure your school buses, map routes, and assign drivers easily from the Transport operations center.
                  </p>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-8">
          <div className="flex justify-center gap-2.5 mb-6">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === step ? 'w-8 bg-blush-600 shadow-[0_0_8px_rgba(255,182,193,0.8)]' : 'w-2 bg-black/10 dark:bg-white/20'
                }`}
              />
            ))}
          </div>
          <Button
            fullWidth
            size="lg"
            disabled={submitting}
            onClick={step === 7 ? finishSetup : handleNext}
            className={`font-bold text-[15px] shadow-xl shadow-blush-500/20 transition-all ${submitting ? 'opacity-80 cursor-wait scale-[0.98]' : 'hover:scale-[1.02]'}`}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : step === 7 ? (
              'Complete Setup'
            ) : (
              'Next Step'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
