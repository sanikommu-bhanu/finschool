import { useMemo, useState } from 'react';
import clsx from 'clsx';
import {
  HiOutlineDeviceMobile,
  HiOutlineCreditCard,
  HiOutlineCash,
  HiOutlineCheckCircle,
  HiOutlineDownload,
  HiOutlineArrowLeft,
} from 'react-icons/hi';
import { Screen } from '@/components/layout/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { SearchBar } from '@/components/ui/SearchBar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useStudents } from '@/hooks/useStudents';
import { useCollectFee } from '@/hooks/usePayments';
import { downloadReceiptPdf } from '@/lib/receiptPdf';
import type { StudentDoc } from '@/schemas/student.schema';
import type { PaymentMethod, ReceiptDoc } from '@/schemas/payment.schema';

const methods: { id: PaymentMethod; label: string; icon: typeof HiOutlineDeviceMobile }[] = [
  { id: 'upi', label: 'UPI', icon: HiOutlineDeviceMobile },
  { id: 'card', label: 'Card', icon: HiOutlineCreditCard },
  { id: 'cash', label: 'Cash', icon: HiOutlineCash },
];

export default function CollectFee() {
  const { data: students = [], isLoading } = useStudents();
  const collectFee = useCollectFee();

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<StudentDoc | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('upi');
  const [processing, setProcessing] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState<ReceiptDoc | null>(null);

  const dueStudents = useMemo(() => students.filter((s) => s.feeDue > 0), [students]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return dueStudents;
    return dueStudents.filter((s) => s.name.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q));
  }, [dueStudents, search]);

  const selectStudent = (s: StudentDoc) => {
    setSelected(s);
    setAmount(String(s.feeDue));
  };

  const reset = () => {
    setSelected(null);
    setAmount('');
    setMethod('upi');
    setSuccessReceipt(null);
  };

  const handleCollect = () => {
    if (!selected) return;
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) return;

    setProcessing(true);
    // Simulated gateway latency — this is a payment simulator, not a live gateway.
    setTimeout(() => {
      collectFee.mutate(
        { values: { studentId: selected.id, amount: numAmount, method }, student: selected },
        {
          onSuccess: ({ receipt }) => {
            setProcessing(false);
            setSuccessReceipt(receipt);
          },
          onError: () => setProcessing(false),
        }
      );
    }, 1100);
  };

  if (successReceipt) {
    return (
      <Screen>
        <div className="flex flex-col items-center text-center pt-10">
          <div className="w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center mb-4">
            <HiOutlineCheckCircle size={40} className="text-emerald-600" />
          </div>
          <h1 className="font-display text-xl font-semibold mb-1">Payment Successful</h1>
          <p className="text-2xl font-display font-bold mb-1">₹{successReceipt.amount.toLocaleString('en-IN')}</p>
          <p className="text-xs text-blush-700/60 dark:text-blush-200/50 mb-6">
            Paid on {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>

          <GlassCard className="w-full text-left space-y-2 mb-6">
            <Row label="Receipt No." value={successReceipt.receiptNo} />
            <Row label="Student" value={successReceipt.studentName} />
            <Row label="Class" value={successReceipt.className} />
            <Row label="Method" value={successReceipt.method.toUpperCase()} />
            <Row label="Transaction ID" value={successReceipt.transactionId} />
          </GlassCard>

          <Button fullWidth size="lg" icon={<HiOutlineDownload size={18} />} onClick={() => downloadReceiptPdf(successReceipt)}>
            Download Receipt
          </Button>
          <Button fullWidth variant="glass" className="mt-3" onClick={reset}>
            Collect another payment
          </Button>
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
          <h1 className="font-display text-lg font-semibold">Collect Fee</h1>
        </div>

        <GlassCard className="flex items-center gap-3 mb-5">
          <img src={selected.avatar || `https://i.pravatar.cc/150?u=${selected.id}`} alt={selected.name} className="w-12 h-12 rounded-full object-cover" />
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{selected.name}</p>
            <p className="text-xs text-blush-700/50 truncate">{selected.className} · Roll {selected.rollNo}</p>
          </div>
          <span className="ml-auto text-xs font-semibold text-rose-600 shrink-0">₹{selected.feeDue.toLocaleString('en-IN')} due</span>
        </GlassCard>

        <label className="text-xs font-semibold text-blush-800/70 dark:text-blush-100/60 mb-1.5 block">Amount to collect (₹)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="glass-input w-full px-4 py-3.5 text-lg font-display font-semibold mb-5"
          placeholder="0"
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

        <Button
          fullWidth
          size="lg"
          disabled={processing || !numAmount || numAmount <= 0}
          className={processing ? '!opacity-70 !cursor-wait' : ''}
          onClick={handleCollect}
        >
          {processing ? 'Processing payment…' : `Collect ₹${numAmount || 0}`}
        </Button>
      </Screen>
    );
  }

  return (
    <Screen>
      <h1 className="font-display text-xl font-semibold mb-4">Collect Fee</h1>
      <div className="mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search student by name or roll no." />
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-xl3" />
          <Skeleton className="h-16 w-full rounded-xl3" />
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <EmptyState icon={HiOutlineCash} title="No pending dues" description="Every student in this search has a clear fee balance." />
      )}

      <div className="space-y-3">
        {filtered.map((s) => (
          <GlassCard key={s.id} padding="md" className="flex items-center gap-3" onClick={() => selectStudent(s)}>
            <img src={s.avatar || `https://i.pravatar.cc/150?u=${s.id}`} alt={s.name} className="w-11 h-11 rounded-full object-cover shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm truncate">{s.name}</p>
              <p className="text-xs text-blush-700/50 truncate">{s.className} · Roll {s.rollNo}</p>
            </div>
            <span className="text-sm font-semibold text-rose-600 shrink-0">₹{s.feeDue.toLocaleString('en-IN')}</span>
          </GlassCard>
        ))}
      </div>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-blush-700/60 dark:text-blush-200/50">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
