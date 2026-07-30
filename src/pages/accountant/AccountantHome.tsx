import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  HiOutlineCreditCard, 
  HiOutlineReceiptTax, 
  HiOutlineTrendingUp, 
  HiOutlineArrowRight, 
  HiOutlineQrcode, 
  HiOutlineDocumentReport, 
  HiOutlineSparkles,
  HiOutlineClock
} from 'react-icons/hi';
import { Screen } from '@/components/layout/Screen';
import { TopBar } from '@/components/layout/TopBar';
import { GlassCard } from '@/components/ui/GlassCard';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { usePayments } from '@/hooks/usePayments';
import { useStudents } from '@/hooks/useStudents';
import { formatTimeAgo } from '@/lib/timeAgo';

function isToday(value: unknown): boolean {
  if (!value || typeof value !== 'object' || !('toDate' in value)) return false;
  const d = (value as { toDate: () => Date }).toDate();
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

export default function AccountantHome() {
  const navigate = useNavigate();
  const { data: payments = [], isLoading: loadingPayments } = usePayments();
  const { data: students = [], isLoading: loadingStudents } = useStudents();

  const todayPayments = useMemo(() => payments.filter((p) => isToday(p.createdAt)), [payments]);
  const todayTotal = useMemo(() => todayPayments.reduce((sum, p) => sum + p.amount, 0), [todayPayments]);
  const totalCollected = useMemo(() => payments.reduce((sum, p) => sum + p.amount, 0), [payments]);
  const pendingCount = useMemo(() => students.filter((s) => s.feeDue > 0).length, [students]);

  // Payment Method Breakdown for today
  const methodStats = useMemo(() => {
    const stats = { cash: 0, card: 0, upi: 0 };
    todayPayments.forEach(p => {
      if (p.method === 'cash') stats.cash += p.amount;
      if (p.method === 'card') stats.card += p.amount;
      if (p.method === 'upi') stats.upi += p.amount;
    });
    return stats;
  }, [todayPayments]);

  const recentTransactions = useMemo(() => {
    return [...payments].sort((a, b) => {
      const da = a.createdAt && typeof a.createdAt === 'object' && 'toMillis' in a.createdAt ? (a.createdAt as any).toMillis() : Date.now();
      const db = b.createdAt && typeof b.createdAt === 'object' && 'toMillis' in b.createdAt ? (b.createdAt as any).toMillis() : Date.now();
      return db - da;
    }).slice(0, 5);
  }, [payments]);

  const isLoading = loadingPayments || loadingStudents;

  if (isLoading) {
    return (
      <Screen>
        <TopBar subtitle="Financial Operations Center" />
        <DashboardSkeleton />
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar subtitle="Financial Operations Center" />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pb-6">
        
        {/* Massive Daily KPI Hero */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 rounded-3xl blur-xl" />
          <GlassCard padding="lg" glow className="relative z-10 overflow-hidden !border-white/40">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-300/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
            <p className="text-xs font-semibold text-emerald-800/60 dark:text-emerald-100/50 uppercase tracking-wider mb-1">Collected Today</p>
            <div className="flex items-end gap-3 mt-1">
              <p className="text-4xl font-display font-bold text-gray-900 dark:text-white tracking-tight">
                ₹{todayTotal.toLocaleString('en-IN')}
              </p>
              <div className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full mb-1 bg-emerald-500/15 text-emerald-600">
                {todayPayments.length} txns
              </div>
            </div>
            
            {todayTotal > 0 && (
              <div className="mt-6 pt-6 border-t border-emerald-200/20 dark:border-white/10">
                <p className="text-[10px] uppercase font-bold text-emerald-700/50 dark:text-emerald-200/40 mb-2">Method Breakdown</p>
                <div className="flex h-2 rounded-full overflow-hidden mb-2 bg-black/5 dark:bg-white/5">
                  <div style={{ width: `${(methodStats.cash / todayTotal) * 100}%` }} className="bg-emerald-500" />
                  <div style={{ width: `${(methodStats.upi / todayTotal) * 100}%` }} className="bg-teal-500" />
                  <div style={{ width: `${(methodStats.card / todayTotal) * 100}%` }} className="bg-blue-500" />
                </div>
                <div className="flex justify-between text-[10px] font-semibold text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Cash ({Math.round((methodStats.cash/todayTotal)*100)}%)</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-teal-500" /> UPI ({Math.round((methodStats.upi/todayTotal)*100)}%)</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /> Card ({Math.round((methodStats.card/todayTotal)*100)}%)</span>
                </div>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Global Financial Context */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <GlassCard padding="sm" className="flex items-center gap-3 py-4">
            <div className="w-10 h-10 rounded-full bg-blue-200/60 flex items-center justify-center shrink-0">
              <HiOutlineTrendingUp size={20} className="text-blue-700 dark:text-blue-300" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold truncate">₹{totalCollected.toLocaleString('en-IN')}</p>
              <p className="text-[10px] uppercase font-semibold text-blush-700/60">Total Collected</p>
            </div>
          </GlassCard>
          <GlassCard padding="sm" className="flex items-center gap-3 py-4">
            <div className="w-10 h-10 rounded-full bg-rose-200/60 flex items-center justify-center shrink-0">
              <HiOutlineCreditCard size={20} className="text-rose-700 dark:text-rose-300" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold truncate">{pendingCount}</p>
              <p className="text-[10px] uppercase font-semibold text-blush-700/60">Pending Dues</p>
            </div>
          </GlassCard>
        </div>

        {/* Primary Action */}
        <GlassCard glow className="mb-6 flex items-center justify-between !bg-emerald-50/40 dark:!bg-emerald-950/20 border-emerald-200/50" onClick={() => navigate('/accountant/collect')}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-200/60 flex items-center justify-center shrink-0">
              <HiOutlineReceiptTax size={20} className="text-emerald-700 dark:text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold text-sm text-emerald-900 dark:text-emerald-100">Collect Payment</p>
              <p className="text-[10px] uppercase font-bold text-emerald-700/60 dark:text-emerald-300/60">Generate instant receipt</p>
            </div>
          </div>
          <HiOutlineArrowRight size={18} className="text-emerald-500" />
        </GlassCard>

        {/* Quick Operations */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <GlassCard padding="sm" className="flex flex-col items-center justify-center gap-2 py-4 text-center" onClick={() => navigate('/accountant/scan')}>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-sky-200/60">
              <HiOutlineQrcode className="text-sky-700 dark:text-sky-300" size={20} />
            </div>
            <p className="font-semibold text-[10px] uppercase">Scan QR</p>
          </GlassCard>
          <GlassCard padding="sm" className="flex flex-col items-center justify-center gap-2 py-4 text-center" onClick={() => navigate('/accountant/reports')}>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-amber-200/60">
              <HiOutlineDocumentReport className="text-amber-700 dark:text-amber-300" size={20} />
            </div>
            <p className="font-semibold text-[10px] uppercase">Reports</p>
          </GlassCard>
          <GlassCard padding="sm" className="flex flex-col items-center justify-center gap-2 py-4 text-center" onClick={() => navigate('/accountant/ai-assistant')}>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-lavender-200/70">
              <HiOutlineSparkles className="text-lavender-700 dark:text-lavender-300" size={20} />
            </div>
            <p className="font-semibold text-[10px] uppercase">AI Audit</p>
          </GlassCard>
        </div>

        {/* Live Ledger Feed */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-sm font-semibold">Live Ledger</h2>
          <button onClick={() => navigate('/accountant/history')} className="text-[10px] uppercase font-bold text-blush-600 flex items-center gap-1">
            View all <HiOutlineArrowRight />
          </button>
        </div>

        {recentTransactions.length > 0 ? (
          <div className="space-y-3">
            {recentTransactions.map((p) => (
              <GlassCard key={p.id} padding="sm" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <HiOutlineCreditCard size={18} className="text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate text-gray-900 dark:text-white">{p.studentName}</p>
                  <p className="text-[10px] font-medium text-blush-700/60 truncate flex items-center gap-1">
                    {p.className} · {p.method.toUpperCase()}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-emerald-600">₹{p.amount.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-blush-700/50 flex items-center justify-end gap-1">
                    <HiOutlineClock size={10} />
                    {p.createdAt ? formatTimeAgo(p.createdAt) : 'Just now'}
                  </p>
                </div>
              </GlassCard>
            ))}
          </div>
        ) : (
          <EmptyState icon={HiOutlineReceiptTax} title="Ledger empty" description="No payments collected yet." />
        )}

      </motion.div>
    </Screen>
  );
}
