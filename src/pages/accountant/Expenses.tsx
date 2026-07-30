import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlinePlus,
  HiOutlineReceiptTax,
  HiOutlineChevronRight,
} from 'react-icons/hi';
import { Screen } from '@/components/layout/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Fab } from '@/components/ui/Fab';
import { DonutChart } from '@/components/charts/DonutChart';
import { useAddExpense, useExpenses } from '@/hooks/useExpenses';
import { useAuthStore } from '@/store/authStore';
import {
  EXPENSE_CATEGORY_COLOR,
  EXPENSE_CATEGORY_LABEL,
  expenseFormSchema,
  type ExpenseCategory,
} from '@/schemas/expense.schema';

function isThisMonth(value: unknown): boolean {
  if (!value || typeof value !== 'object' || !('toDate' in value)) return false;
  const d = (value as { toDate: () => Date }).toDate();
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

const categories: ExpenseCategory[] = ['salary', 'transport', 'utilities', 'maintenance', 'others'];

export default function Expenses() {
  const navigate = useNavigate();
  const { data: expenses = [], isLoading } = useExpenses();
  const addExpense = useAddExpense();
  const user = useAuthStore((s) => s.user);

  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('salary');
  const [amount, setAmount] = useState('');
  const [paidTo, setPaidTo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const monthExpenses = useMemo(() => expenses.filter((e) => isThisMonth(e.createdAt)), [expenses]);
  const monthTotal = useMemo(() => monthExpenses.reduce((sum, e) => sum + e.amount, 0), [monthExpenses]);

  const breakdown = useMemo(() => {
    const totals: Record<ExpenseCategory, number> = { salary: 0, transport: 0, utilities: 0, maintenance: 0, others: 0 };
    monthExpenses.forEach((e) => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });
    return categories
      .map((c) => ({ name: EXPENSE_CATEGORY_LABEL[c], value: totals[c], color: EXPENSE_CATEGORY_COLOR[c], pct: monthTotal > 0 ? Math.round((totals[c] / monthTotal) * 100) : 0 }))
      .filter((d) => d.value > 0);
  }, [monthExpenses, monthTotal]);

  const resetForm = () => {
    setTitle('');
    setCategory('salary');
    setAmount('');
    setPaidTo('');
  };

  const handleAdd = () => {
    const parsed = expenseFormSchema.safeParse({ title, category, amount, paidTo });
    if (!parsed.success) return;
    setSubmitting(true);
    addExpense.mutate(
      { values: parsed.data, createdBy: user?.email },
      {
        onSuccess: () => {
          setSubmitting(false);
          setAddOpen(false);
          resetForm();
        },
        onError: () => setSubmitting(false),
      }
    );
  };

  const numAmount = Number(amount);
  const canSubmit = title.trim().length > 1 && numAmount > 0;

  return (
    <Screen>
      <h1 className="font-display text-xl font-semibold mb-4">Expenses</h1>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-xl3" />
          <Skeleton className="h-16 w-full rounded-xl3" />
          <Skeleton className="h-16 w-full rounded-xl3" />
        </div>
      ) : (
        <>
          <GlassCard className="flex items-center gap-4 mb-4">
            <DonutChart
              data={breakdown.length ? breakdown : [{ name: 'None', value: 1, color: 'rgba(180,150,160,0.25)' }]}
              size={104}
              centerLabel={
                <>
                  <span className="text-[9px] text-blush-700/50 dark:text-blush-200/40">This Month</span>
                  <span className="text-sm font-display font-bold">₹{monthTotal.toLocaleString('en-IN')}</span>
                </>
              }
            />
            <div className="flex-1 min-w-0 space-y-1.5">
              {breakdown.length === 0 && (
                <p className="text-xs text-blush-700/50">No expenses logged this month yet.</p>
              )}
              {breakdown.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="flex-1 truncate text-blush-800/80 dark:text-blush-100/70">{d.name}</span>
                  <span className="font-semibold shrink-0">{d.pct}%</span>
                </div>
              ))}
            </div>
          </GlassCard>

          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-base font-semibold">All expenses</h2>
            <span className="text-xs text-blush-700/50">{expenses.length} total</span>
          </div>

          {expenses.length === 0 ? (
            <EmptyState
              icon={HiOutlineReceiptTax}
              title="No expenses yet"
              description="Log school expenses like salaries, transport fuel, and utilities to track spending."
            />
          ) : (
            <div className="space-y-3">
              {expenses.map((e) => (
                <GlassCard
                  key={e.id}
                  padding="md"
                  className="flex items-center gap-3"
                  onClick={() => navigate(`/accountant/expenses/${e.id}`)}
                >
                  <div
                    className="w-10 h-10 rounded-xl2 flex items-center justify-center shrink-0 text-white text-[11px] font-bold"
                    style={{ backgroundColor: EXPENSE_CATEGORY_COLOR[e.category] }}
                  >
                    {EXPENSE_CATEGORY_LABEL[e.category].slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{e.title}</p>
                    <p className="text-[11px] text-blush-700/50 truncate">{EXPENSE_CATEGORY_LABEL[e.category]}</p>
                  </div>
                  <span className="text-sm font-semibold text-rose-600 shrink-0">₹{e.amount.toLocaleString('en-IN')}</span>
                  <HiOutlineChevronRight className="text-blush-700/30 shrink-0" size={16} />
                </GlassCard>
              ))}
            </div>
          )}
        </>
      )}

      <Fab icon={HiOutlinePlus} label="Add expense" onClick={() => setAddOpen(true)} />

      <BottomSheet open={addOpen} onClose={() => setAddOpen(false)} title="Add Expense">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-blush-800/70 dark:text-blush-100/60 mb-1.5 block">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. School bus fuel"
              className="glass-input w-full px-4 py-3 text-sm"
            />
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
              placeholder="0"
              className="glass-input w-full px-4 py-3.5 text-lg font-display font-semibold"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-blush-800/70 dark:text-blush-100/60 mb-1.5 block">Paid to (optional)</label>
            <input
              value={paidTo}
              onChange={(e) => setPaidTo(e.target.value)}
              placeholder="e.g. Vendor / staff name"
              className="glass-input w-full px-4 py-3 text-sm"
            />
          </div>

          <Button fullWidth size="lg" disabled={!canSubmit || submitting} className={submitting ? '!opacity-70' : ''} onClick={handleAdd}>
            {submitting ? 'Adding…' : 'Add Expense'}
          </Button>
        </div>
      </BottomSheet>
    </Screen>
  );
}
