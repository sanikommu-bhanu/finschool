import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { HiOutlineDeviceMobile, HiOutlineCreditCard, HiOutlineCash, HiOutlineCheckCircle, HiOutlineDownload, HiOutlineArrowLeft } from 'react-icons/hi';
import { Screen } from '@/components/layout/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { useMyChildren } from '@/hooks/useMyChildren';
import { useCollectFee } from '@/hooks/usePayments';
import { downloadReceiptPdf } from '@/lib/receiptPdf';
import type { StudentDoc } from '@/schemas/student.schema';
import type { PaymentMethod, ReceiptDoc } from '@/schemas/payment.schema';

const methods: { id: PaymentMethod; label: string; icon: typeof HiOutlineDeviceMobile }[] = [
  { id: 'upi', label: 'UPI', icon: HiOutlineDeviceMobile },
  { id: 'card', label: 'Card', icon: HiOutlineCreditCard },
  { id: 'cash', label: 'Pay at school', icon: HiOutlineCash },
];

export default function ParentFees() {
  const { data: children = [], isLoading } = useMyChildren();
  const collectFee = useCollectFee();

  const [selected, setSelected] = useState<StudentDoc | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('upi');
  const [processing, setProcessing] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState<ReceiptDoc | null>(null);

  const dueChildren = useMemo(() => children.filter((c) => c.feeDue > 0), [children]);

  const openPay = (c: StudentDoc) => {
    setSelected(c);
    setAmount(String(c.feeDue));
  };

  const reset = () => {
    setSelected(null);
    setSuccessReceipt(null);
  };

  const handlePay = () => {
    if (!selected) return;
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) return;
    setProcessing(true);
    setTimeout(() => {
      collectFee.mutate(
        { values: { studentId: selected.id, amount: numAmount, method }, student: selected },
        {
          onSuccess: ({ receipt }) => { setProcessing(false); setSuccessReceipt(receipt); },
          onError: () => setProcessing(false),
        }
      );
    }, 1100);
  };

  if (isLoading) {
    return (
      <Screen>
        <h1 className="font-display text-xl font-semibold mb-4">Fees</h1>
        <DashboardSkeleton />
      </Screen>
    );
  }

  if (successReceipt) {
    return (
      <Screen>
        <div className="flex flex-col items-center text-center pt-10">
          <div className="w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center mb-4">
            <HiOutlineCheckCircle size={40} className="text-emerald-600" />
          </div>
          <h1 className="font-display text-xl font-semibold mb-1">Payment Successful</h1>
          <p className="text-2xl font-display font-bold mb-6">₹{successReceipt.amount.toLocaleString('en-IN')}</p>
          <Button fullWidth size="lg" icon={<HiOutlineDownload size={18} />} onClick={() => downloadReceiptPdf(successReceipt)}>
            Download Receipt
          </Button>
          <Button fullWidth variant="glass" className="mt-3" onClick={reset}>Back to fees</Button>
        </div>
      </Screen>
    );
  }

  if (selected) {
    const numAmount = Number(amount);
    return (
      <Screen>
        <div className="flex items-center gap-2 mb-5">
          <button onClick={() => setSelected(null)} className="glass-pill w-9 h-9 flex items-center justify-center">
            <HiOutlineArrowLeft size={18} />
          </button>
          <h1 className="font-display text-lg font-semibold">Pay Fees — {selected.name}</h1>
        </div>

        <label className="text-xs font-semibold text-blush-800/70 dark:text-blush-100/60 mb-1.5 block">Amount (₹)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="glass-input w-full px-4 py-3.5 text-lg font-display font-semibold mb-5"
        />

        <label className="text-xs font-semibold text-blush-800/70 dark:text-blush-100/60 mb-1.5 block">Payment method</label>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {methods.map((m) => (
            <button
              key={m.id}
              onClick={() => setMethod(m.id)}
              className={clsx(
                'flex flex-col items-center gap-2 py-4 rounded-xl3 transition-colors',
                method === m.id ? 'bg-gradient-cta text-white' : 'glass text-blush-700/70 dark:text-blush-200/60'
              )}
            >
              <m.icon size={20} />
              <span className="text-xs font-semibold">{m.label}</span>
            </button>
          ))}
        </div>

        <Button fullWidth size="lg" disabled={processing || !numAmount} className={processing ? '!opacity-70 !cursor-wait' : ''} onClick={handlePay}>
          {processing ? 'Processing…' : `Pay ₹${numAmount || 0}`}
        </Button>
        <p className="text-[11px] text-blush-700/40 text-center mt-3">Simulated payment — no real money is charged.</p>
      </Screen>
    );
  }

  return (
    <Screen>
      <h1 className="font-display text-xl font-semibold mb-4">Fees</h1>
      {dueChildren.length === 0 ? (
        <EmptyState icon={HiOutlineCheckCircle} title="All fees paid" description="No pending dues for any of your children right now." />
      ) : (
        <div className="space-y-3">
          {dueChildren.map((c) => (
            <GlassCard key={c.id} padding="md" className="flex items-center gap-3" onClick={() => openPay(c)}>
              <img src={c.avatar || `https://i.pravatar.cc/150?u=${c.id}`} alt={c.name} className="w-11 h-11 rounded-full object-cover shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm truncate">{c.name}</p>
                <p className="text-xs text-blush-700/50 truncate">{c.className}</p>
              </div>
              <span className="text-sm font-semibold text-rose-600 shrink-0">₹{c.feeDue.toLocaleString('en-IN')}</span>
            </GlassCard>
          ))}
        </div>
      )}
    </Screen>
  );
}
