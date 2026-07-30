import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineCash, HiOutlineCheckCircle } from 'react-icons/hi';
import { Screen } from '@/components/layout/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { useMyTeacherRecord } from '@/hooks/useMyTeacherRecord';
import { useMyClassStudents } from '@/hooks/useMyClassStudents';
import { useSendFeeReminder } from '@/hooks/useFeeReminders';

export default function TeacherFeeReminders() {
  const navigate = useNavigate();
  const { myClasses } = useMyTeacherRecord();
  const { data: students = [], isLoading } = useMyClassStudents(myClasses);
  const sendReminder = useSendFeeReminder();
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const dueStudents = useMemo(() => students.filter((s) => s.feeDue > 0), [students]);

  const remindAll = async () => {
    for (const s of dueStudents) {
      if (sentIds.has(s.id)) continue;
      await sendReminder.mutateAsync({ student: s });
      setSentIds((prev) => new Set(prev).add(s.id));
    }
  };

  return (
    <Screen>
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => navigate(-1)} className="glass-pill w-9 h-9 flex items-center justify-center">
          <HiOutlineArrowLeft size={18} />
        </button>
        <h1 className="font-display text-lg font-semibold">Fee Reminders</h1>
      </div>

      {isLoading && <DashboardSkeleton />}

      {!isLoading && dueStudents.length === 0 && (
        <EmptyState icon={HiOutlineCheckCircle} title="All caught up" description="No students in your classes currently have fees due." />
      )}

      {dueStudents.length > 0 && (
        <Button fullWidth size="lg" className="mb-4" disabled={sendReminder.isPending} onClick={remindAll}>
          {sendReminder.isPending ? 'Sending…' : `Remind All (${dueStudents.length})`}
        </Button>
      )}

      <div className="space-y-2.5">
        {dueStudents.map((s) => {
          const sent = sentIds.has(s.id);
          return (
            <GlassCard key={s.id} padding="md" className="flex items-center gap-3">
              <img src={s.avatar || `https://i.pravatar.cc/150?u=${s.id}`} alt={s.name} className="w-11 h-11 rounded-full object-cover shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm truncate">{s.name}</p>
                <p className="text-xs text-blush-700/50 truncate">{s.className} · Roll {s.rollNo}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-rose-600 mb-1">₹{s.feeDue.toLocaleString('en-IN')}</p>
                <button
                  disabled={sent || sendReminder.isPending}
                  onClick={() => sendReminder.mutate({ student: s }, { onSuccess: () => setSentIds((prev) => new Set(prev).add(s.id)) })}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    sent ? 'bg-emerald-500/15 text-emerald-600' : 'bg-blush-200/70 text-blush-700'
                  }`}
                >
                  {sent ? 'Sent' : 'Remind'}
                </button>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </Screen>
  );
}
