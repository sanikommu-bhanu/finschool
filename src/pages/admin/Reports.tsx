import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { HiOutlineDownload, HiOutlineDocumentText } from 'react-icons/hi';
import { Screen } from '@/components/layout/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { TrendChart } from '@/components/charts/TrendChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { usePayments } from '@/hooks/usePayments';
import { useStudents } from '@/hooks/useStudents';
import {
  buildMonthlyReport,
  buildYearlyReport,
  buildClassWiseReport,
  buildRevenueReport,
  listPaymentYears,
  type ReportResult,
} from '@/services/reports.service';
import { downloadCsv } from '@/lib/csv';
import { downloadReportPdf } from '@/lib/reportPdf';

type Mode = 'monthly' | 'yearly' | 'classwise' | 'revenue';

const TABS: { id: Mode; label: string }[] = [
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
  { id: 'classwise', label: 'Class-wise' },
  { id: 'revenue', label: 'Revenue-wise' },
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DONUT_COLORS = ['#EE7A90', '#F6B78C', '#B9A6E0', '#7FC8A9', '#88B8E0', '#E0A6C8'];

export default function Reports() {
  const { data: payments = [], isLoading: loadingPayments } = usePayments();
  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const isLoading = loadingPayments || loadingStudents;

  const [mode, setMode] = useState<Mode>('monthly');
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const years = useMemo(() => listPaymentYears(payments), [payments]);

  const report: ReportResult = useMemo(() => {
    switch (mode) {
      case 'monthly': return buildMonthlyReport(payments, year, month);
      case 'yearly': return buildYearlyReport(payments, year);
      case 'classwise': return buildClassWiseReport(students, payments);
      case 'revenue': return buildRevenueReport(payments);
    }
  }, [mode, payments, students, year, month]);

  const reportTitle = {
    monthly: `Monthly Report — ${MONTH_NAMES[month]} ${year}`,
    yearly: `Yearly Report — ${year}`,
    classwise: 'Class-wise Report',
    revenue: 'Revenue-wise Report',
  }[mode];

  const columnLabel = { monthly: 'Day', yearly: 'Month', classwise: 'Class', revenue: 'Method' }[mode];

  const handleExportCsv = () => {
    downloadCsv(
      reportTitle,
      [columnLabel, 'Transactions', 'Amount (₹)'],
      report.rows.map((r) => [r.label, r.count, r.amount])
    );
  };

  const handleExportPdf = () => {
    downloadReportPdf({
      title: reportTitle,
      subtitle: 'Fee Collection Report',
      summary: report.summary.map((s) => [s.label, s.value] as [string, string]),
      tableHeaders: [columnLabel, 'Transactions', 'Amount'],
      tableRows: report.rows.map((r) => [r.label, r.count, `Rs. ${r.amount.toLocaleString('en-IN')}`]),
      filename: reportTitle,
    });
  };

  const donutData = report.chartData.map((d, i) => ({ name: d.name, value: d.value, color: DONUT_COLORS[i % DONUT_COLORS.length] }));

  return (
    <Screen>
      <h1 className="font-display text-xl font-semibold mb-1">Reports</h1>
      <p className="text-xs text-blush-700/60 dark:text-blush-200/50 mb-4">
        Fee collection insights — export as PDF or CSV anytime.
      </p>

      <div className="flex gap-2 overflow-x-auto pb-1 mb-4 -mx-4 px-4 no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setMode(t.id)}
            className={clsx(
              'shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full transition-colors',
              mode === t.id ? 'bg-gradient-cta text-white' : 'glass-pill text-blush-700/70 dark:text-blush-200/60'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {(mode === 'monthly' || mode === 'yearly') && (
        <div className="flex gap-2 mb-4">
          {mode === 'monthly' && (
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="glass-input px-3 py-2 text-xs font-semibold flex-1 outline-none"
            >
              {MONTH_NAMES.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
          )}
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="glass-input px-3 py-2 text-xs font-semibold flex-1 outline-none"
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      )}

      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {report.summary.map((s) => (
              <GlassCard key={s.label} padding="md" className="min-w-0">
                <p className="text-lg font-display font-semibold truncate">{s.value}</p>
                <p className="text-xs text-blush-700/70 dark:text-blush-200/60 truncate mt-1">{s.label}</p>
              </GlassCard>
            ))}
          </div>

          <GlassCard padding="md" className="mb-4">
            {report.chartData.length === 0 ? (
              <EmptyState icon={HiOutlineDocumentText} title="No data for this period" description="Collect some payments, or pick a different period." />
            ) : mode === 'classwise' || mode === 'revenue' ? (
              <div className="flex items-center gap-4">
                <DonutChart data={donutData} size={120} />
                <div className="flex-1 space-y-1.5 min-w-0">
                  {donutData.map((d) => (
                    <div key={d.name} className="flex items-center gap-2 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                      <span className="truncate flex-1">{d.name}</span>
                      <span className="font-semibold shrink-0">₹{d.value.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <TrendChart data={report.chartData} xKey="name" yKey="value" height={160} />
            )}
          </GlassCard>

          <div className="space-y-2 mb-5">
            {report.rows.map((r) => (
              <GlassCard key={r.label} padding="sm" className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{r.label}</p>
                  <p className="text-[11px] text-blush-700/50">{r.count} transaction{r.count === 1 ? '' : 's'}</p>
                </div>
                <span className="text-sm font-semibold text-emerald-600">₹{r.amount.toLocaleString('en-IN')}</span>
              </GlassCard>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="glass" icon={<HiOutlineDocumentText size={16} />} onClick={handleExportCsv}>Export CSV</Button>
            <Button icon={<HiOutlineDownload size={16} />} onClick={handleExportPdf}>Export PDF</Button>
          </div>
        </>
      )}
    </Screen>
  );
}
