import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineCreditCard, HiOutlineIdentification, HiOutlineArrowRight, HiOutlineUserCircle, HiOutlineBookOpen, HiOutlineSpeakerphone, HiOutlineClock } from 'react-icons/hi';
import { Screen } from '@/components/layout/Screen';
import { TopBar } from '@/components/layout/TopBar';
import { GlassCard } from '@/components/ui/GlassCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { useMyStudentRecord } from '@/hooks/useMyStudentRecord';
import { useAssignmentsForClasses } from '@/hooks/useAssignments';
import { useAnnouncementsForClasses } from '@/hooks/useAnnouncements';
import { formatTimeAgo } from '@/lib/timeAgo';

const statusStyles: Record<string, string> = {
  paid: 'bg-emerald-500/15 text-emerald-600',
  due: 'bg-amber-500/15 text-amber-600',
  overdue: 'bg-rose-500/15 text-rose-600',
};

export default function StudentHome() {
  const navigate = useNavigate();
  const { data: student, isLoading: loadingStudent } = useMyStudentRecord();

  const classNames = useMemo(() => student ? [student.className] : [], [student]);
  const { data: assignments = [], isLoading: loadingAssignments } = useAssignmentsForClasses(classNames);
  const { data: announcements = [], isLoading: loadingAnnouncements } = useAnnouncementsForClasses(classNames);

  const recentTimeline = useMemo(() => {
    const items = [
      ...assignments.map(a => ({ ...a, type: 'assignment' as const, date: a.createdAt })),
      ...announcements.map(a => ({ ...a, type: 'announcement' as const, date: a.createdAt }))
    ];
    return items.sort((a, b) => {
      const da = a.date && typeof a.date === 'object' && 'toMillis' in a.date ? (a.date as any).toMillis() : Date.now();
      const db = b.date && typeof b.date === 'object' && 'toMillis' in b.date ? (b.date as any).toMillis() : Date.now();
      return db - da;
    }).slice(0, 4);
  }, [assignments, announcements]);

  const isLoading = loadingStudent || loadingAssignments || loadingAnnouncements;

  if (isLoading) {
    return (
      <Screen>
        <TopBar subtitle="Personal Learning Hub" />
        <DashboardSkeleton />
      </Screen>
    );
  }

  if (!student) {
    return (
      <Screen>
        <TopBar subtitle="Personal Learning Hub" />
        <EmptyState
          icon={HiOutlineUserCircle}
          title="No student record linked"
          description="Ask the school admin to add your Google email as the student email on your record — your dashboard will populate automatically."
        />
      </Screen>
    );
  }

  const att = student.attendance || 100;

  return (
    <Screen>
      <TopBar subtitle="Personal Learning Hub" />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pb-6">
        
        {/* Student Profile & Progress Hero */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-3xl blur-xl" />
          <GlassCard padding="lg" glow className="relative z-10 !border-white/40">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 shrink-0">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-black/5 dark:text-white/10" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-blue-500" strokeDasharray={`${att}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <img src={student.avatar || `https://i.pravatar.cc/150?u=${student.id}`} alt={student.name} className="absolute inset-0 m-auto w-[52px] h-[52px] rounded-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display font-semibold text-xl truncate text-gray-900 dark:text-white">{student.name}</p>
                <p className="text-sm text-blush-700/60 dark:text-blush-200/60 truncate">{student.className} · Roll {student.rollNo}</p>
                <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-1 uppercase tracking-wider">{att}% Attendance</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Financial & ID Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <GlassCard padding="md" className="flex flex-col gap-2 relative overflow-hidden" onClick={() => navigate('/student/fees')}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-rose-200/20 rounded-full blur-xl -mr-6 -mt-6" />
            <div className="w-10 h-10 rounded-full bg-rose-200/60 flex items-center justify-center">
              <HiOutlineCreditCard size={20} className="text-rose-700 dark:text-rose-300" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-blush-700/60 mb-0.5">My Fees</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">₹{student.feeDue}</p>
              <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusStyles[student.feeStatus]}`}>
                {student.feeStatus}
              </span>
            </div>
          </GlassCard>

          <GlassCard padding="md" className="flex flex-col gap-2 relative overflow-hidden" onClick={() => navigate('/student/id')}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-200/20 rounded-full blur-xl -mr-6 -mt-6" />
            <div className="w-10 h-10 rounded-full bg-blue-200/60 flex items-center justify-center">
              <HiOutlineIdentification size={20} className="text-blue-700 dark:text-blue-300" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-blush-700/60 mb-0.5">Digital ID</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1 leading-snug">View Smart ID Card</p>
            </div>
          </GlassCard>
        </div>

        {/* Academic Feed */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold text-sm">Learning Feed</h2>
          {recentTimeline.length > 0 && <span className="text-[10px] uppercase font-bold text-blush-700/50 bg-blush-100/50 px-2 py-1 rounded-full">{recentTimeline.length} Updates</span>}
        </div>
        
        {recentTimeline.length > 0 ? (
          <div className="space-y-3 relative before:absolute before:inset-y-2 before:left-6 before:w-px before:bg-blush-200/50 dark:before:bg-white/10">
            {recentTimeline.map((item, idx) => (
              <GlassCard key={item.id} padding="sm" className="flex items-start gap-3 relative z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-[3px] border-[#FAFAF9] dark:border-[#0F0F13] ${item.type === 'assignment' ? 'bg-indigo-100' : 'bg-amber-100'}`}>
                  {item.type === 'assignment' ? (
                    <HiOutlineBookOpen size={14} className="text-indigo-600" />
                  ) : (
                    <HiOutlineSpeakerphone size={14} className="text-amber-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold truncate text-gray-900 dark:text-white">
                      {item.title}
                    </p>
                    <p className="text-[10px] text-blush-700/50 shrink-0 whitespace-nowrap flex items-center gap-1 mt-0.5">
                      <HiOutlineClock size={10} />
                      {item.date ? formatTimeAgo(item.date) : 'Just now'}
                    </p>
                  </div>
                  <p className="text-[11px] text-blush-700/60 truncate mt-0.5">
                    {item.type === 'assignment' && 'dueDate' in item ? `Due ${item.dueDate}` : (item as any).message}
                  </p>
                </div>
              </GlassCard>
            ))}
          </div>
        ) : (
          <EmptyState icon={HiOutlineBookOpen} title="All clear" description="No active assignments or announcements right now." />
        )}

      </motion.div>
    </Screen>
  );
}
