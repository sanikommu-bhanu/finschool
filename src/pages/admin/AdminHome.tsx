import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineCreditCard,
  HiOutlineUserGroup,
  HiOutlineAcademicCap,
  HiOutlineExclamationCircle,
  HiOutlineArrowRight,
  HiOutlineUsers,
  HiOutlineDocumentReport,
  HiOutlineSparkles,
  HiOutlineQrcode,
  HiOutlineReceiptTax,
  HiOutlineClock
} from 'react-icons/hi';
import { Screen } from '@/components/layout/Screen';
import { TopBar } from '@/components/layout/TopBar';
import { GlassCard } from '@/components/ui/GlassCard';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { TrendChart } from '@/components/charts/TrendChart';
import { usePayments } from '@/hooks/usePayments';
import { useStudents } from '@/hooks/useStudents';
import { useTeachers } from '@/hooks/useTeachers';
import { useParents } from '@/hooks/useParents';
import { buildYearlyReport } from '@/services/reports.service';
import { formatTimeAgo } from '@/lib/timeAgo';

function isThisMonth(value: unknown): boolean {
  if (!value || typeof value !== 'object' || !('toDate' in value)) return false;
  const d = (value as { toDate: () => Date }).toDate();
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function isLastMonth(value: unknown): boolean {
  if (!value || typeof value !== 'object' || !('toDate' in value)) return false;
  const d = (value as { toDate: () => Date }).toDate();
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
}

export default function AdminHome() {
  const navigate = useNavigate();
  const { data: payments = [], isLoading: loadingPayments } = usePayments();
  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const { data: teachers = [], isLoading: loadingTeachers } = useTeachers();
  const { data: parents = [] } = useParents();

  const [checkingSetup, setCheckingSetup] = useState(true);

  useEffect(() => {
    import('@/services/academicStructure.service').then(({ getSchoolProfile }) => {
      getSchoolProfile().then((profile) => {
        if (!profile || !profile.name) {
          navigate('/admin/setup', { replace: true });
        } else {
          setCheckingSetup(false);
        }
      });
    });
  }, [navigate]);

  const isLoading = loadingPayments || loadingStudents || loadingTeachers || checkingSetup;

  const totalCollected = useMemo(() => payments.reduce((sum, p) => sum + p.amount, 0), [payments]);
  const thisMonthTotal = useMemo(
    () => payments.filter((p) => isThisMonth(p.createdAt)).reduce((sum, p) => sum + p.amount, 0),
    [payments],
  );
  const lastMonthTotal = useMemo(
    () => payments.filter((p) => isLastMonth(p.createdAt)).reduce((sum, p) => sum + p.amount, 0),
    [payments],
  );
  const momDelta = useMemo(() => {
    if (lastMonthTotal <= 0) return null;
    return ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
  }, [thisMonthTotal, lastMonthTotal]);

  const pendingDues = useMemo(() => students.reduce((sum, s) => sum + (s.feeDue || 0), 0), [students]);
  const studentsWithDues = useMemo(() => students.filter((s) => s.feeDue > 0).length, [students]);

  const chart = useMemo(() => buildYearlyReport(payments, new Date().getFullYear()), [payments]);
  const recentPayments = useMemo(() => payments.slice(0, 3), [payments]);

  // Dynamic AI Insight based on real-time data
  const aiInsight = useMemo(() => {
    if (studentsWithDues > students.length * 0.3) {
      return `Warning: ${studentsWithDues} students have pending dues, totaling ₹${pendingDues.toLocaleString('en-IN')}. Consider sending automated fee reminders to stabilize cash flow.`;
    }
    if (momDelta !== null && momDelta < -10) {
      return `Revenue is down ${Math.abs(momDelta).toFixed(1)}% compared to last month. Consider reviewing pending payments.`;
    }
    if (momDelta !== null && momDelta > 10) {
      return `Excellent! Revenue is up ${momDelta.toFixed(1)}% this month. The fee collection engine is performing optimally.`;
    }
    return `System running smoothly. You have ${students.length} students actively managed by ${teachers.length} teachers.`;
  }, [studentsWithDues, students.length, pendingDues, momDelta, teachers.length]);

  const quickActions = [
    { label: 'Reports', icon: HiOutlineDocumentReport, path: '/admin/reports', bg: 'bg-emerald-200/60', text: 'text-emerald-700 dark:text-emerald-300' },
    { label: 'Scan QR', icon: HiOutlineQrcode, path: '/admin/scan', bg: 'bg-sky-200/60', text: 'text-sky-700 dark:text-sky-300' },
    { label: 'AI Assistant', icon: HiOutlineSparkles, path: '/admin/ai-assistant', bg: 'bg-lavender-200/70', text: 'text-lavender-700 dark:text-lavender-300' },
  ];

  return (
    <Screen>
      <TopBar subtitle="Executive Analytics Center" />

      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pb-6">
          
          {/* Main KPI Hero */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blush-400/20 to-lavender-400/20 rounded-3xl blur-xl" />
            <GlassCard padding="lg" glow className="relative z-10 overflow-hidden !border-white/40">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blush-300/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
              <p className="text-xs font-semibold text-blush-800/60 dark:text-blush-100/50 uppercase tracking-wider mb-1">Total Collection (YTD)</p>
              <div className="flex items-end gap-3 mt-1">
                <p className="text-4xl font-display font-bold text-gray-900 dark:text-white tracking-tight">
                  ₹{totalCollected.toLocaleString('en-IN')}
                </p>
                {momDelta !== null && (
                  <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full mb-1 ${momDelta >= 0 ? 'bg-emerald-500/15 text-emerald-600' : 'bg-rose-500/15 text-rose-600'}`}>
                    {momDelta >= 0 ? '+' : ''}{momDelta.toFixed(1)}% MoM
                  </div>
                )}
              </div>
              
              <div className="mt-6 pt-6 border-t border-blush-200/20 dark:border-white/10 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-blush-700/50 dark:text-blush-200/40 mb-1">Pending Dues</p>
                  <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">₹{pendingDues.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-blush-700/50 dark:text-blush-200/40 mb-1">Students Due</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{studentsWithDues} students</p>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* AI Insights Widget */}
          <GlassCard padding="md" className="mb-6 flex gap-4 items-start relative overflow-hidden" onClick={() => navigate('/admin/ai-assistant')}>
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5 pointer-events-none" />
            <div className="w-10 h-10 shrink-0 rounded-2xl bg-gradient-to-tr from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center relative z-10">
              <HiOutlineSparkles size={20} className="text-fuchsia-600 dark:text-fuchsia-400" />
            </div>
            <div className="relative z-10 min-w-0">
              <p className="text-[10px] uppercase font-bold tracking-widest text-fuchsia-600/70 dark:text-fuchsia-400/70 mb-1">AI Recommendation</p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-relaxed">
                {aiInsight}
              </p>
            </div>
          </GlassCard>

          {/* User Demographics */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <GlassCard padding="sm" className="flex flex-col items-center justify-center py-4 text-center" onClick={() => navigate('/admin/students')}>
              <HiOutlineUserGroup size={24} className="text-blush-600 mb-2 opacity-80" />
              <p className="text-xl font-bold text-gray-900 dark:text-white">{students.length}</p>
              <p className="text-[10px] uppercase font-semibold text-blush-700/60 mt-1">Students</p>
            </GlassCard>
            <GlassCard padding="sm" className="flex flex-col items-center justify-center py-4 text-center" onClick={() => navigate('/admin/teachers')}>
              <HiOutlineAcademicCap size={24} className="text-lavender-600 mb-2 opacity-80" />
              <p className="text-xl font-bold text-gray-900 dark:text-white">{teachers.length}</p>
              <p className="text-[10px] uppercase font-semibold text-blush-700/60 mt-1">Teachers</p>
            </GlassCard>
            <GlassCard padding="sm" className="flex flex-col items-center justify-center py-4 text-center" onClick={() => navigate('/admin/parents')}>
              <HiOutlineUsers size={24} className="text-peach-600 mb-2 opacity-80" />
              <p className="text-xl font-bold text-gray-900 dark:text-white">{parents.length}</p>
              <p className="text-[10px] uppercase font-semibold text-blush-700/60 mt-1">Parents</p>
            </GlassCard>
          </div>

          {/* Revenue Chart */}
          <GlassCard className="mb-6" padding="md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-sm">Revenue Timeline</h2>
              <span className="text-[10px] uppercase font-bold text-blush-700/50 bg-blush-100/50 px-2 py-1 rounded-full">{new Date().getFullYear()}</span>
            </div>
            {chart.chartData.some((c) => c.value > 0) ? (
              <div className="mx-[-10px]"><TrendChart data={chart.chartData} xKey="name" yKey="value" height={160} color="#8b5cf6" /></div>
            ) : (
              <div className="h-[140px] flex items-center justify-center">
                <p className="text-xs text-blush-700/50 font-medium">Waiting for transaction data...</p>
              </div>
            )}
          </GlassCard>

          {/* Recent Activity Feed */}
          {recentPayments.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-semibold text-sm">Live Transactions</h2>
                <button onClick={() => navigate('/admin/reports')} className="text-xs font-semibold text-blush-600 flex items-center gap-1">
                  View all <HiOutlineArrowRight />
                </button>
              </div>
              <div className="space-y-3">
                {recentPayments.map((p) => (
                  <GlassCard key={p.id} padding="sm" className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                      <HiOutlineReceiptTax size={18} className="text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{p.studentName}</p>
                      <p className="text-[10px] text-blush-700/60 truncate flex items-center gap-1">
                        <HiOutlineCreditCard size={12} /> {p.method.toUpperCase()}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-emerald-600">₹{p.amount.toLocaleString()}</p>
                      <p className="text-[10px] text-blush-700/50 flex items-center justify-end gap-1">
                        <HiOutlineClock size={10} />
                        {p.createdAt ? formatTimeAgo(p.createdAt) : 'Just now'}
                      </p>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions Footer */}
          <div>
            <h2 className="font-display font-semibold text-sm mb-3">Operations</h2>
            <div className="grid grid-cols-3 gap-3">
              {quickActions.map((a) => (
                <GlassCard key={a.label} padding="sm" className="flex flex-col items-center gap-2 text-center py-4" onClick={() => navigate(a.path)}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-glass ${a.bg}`}>
                    <a.icon className={a.text} size={22} />
                  </div>
                  <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">{a.label}</span>
                </GlassCard>
              ))}
            </div>
          </div>

        </motion.div>
      )}
    </Screen>
  );
}
