import { useMemo } from 'react';
import { HiOutlineReceiptTax, HiOutlineDownload } from 'react-icons/hi';
import { Screen } from '@/components/layout/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { useMyStudentRecord } from '@/hooks/useMyStudentRecord';
import { useReceiptsForStudents } from '@/hooks/useFamilyPayments';
import { downloadReceiptPdf } from '@/lib/receiptPdf';

const statusStyles: Record<string, string> = {
  paid: 'bg-emerald-500/15 text-emerald-600',
  due: 'bg-amber-500/15 text-amber-600',
  overdue: 'bg-rose-500/15 text-rose-600',
};

export default function StudentFees() {
  const { data: student, isLoading: loadingStudent } = useMyStudentRecord();
  const studentIds = useMemo(() => (student ? [student.id] : []), [student]);
  const { data: receipts = [], isLoading: loadingReceipts } = useReceiptsForStudents(studentIds);

  if (loadingStudent) {
    return (
      <Screen>
        <h1 className="font-display text-xl font-semibold mb-4">My Fees</h1>
        <DashboardSkeleton />
      </Screen>
    );
  }

  if (!student) {
    return (
      <Screen>
        <h1 className="font-display text-xl font-semibold mb-4">My Fees</h1>
        <EmptyState icon={HiOutlineReceiptTax} title="No record linked" description="Ask the school admin to link your Google email to your student record." />
      </Screen>
    );
  }

  return (
    <Screen>
      <h1 className="font-display text-xl font-semibold mb-4">My Fees</h1>

      <GlassCard className="mb-5">
        <p className="text-xs text-blush-700/60 dark:text-blush-200/50 mb-1">Amount due</p>
        <p className="text-2xl font-display font-bold mb-2">₹{student.feeDue.toLocaleString('en-IN')}</p>
        <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusStyles[student.feeStatus]}`}>
          {student.feeStatus}
        </span>
        <p className="text-[11px] text-blush-700/40 mt-3">Fees are paid by your parent/guardian from their Parent dashboard.</p>
      </GlassCard>

      <h2 className="font-display text-base font-semibold mb-3">Payment history</h2>
      {loadingReceipts ? (
        <DashboardSkeleton />
      ) : receipts.length === 0 ? (
        <EmptyState icon={HiOutlineReceiptTax} title="No payments yet" description="Receipts will appear here once a payment is made." />
      ) : (
        <div className="space-y-3">
          {receipts.map((r) => (
            <GlassCard key={r.id} padding="md" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl2 bg-blush-200/70 flex items-center justify-center shrink-0">
                <HiOutlineReceiptTax size={18} className="text-blush-700" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm truncate">{r.receiptNo}</p>
                <p className="text-[11px] text-blush-700/50 truncate">{r.method.toUpperCase()}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-sm font-semibold text-emerald-600">₹{r.amount.toLocaleString('en-IN')}</span>
                <button onClick={() => downloadReceiptPdf(r)} className="flex items-center gap-1 text-[10px] font-semibold text-blush-600">
                  <HiOutlineDownload size={12} /> Download
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </Screen>
  );
}
