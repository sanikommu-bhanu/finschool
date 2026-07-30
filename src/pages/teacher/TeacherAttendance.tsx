import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { HiOutlineArrowLeft, HiOutlineCheckCircle, HiOutlineClipboardCheck } from 'react-icons/hi';
import { Screen } from '@/components/layout/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { useNavigate } from 'react-router-dom';
import { useMyTeacherRecord } from '@/hooks/useMyTeacherRecord';
import { useMyClassStudents } from '@/hooks/useMyClassStudents';
import { useSubmitAttendance } from '@/hooks/useAttendance';
import type { AttendanceStatus } from '@/schemas/attendance.schema';

const statusMeta: Record<AttendanceStatus, { label: string; active: string }> = {
  present: { label: 'Present', active: 'bg-emerald-500 text-white' },
  absent: { label: 'Absent', active: 'bg-rose-500 text-white' },
  leave: { label: 'Leave', active: 'bg-amber-500 text-white' },
};

export default function TeacherAttendance() {
  const navigate = useNavigate();
  const { data: teacher, myClasses } = useMyTeacherRecord();
  const [activeClass, setActiveClass] = useState(myClasses[0] ?? '');
  const { data: students = [], isLoading } = useMyClassStudents(activeClass ? [activeClass] : []);
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [saved, setSaved] = useState(false);
  const submit = useSubmitAttendance();

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const setAll = (status: AttendanceStatus) => {
    const next: Record<string, AttendanceStatus> = {};
    students.forEach((s) => (next[s.id] = status));
    setStatuses(next);
  };

  const handleSubmit = () => {
    if (!teacher || !activeClass) return;
    const records: Record<string, AttendanceStatus> = { ...statuses };
    students.forEach((s) => {
      if (!records[s.id]) records[s.id] = 'present';
    });
    submit.mutate(
      { className: activeClass, date: today, teacherName: teacher.name, records },
      { onSuccess: () => setSaved(true) }
    );
  };

  if (saved) {
    return (
      <Screen>
        <div className="flex flex-col items-center text-center pt-14">
          <div className="w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center mb-4">
            <HiOutlineCheckCircle size={40} className="text-emerald-600" />
          </div>
          <h1 className="font-display text-xl font-semibold mb-1">Attendance Saved</h1>
          <p className="text-sm text-blush-700/60 mb-6">{activeClass} · {today}</p>
          <Button fullWidth size="lg" onClick={() => navigate(-1)}>Done</Button>
          <Button
            fullWidth
            variant="glass"
            className="mt-3"
            onClick={() => {
              setSaved(false);
              setStatuses({});
            }}
          >
            Take another class
          </Button>
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => navigate(-1)} className="glass-pill w-9 h-9 flex items-center justify-center">
          <HiOutlineArrowLeft size={18} />
        </button>
        <h1 className="font-display text-lg font-semibold">Take Attendance</h1>
      </div>

      {myClasses.length > 1 && (
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {myClasses.map((c) => (
            <button
              key={c}
              onClick={() => {
                setActiveClass(c);
                setStatuses({});
              }}
              className={clsx(
                'px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap shrink-0',
                activeClass === c ? 'bg-gradient-cta text-white' : 'glass text-blush-700/70 dark:text-blush-200/60'
              )}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-blush-700/50">{today}</p>
        <div className="flex gap-2">
          <button onClick={() => setAll('present')} className="text-xs font-semibold text-emerald-600">Mark all present</button>
        </div>
      </div>

      {isLoading && <DashboardSkeleton />}

      {!isLoading && students.length === 0 && (
        <EmptyState icon={HiOutlineClipboardCheck} title="No students in this class" description="Add students under this class from the Admin panel first." />
      )}

      <div className="space-y-2.5 mb-6">
        {students.map((s) => {
          const current = statuses[s.id] ?? 'present';
          return (
            <GlassCard key={s.id} padding="sm" className="flex items-center gap-3">
              <img src={s.avatar || `https://i.pravatar.cc/150?u=${s.id}`} alt={s.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{s.name}</p>
                <p className="text-xs text-blush-700/50 truncate">Roll {s.rollNo}</p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                {(Object.keys(statusMeta) as AttendanceStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatuses((prev) => ({ ...prev, [s.id]: status }))}
                    className={clsx(
                      'w-8 h-8 rounded-full text-[10px] font-bold flex items-center justify-center transition-colors',
                      current === status ? statusMeta[status].active : 'glass text-blush-700/50'
                    )}
                    title={statusMeta[status].label}
                  >
                    {statusMeta[status].label[0]}
                  </button>
                ))}
              </div>
            </GlassCard>
          );
        })}
      </div>

      {students.length > 0 && (
        <Button fullWidth size="lg" disabled={submit.isPending} onClick={handleSubmit}>
          {submit.isPending ? 'Saving…' : `Save Attendance (${students.length})`}
        </Button>
      )}
    </Screen>
  );
}
