import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineArrowRight, HiOutlineAcademicCap, HiOutlineClock, HiOutlineSpeakerphone, HiOutlineCreditCard } from 'react-icons/hi';
import { Screen } from '@/components/layout/Screen';
import { TopBar } from '@/components/layout/TopBar';
import { GlassCard } from '@/components/ui/GlassCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { useMyChildren } from '@/hooks/useMyChildren';
import { useAnnouncementsForClasses } from '@/hooks/useAnnouncements';
import { formatTimeAgo } from '@/lib/timeAgo';

const statusStyles: Record<string, string> = {
  paid: 'bg-emerald-500/15 text-emerald-600',
  due: 'bg-amber-500/15 text-amber-600',
  overdue: 'bg-rose-500/15 text-rose-600',
};

export default function ParentHome() {
  const navigate = useNavigate();
  const { data: children = [], isLoading: loadingChildren } = useMyChildren();
  
  const classNames = useMemo(() => Array.from(new Set(children.map(c => c.className))), [children]);
  const { data: announcements = [], isLoading: loadingAnnouncements } = useAnnouncementsForClasses(classNames);

  const totalDue = useMemo(() => children.reduce((sum, c) => sum + c.feeDue, 0), [children]);
  
  const recentAnnouncements = useMemo(() => {
    return announcements.sort((a, b) => {
      const da = a.createdAt && typeof a.createdAt === 'object' && 'toMillis' in a.createdAt ? (a.createdAt as any).toMillis() : Date.now();
      const db = b.createdAt && typeof b.createdAt === 'object' && 'toMillis' in b.createdAt ? (b.createdAt as any).toMillis() : Date.now();
      return db - da;
    }).slice(0, 3);
  }, [announcements]);

  if (loadingChildren || loadingAnnouncements) {
    return (
      <Screen>
        <TopBar subtitle="Child Progress Center" />
        <DashboardSkeleton />
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar subtitle="Child Progress Center" />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pb-6">
        
        {children.length === 0 ? (
          <EmptyState
            icon={HiOutlineAcademicCap}
            title="No children linked yet"
            description="Ask the school admin to add your Google email as the guardian email on your child's student record — it'll appear here automatically."
          />
        ) : (
          <>
            {/* Financial Alert Widget */}
            {totalDue > 0 && (
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-rose-400/20 to-amber-400/20 rounded-3xl blur-xl" />
                <GlassCard glow padding="lg" className="relative z-10 !bg-white/60 dark:!bg-black/40 !border-rose-200/50">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-rose-700/60 dark:text-rose-200/60 mb-1">Total Fee Due</p>
                      <p className="text-3xl font-display font-bold text-gray-900 dark:text-white">₹{totalDue.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-rose-200/60 flex items-center justify-center shrink-0">
                      <HiOutlineCreditCard size={20} className="text-rose-700 dark:text-rose-400" />
                    </div>
                  </div>
                  <Button fullWidth onClick={() => navigate('/parent/fees')} className="!bg-rose-600 hover:!bg-rose-700 border-none shadow-lg shadow-rose-500/30">
                    Pay Now Securely
                  </Button>
                </GlassCard>
              </div>
            )}

            {/* Child Progress Cards */}
            <h2 className="font-display font-semibold text-sm mb-3">Academic Progress</h2>
            <div className="space-y-3 mb-6">
              {children.map((c) => {
                const att = c.attendance || 100;
                return (
                  <GlassCard key={c.id} padding="md" className="flex items-center gap-4 relative overflow-hidden" onClick={() => navigate('/parent/fees')}>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none" />
                    
                    {/* Radial Progress Avatar */}
                    <div className="relative w-14 h-14 shrink-0">
                      <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path className="text-black/5 dark:text-white/10" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className="text-blue-500" strokeDasharray={`${att}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      </svg>
                      <img src={c.avatar || `https://i.pravatar.cc/150?u=${c.id}`} alt={c.name} className="absolute inset-0 m-auto w-11 h-11 rounded-full object-cover" />
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate text-gray-900 dark:text-white">{c.name}</p>
                      <p className="text-[11px] text-blush-700/60 truncate mt-0.5">{c.className} · Roll {c.rollNo}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">{att}% Attendance</span>
                        {c.feeDue > 0 && <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">· ₹{c.feeDue} Due</span>}
                      </div>
                    </div>
                    
                    <HiOutlineArrowRight size={18} className="text-blush-400 shrink-0" />
                  </GlassCard>
                );
              })}
            </div>

            {/* School Communications Timeline */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-semibold text-sm">School Feed</h2>
              {recentAnnouncements.length > 0 && <span className="text-[10px] uppercase font-bold text-blush-700/50 bg-blush-100/50 px-2 py-1 rounded-full">{recentAnnouncements.length} New</span>}
            </div>
            
            {recentAnnouncements.length > 0 ? (
              <div className="space-y-3 relative before:absolute before:inset-y-2 before:left-6 before:w-px before:bg-blush-200/50 dark:before:bg-white/10">
                {recentAnnouncements.map((item) => (
                  <GlassCard key={item.id} padding="sm" className="flex items-start gap-3 relative z-10">
                    <div className="w-8 h-8 rounded-full bg-amber-100 border-[3px] border-[#FAFAF9] dark:border-[#0F0F13] flex items-center justify-center shrink-0">
                      <HiOutlineSpeakerphone size={14} className="text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold truncate text-gray-900 dark:text-white">{item.title}</p>
                        <p className="text-[10px] text-blush-700/50 shrink-0 flex items-center gap-1 mt-0.5">
                          <HiOutlineClock size={10} />
                          {item.createdAt ? formatTimeAgo(item.createdAt) : 'Just now'}
                        </p>
                      </div>
                      <p className="text-[11px] text-blush-700/60 truncate mt-0.5">{item.className} · {(item as any).message}</p>
                    </div>
                  </GlassCard>
                ))}
              </div>
            ) : (
              <EmptyState icon={HiOutlineAcademicCap} title="All caught up" description="No recent announcements from your children's classes." />
            )}
          </>
        )}
      </motion.div>
    </Screen>
  );
}
