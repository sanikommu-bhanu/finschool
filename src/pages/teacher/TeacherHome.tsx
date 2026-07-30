import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineClipboardCheck,
  HiOutlineUserGroup,
  HiOutlineBookOpen,
  HiOutlineSpeakerphone,
  HiOutlineCash,
  HiOutlineKey,
  HiOutlineChevronRight,
  HiOutlineClock,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle
} from 'react-icons/hi';
import { Screen } from '@/components/layout/Screen';
import { TopBar } from '@/components/layout/TopBar';
import { GlassCard } from '@/components/ui/GlassCard';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useMyTeacherRecord } from '@/hooks/useMyTeacherRecord';
import { useMyClassStudents } from '@/hooks/useMyClassStudents';
import { useAssignmentsForClasses } from '@/hooks/useAssignments';
import { useAnnouncementsForClasses } from '@/hooks/useAnnouncements';
import { formatTimeAgo } from '@/lib/timeAgo';

export default function TeacherHome() {
  const navigate = useNavigate();
  const { data: teacher, isLoading, myClasses } = useMyTeacherRecord();
  const { data: students = [] } = useMyClassStudents(myClasses);
  const { data: assignments = [] } = useAssignmentsForClasses(myClasses);
  const { data: announcements = [] } = useAnnouncementsForClasses(myClasses);

  const dueCount = useMemo(() => students.filter((s) => s.feeDue > 0).length, [students]);
  
  const classHealth = useMemo(() => {
    if (students.length === 0) return 100;
    const avg = students.reduce((acc, s) => acc + (s.attendance || 100), 0) / students.length;
    return Math.round(avg);
  }, [students]);

  const recentTimeline = useMemo(() => {
    const items = [
      ...assignments.map(a => ({ ...a, type: 'assignment' as const, date: a.createdAt })),
      ...announcements.map(a => ({ ...a, type: 'announcement' as const, date: a.createdAt }))
    ];
    // Sort descending by date
    return items.sort((a, b) => {
      const da = a.date && typeof a.date === 'object' && 'toMillis' in a.date ? (a.date as any).toMillis() : Date.now();
      const db = b.date && typeof b.date === 'object' && 'toMillis' in b.date ? (b.date as any).toMillis() : Date.now();
      return db - da;
    }).slice(0, 4);
  }, [assignments, announcements]);

  if (isLoading) {
    return (
      <Screen>
        <TopBar subtitle="Classroom Command Center" />
        <DashboardSkeleton />
      </Screen>
    );
  }

  if (!teacher) {
    return (
      <Screen>
        <TopBar subtitle="Classroom Command Center" />
        <EmptyState
          icon={HiOutlineUserGroup}
          title="No teacher record linked"
          description="Ask the school admin to add a teacher record with your Google sign-in email."
        />
      </Screen>
    );
  }

  const quickActions = [
    { label: 'Attendance', icon: HiOutlineClipboardCheck, path: 'attendance', bg: 'bg-emerald-200/60', text: 'text-emerald-700 dark:text-emerald-300' },
    { label: 'Assignments', icon: HiOutlineBookOpen, path: 'assignments', bg: 'bg-indigo-200/60', text: 'text-indigo-700 dark:text-indigo-300' },
    { label: 'Announce', icon: HiOutlineSpeakerphone, path: 'announcements', bg: 'bg-amber-200/60', text: 'text-amber-700 dark:text-amber-300' },
    { label: 'Join Codes', icon: HiOutlineKey, path: 'join-codes', bg: 'bg-sky-200/60', text: 'text-sky-700 dark:text-sky-300' },
  ];

  return (
    <Screen>
      <TopBar subtitle={`${teacher.subject} Educator`} />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pb-6">
        
        {/* Class Health Hero */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-3xl blur-xl" />
          <GlassCard padding="lg" glow className="relative z-10 flex items-center justify-between overflow-hidden !border-white/40">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-300/20 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex-1">
              <p className="text-[10px] uppercase font-bold tracking-widest text-blue-700/60 dark:text-blue-200/60 mb-1">Class Health</p>
              <div className="flex items-end gap-2">
                <h1 className="text-4xl font-display font-bold text-gray-900 dark:text-white">{classHealth}%</h1>
                <span className="text-xs font-semibold text-blue-700/60 dark:text-blue-200/50 mb-1.5">Avg Attendance</span>
              </div>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-2">
                {myClasses.join(', ') || 'No active classes'}
              </p>
            </div>
            
            <div className="shrink-0 flex flex-col items-center justify-center relative w-20 h-20">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="text-black/5 dark:text-white/10" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-blue-500" strokeDasharray={`${classHealth}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <HiOutlineCheckCircle size={20} className="text-blue-500" />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Actionable Alerts */}
        {dueCount > 0 && (
          <GlassCard padding="md" className="mb-6 flex gap-3 items-center !bg-rose-50/40 dark:!bg-rose-950/20 border-rose-200/50" onClick={() => navigate('fee-reminders')}>
            <div className="w-10 h-10 shrink-0 rounded-full bg-rose-200/60 flex items-center justify-center">
              <HiOutlineCash size={20} className="text-rose-700 dark:text-rose-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-rose-900 dark:text-rose-100">{dueCount} students have fees due</p>
              <p className="text-[10px] uppercase font-bold text-rose-700/60 dark:text-rose-300/60">Tap to send reminders</p>
            </div>
            <HiOutlineChevronRight size={18} className="text-rose-400 shrink-0" />
          </GlassCard>
        )}

        {/* Vital Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <GlassCard padding="sm" className="flex items-center gap-3 py-4" onClick={() => navigate('students')}>
            <div className="w-10 h-10 rounded-full bg-lavender-200/60 flex items-center justify-center">
              <HiOutlineUserGroup size={20} className="text-lavender-700 dark:text-lavender-300" />
            </div>
            <div>
              <p className="text-xl font-bold">{students.length}</p>
              <p className="text-[10px] uppercase font-semibold text-blush-700/60">My Students</p>
            </div>
          </GlassCard>
          <GlassCard padding="sm" className="flex items-center gap-3 py-4" onClick={() => navigate('assignments')}>
            <div className="w-10 h-10 rounded-full bg-indigo-200/60 flex items-center justify-center">
              <HiOutlineBookOpen size={20} className="text-indigo-700 dark:text-indigo-300" />
            </div>
            <div>
              <p className="text-xl font-bold">{assignments.length}</p>
              <p className="text-[10px] uppercase font-semibold text-blush-700/60">Assignments</p>
            </div>
          </GlassCard>
        </div>

        {/* Quick Operations */}
        <h2 className="font-display font-semibold text-sm mb-3">Operations</h2>
        <div className="grid grid-cols-4 gap-2 mb-6">
          {quickActions.map((a) => (
            <GlassCard key={a.label} padding="sm" className="flex flex-col items-center gap-2 text-center py-3" onClick={() => navigate(a.path)}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-glass ${a.bg}`}>
                <a.icon className={a.text} size={20} />
              </div>
              <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{a.label}</span>
            </GlassCard>
          ))}
        </div>

        {/* Rich Timeline */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold text-sm">Classroom Feed</h2>
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
                    {item.className}
                    {item.type === 'assignment' && 'dueDate' in item && ` · Due ${item.dueDate}`}
                  </p>
                </div>
              </GlassCard>
            ))}
          </div>
        ) : (
          <EmptyState icon={HiOutlineClipboardCheck} title="All clear" description="You have no recent assignments or announcements." />
        )}
      </motion.div>
    </Screen>
  );
}
