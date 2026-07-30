import { useMemo, useState } from 'react';
import { HiOutlineReceiptTax, HiOutlineDownload, HiOutlineDeviceMobile, HiOutlineCreditCard, HiOutlineCash, HiOutlineQrcode } from 'react-icons/hi';
import { Screen } from '@/components/layout/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { QRSheet } from '@/components/ui/QRSheet';
import { usePayments, useReceipts } from '@/hooks/usePayments';
import { downloadReceiptPdf } from '@/lib/receiptPdf';
import type { PaymentMethod, ReceiptDoc } from '@/schemas/payment.schema';

const methodIcon: Record<PaymentMethod, typeof HiOutlineDeviceMobile> = {
  upi: HiOutlineDeviceMobile,
  card: HiOutlineCreditCard,
  cash: HiOutlineCash,
};

export default function TransactionHistory() {
  const { data: payments = [], isLoading } = usePayments();
  const { data: receipts = [] } = useReceipts();
  const [search, setSearch] = useState('');
  const [qrReceipt, setQrReceipt] = useState<ReceiptDoc | null>(null);

  const receiptByPaymentId = useMemo(() => {
    const map = new Map<string, (typeof receipts)[number]>();
    receipts.forEach((r) => map.set(r.paymentId, r));
    return map;
  }, [receipts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter((p) => p.studentName.toLowerCase().includes(q) || p.transactionId.toLowerCase().includes(q));
  }, [payments, search]);

  const totalCollected = useMemo(() => payments.reduce((sum, p) => sum + p.amount, 0), [payments]);

  return (
    <Screen>
      <h1 className="font-display text-xl font-semibold mb-1">Transaction History</h1>
      <p className="text-xs text-blush-700/60 dark:text-blush-200/50 mb-4">
        {payments.length} transactions · ₹{totalCollected.toLocaleString('en-IN')} collected
      </p>

      <div className="mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search student or transaction ID" />
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-xl3" />
          <Skeleton className="h-16 w-full rounded-xl3" />
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <EmptyState icon={HiOutlineReceiptTax} title="No transactions yet" description="Payments you collect will show up here." />
      )}

      <div className="space-y-3">
        {filtered.map((p) => {
          const Icon = methodIcon[p.method];
          const receipt = receiptByPaymentId.get(p.id);
          return (
            <GlassCard key={p.id} padding="md" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl2 bg-blush-200/70 flex items-center justify-center shrink-0">
                <Icon size={18} className="text-blush-700" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm truncate">{p.studentName}</p>
                <p className="text-[11px] text-blush-700/50 truncate">{p.className} · {p.transactionId}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-sm font-semibold text-emerald-600">₹{p.amount.toLocaleString('en-IN')}</span>
                {receipt && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQrReceipt(receipt)}
                      className="flex items-center gap-1 text-[10px] font-semibold text-blush-600"
                    >
                      <HiOutlineQrcode size={12} /> QR
                    </button>
                    <button
                      onClick={() => downloadReceiptPdf(receipt)}
                      className="flex items-center gap-1 text-[10px] font-semibold text-blush-600"
                    >
                      <HiOutlineDownload size={12} /> Receipt
                    </button>
                  </div>
                )}
              </div>
            </GlassCard>
          );
        })}
      </div>

      <QRSheet
        open={!!qrReceipt}
        onClose={() => setQrReceipt(null)}
        title="Receipt QR"
        subtitle={qrReceipt ? `${qrReceipt.receiptNo} · ${qrReceipt.studentName}` : undefined}
        value={qrReceipt ? JSON.stringify({ type: 'receipt', id: qrReceipt.id }) : ''}
        hint="Scan this with Scan QR to reopen or verify this receipt."
      />
    </Screen>
  );
}
