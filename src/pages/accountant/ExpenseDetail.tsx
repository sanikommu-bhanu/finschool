import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';
import { Screen } from '@/components/layout/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useDeleteExpense, useExpense, useUpdateExpense } from '@/hooks/useExpenses';
import {
  EXPENSE_CATEGORY_COLOR,
  EXPENSE_CATEGORY_LABEL,
  expenseFormSchema,
  type ExpenseCategory,
} from '@/schemas/expense.schema';

const categories: ExpenseCategory[] = ['salary', 'transport', 'utilities', 'maintenance', 'others'];

export default function ExpenseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: expense, isLoading } = useExpense(id);
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('salary');
  const [amount, setAmount] = useState('');
  const [paidTo, setPaidTo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (expense) {
      setTitle(expense.title);
      setCategory(expense.category);
      setAmount(String(expense.amount));
      setPaidTo(expense.paidTo || '');
    }
  }, [expense]);

  if (isLoading) {
    return (
      <Screen>
        <Skeleton className="h-9 w-9 rounded-full mb-5" />
        <Skeleton className="h-40 w-full rounded-xl3" />
      </Screen>
    );
  }

  if (!expense) {
    return (
      <Screen>
        <div className="flex items-center gap-2 mb-5">
          <button onClick={() => navigate(-1)} className="glass-pill w-9 h-9 flex items-center justify-center">
            <HiOutlineArrowLeft size={18} />
          </button>
          <h1 className="font-display text-lg font-semibold">Expense Detail</h1>
        </div>
        <p className="text-sm text-blush-700/60 text-center py-10">This expense could not be found.</p>
      </Screen>
    );
  }

  const numAmount = Number(amount);
  const canSubmit = title.trim().length > 1 && numAmount > 0;

  const handleSave = () => {
    const parsed = expenseFormSchema.safeParse({ title, category, amount, paidTo });
    if (!parsed.success || !id) return;
    setSubmitting(true);
    updateExpense.mutate(
      { id, values: parsed.data },
      {
        onSuccess: () => {
          setSubmitting(false);
          setEditOpen(false);
        },
        onError: () => setSubmitting(false),
      }
    );
  };

  const handleDelete = () => {
    if (!id) return;
    deleteExpense.mutate(id, {
      onSuccess: () => navigate('/accountant/expenses', { replace: true }),
    });
  };

  return (
    <Screen>
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => navigate(-1)} className="glass-pill w-9 h-9 flex items-center justify-center">
          <HiOutlineArrowLeft size={18} />
        </button>
        <h1 className="font-display text-lg font-semibold">Expense Detail</h1>
      </div>

      <GlassCard className="flex flex-col items-center text-center py-8 mb-5">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-white text-lg font-bold mb-3"
          style={{ backgroundColor: EXPENSE_CATEGORY_COLOR[expense.category] }}
        >
          {EXPENSE_CATEGORY_LABEL[expense.category].slice(0, 2)}
        </div>
        <p className="text-2xl font-display font-bold">₹{expense.amount.toLocaleString('en-IN')}</p>
        <p className="text-xs text-blush-700/50 mt-1">{EXPENSE_CATEGORY_LABEL[expense.category]}</p>
      </GlassCard>

      <GlassCard className="space-y-3 mb-5">
        <Row label="Title" value={expense.title} />
        <Row label="Category" value={EXPENSE_CATEGORY_LABEL[expense.category]} />
        {expense.paidTo && <Row label="Paid to" value={expense.paidTo} />}
        {expense.note && <Row label="Note" value={expense.note} />}
      </GlassCard>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="glass" fullWidth icon={<HiOutlinePencil size={16} />} onClick={() => setEditOpen(true)}>
          Edit
        </Button>
        <Button
          variant="outline"
          fullWidth
          icon={<HiOutlineTrash size={16} />}
          className="!border-rose-400 !text-rose-600"
          onClick={() => setConfirmDelete(true)}
        >
          Delete
        </Button>
      </div>

      <BottomSheet open={editOpen} onClose={() => setEditOpen(false)} title="Edit Expense">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-blush-800/70 dark:text-blush-100/60 mb-1.5 block">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="glass-input w-full px-4 py-3 text-sm" />
          </div>

          <div>
            <label className="text-xs font-semibold text-blush-800/70 dark:text-blush-100/60 mb-1.5 block">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={
                    category === c
                      ? 'py-2.5 rounded-xl2 text-xs font-semibold bg-gradient-cta text-white transition-transform active:scale-95'
                      : 'py-2.5 rounded-xl2 text-xs font-semibold glass text-blush-700/70 dark:text-blush-200/60 transition-transform active:scale-95'
                  }
                >
                  {EXPENSE_CATEGORY_LABEL[c]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-blush-800/70 dark:text-blush-100/60 mb-1.5 block">Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="glass-input w-full px-4 py-3.5 text-lg font-display font-semibold"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-blush-800/70 dark:text-blush-100/60 mb-1.5 block">Paid to</label>
            <input value={paidTo} onChange={(e) => setPaidTo(e.target.value)} className="glass-input w-full px-4 py-3 text-sm" />
          </div>

          <Button fullWidth size="lg" disabled={!canSubmit || submitting} className={submitting ? '!opacity-70' : ''} onClick={handleSave}>
            {submitting ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </BottomSheet>

      <BottomSheet open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete this expense?">
        <p className="text-sm text-blush-700/60 dark:text-blush-200/50 mb-5">
          This will permanently remove “{expense.title}” from your expense records. This can’t be undone.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="glass" fullWidth onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
          <Button fullWidth className="!bg-rose-600" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </BottomSheet>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm gap-3">
      <span className="text-blush-700/60 dark:text-blush-200/50 shrink-0">{label}</span>
      <span className="font-semibold text-right truncate">{value}</span>
    </div>
  );
}
