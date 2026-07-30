import type { PaymentDoc } from '@/schemas/payment.schema';
import type { StudentDoc } from '@/schemas/student.schema';

export interface ReportRow {
  label: string;
  count: number;
  amount: number;
}

export interface ReportResult {
  summary: { label: string; value: string }[];
  rows: ReportRow[];
  chartData: { name: string; value: number }[];
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function toDate(value: unknown): Date | null {
  if (!value || typeof value !== 'object' || !('toDate' in value)) return null;
  try {
    return (value as { toDate: () => Date }).toDate();
  } catch {
    return null;
  }
}

const money = (n: number) => `Rs. ${n.toLocaleString('en-IN')}`;

/** Every year that has at least one payment — feeds the year selector on the Reports page. */
export function listPaymentYears(payments: PaymentDoc[]): number[] {
  const years = new Set<number>();
  payments.forEach((p) => {
    const d = toDate(p.createdAt);
    if (d) years.add(d.getFullYear());
  });
  const current = new Date().getFullYear();
  years.add(current);
  return Array.from(years).sort((a, b) => b - a);
}

/** Day-by-day collection breakdown for one calendar month. */
export function buildMonthlyReport(payments: PaymentDoc[], year: number, month: number): ReportResult {
  const inMonth = payments.filter((p) => {
    const d = toDate(p.createdAt);
    return d && d.getFullYear() === year && d.getMonth() === month;
  });

  const byDay = new Map<number, ReportRow>();
  inMonth.forEach((p) => {
    const d = toDate(p.createdAt)!;
    const day = d.getDate();
    const existing = byDay.get(day) ?? { label: `${day} ${MONTH_NAMES[month].slice(0, 3)}`, count: 0, amount: 0 };
    existing.count += 1;
    existing.amount += p.amount;
    byDay.set(day, existing);
  });

  const rows = Array.from(byDay.entries()).sort((a, b) => a[0] - b[0]).map(([, row]) => row);
  const total = inMonth.reduce((sum, p) => sum + p.amount, 0);

  return {
    summary: [
      { label: 'Month', value: `${MONTH_NAMES[month]} ${year}` },
      { label: 'Total collected', value: money(total) },
      { label: 'Transactions', value: String(inMonth.length) },
      { label: 'Avg. per transaction', value: inMonth.length ? money(Math.round(total / inMonth.length)) : money(0) },
    ],
    rows,
    chartData: rows.map((r) => ({ name: r.label, value: r.amount })),
  };
}

/** Month-by-month collection breakdown for one calendar year. */
export function buildYearlyReport(payments: PaymentDoc[], year: number): ReportResult {
  const inYear = payments.filter((p) => toDate(p.createdAt)?.getFullYear() === year);

  const rows: ReportRow[] = MONTH_NAMES.map((name, i) => {
    const inMonth = inYear.filter((p) => toDate(p.createdAt)?.getMonth() === i);
    return { label: name.slice(0, 3), count: inMonth.length, amount: inMonth.reduce((sum, p) => sum + p.amount, 0) };
  });

  const total = inYear.reduce((sum, p) => sum + p.amount, 0);
  const bestMonth = rows.reduce((best, r) => (r.amount > best.amount ? r : best), rows[0]);

  return {
    summary: [
      { label: 'Year', value: String(year) },
      { label: 'Total collected', value: money(total) },
      { label: 'Transactions', value: String(inYear.length) },
      { label: 'Best month', value: bestMonth.amount > 0 ? bestMonth.label : '—' },
    ],
    rows,
    chartData: rows.map((r) => ({ name: r.label, value: r.amount })),
  };
}

/** Collected vs. outstanding dues, grouped by class. */
export function buildClassWiseReport(students: StudentDoc[], payments: PaymentDoc[]): ReportResult {
  const classNames = Array.from(new Set(students.map((s) => s.className)));

  const rows: ReportRow[] = classNames.map((className) => {
    const classPayments = payments.filter((p) => p.className === className);
    return {
      label: className,
      count: students.filter((s) => s.className === className).length,
      amount: classPayments.reduce((sum, p) => sum + p.amount, 0),
    };
  }).sort((a, b) => b.amount - a.amount);

  const totalDue = students.reduce((sum, s) => sum + s.feeDue, 0);
  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  return {
    summary: [
      { label: 'Classes', value: String(classNames.length) },
      { label: 'Total collected', value: money(totalCollected) },
      { label: 'Total outstanding', value: money(totalDue) },
      { label: 'Students', value: String(students.length) },
    ],
    rows,
    chartData: rows.slice(0, 8).map((r) => ({ name: r.label, value: r.amount })),
  };
}

/** Revenue split by payment method, plus top revenue-generating classes. */
export function buildRevenueReport(payments: PaymentDoc[]): ReportResult {
  const methods: PaymentDoc['method'][] = ['upi', 'card', 'cash'];
  const byMethod: ReportRow[] = methods.map((m) => {
    const forMethod = payments.filter((p) => p.method === m);
    return { label: m.toUpperCase(), count: forMethod.length, amount: forMethod.reduce((sum, p) => sum + p.amount, 0) };
  });

  const total = payments.reduce((sum, p) => sum + p.amount, 0);
  const avgTicket = payments.length ? Math.round(total / payments.length) : 0;

  return {
    summary: [
      { label: 'Total revenue', value: money(total) },
      { label: 'Transactions', value: String(payments.length) },
      { label: 'Avg. ticket size', value: money(avgTicket) },
      { label: 'Top method', value: byMethod.reduce((best, r) => (r.amount > best.amount ? r : best), byMethod[0])?.label ?? '—' },
    ],
    rows: byMethod,
    chartData: byMethod.map((r) => ({ name: r.label, value: r.amount })),
  };
}
