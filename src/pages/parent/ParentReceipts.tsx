import { useMemo, useState } from 'react';
import { HiOutlineReceiptTax, HiOutlineDownload, HiOutlineQrcode } from 'react-icons/hi';
import { Screen } from '@/components/layout/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { QRSheet } from '@/components/ui/QRSheet';
import { useMyChildren } from '@/hooks/useMyChildren';
import { useReceiptsForStudents } from '@/hooks/useFamilyPayments';
import { downloadReceiptPdf } from '@/lib/receiptPdf';
import type { ReceiptDoc } from '@/schemas/payment.schema';

export default function ParentReceipts() {
  const { data: children = [], isLoading: loadingChildren } = useMyChildren();
  const childIds = useMemo(() => children.map((c) => c.id), [children]);
  const { data: receipts = [], isLoading: loadingReceipts } = useReceiptsForStudents(childIds);
  const [qrReceipt, setQrReceipt] = useState<ReceiptDoc | null>(null);

  const isLoading = loadingChildren || loadingReceipts;

  return (
    <Screen>
      <h1 className="font-display text-xl font-semibold mb-4">Receipts</h1>

      {isLoading && <DashboardSkeleton />}

      {!isLoading && receipts.length === 0 && (
        <EmptyState icon={HiOutlineReceiptTax} title="No receipts yet" description="Receipts appear here after you make a payment." />
      )}

      <div className="space-y-3">
        {receipts.map((r) => (
          <GlassCard key={r.id} padding="md" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl2 bg-blush-200/70 flex items-center justify-center shrink-0">
              <HiOutlineReceiptTax size={18} className="text-blush-700" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm truncate">{r.studentName}</p>
              <p className="text-[11px] text-blush-700/50 truncate">{r.receiptNo} · {r.className}</p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-sm font-semibold text-emerald-600">₹{r.amount.toLocaleString('en-IN')}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setQrReceipt(r)} className="flex items-center gap-1 text-[10px] font-semibold text-blush-600">
                  <HiOutlineQrcode size={12} /> QR
                </button>
                <button onClick={() => downloadReceiptPdf(r)} className="flex items-center gap-1 text-[10px] font-semibold text-blush-600">
                  <HiOutlineDownload size={12} /> Download
                </button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <QRSheet
        open={!!qrReceipt}
        onClose={() => setQrReceipt(null)}
        title="Receipt QR"
        subtitle={qrReceipt ? `${qrReceipt.receiptNo} · ${qrReceipt.studentName}` : undefined}
        value={qrReceipt ? JSON.stringify({ type: 'receipt', id: qrReceipt.id }) : ''}
        hint="Show this at the accounts desk for instant verification."
      />
    </Screen>
  );
}
