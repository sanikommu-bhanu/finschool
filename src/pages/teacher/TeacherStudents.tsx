import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineUserGroup, HiOutlinePhone, HiOutlineMail } from 'react-icons/hi';
import { Screen } from '@/components/layout/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useMyTeacherRecord } from '@/hooks/useMyTeacherRecord';
import { useMyClassStudents } from '@/hooks/useMyClassStudents';
import type { StudentDoc } from '@/schemas/student.schema';

const statusStyles: Record<string, string> = {
  paid: 'bg-emerald-500/15 text-emerald-600',
  due: 'bg-amber-500/15 text-amber-600',
  overdue: 'bg-rose-500/15 text-rose-600',
};

export default function TeacherStudents() {
  const navigate = useNavigate();
  const { myClasses } = useMyTeacherRecord();
  const { data: students = [], isLoading } = useMyClassStudents(myClasses);
  const [search, setSearch] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeStudent, setActiveStudent] = useState<StudentDoc | null>(null);

  // Arrived here from Scan QR (?focus=studentId) — jump straight to that student's detail sheet.
  useEffect(() => {
    const focusId = searchParams.get('focus');
    if (!focusId || students.length === 0) return;
    const match = students.find((s) => s.id === focusId);
    if (match) setActiveStudent(match);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('focus');
      return next;
    }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => s.name.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q) || s.className.toLowerCase().includes(q));
  }, [students, search]);

  return (
    <Screen>
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => navigate(-1)} className="glass-pill w-9 h-9 flex items-center justify-center">
          <HiOutlineArrowLeft size={18} />
        </button>
        <h1 className="font-display text-lg font-semibold">My Students</h1>
      </div>

      <div className="mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name, roll no. or class" />
      </div>

      {isLoading && <DashboardSkeleton />}

      {!isLoading && filtered.length === 0 && (
        <EmptyState icon={HiOutlineUserGroup} title="No students found" description="Try a different search, or ask admin to assign students to your classes." />
      )}

      <div className="space-y-2.5">
        {filtered.map((s) => (
          <GlassCard key={s.id} padding="md" className="flex items-center gap-3" onClick={() => setActiveStudent(s)}>
            <img src={s.avatar || `https://i.pravatar.cc/150?u=${s.id}`} alt={s.name} className="w-11 h-11 rounded-full object-cover shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm truncate">{s.name}</p>
              <p className="text-xs text-blush-700/50 truncate">{s.className} · Roll {s.rollNo} · {s.attendance}% attendance</p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${statusStyles[s.feeStatus]}`}>
              {s.feeStatus.toUpperCase()}
            </span>
          </GlassCard>
        ))}
      </div>

      <BottomSheet open={!!activeStudent} onClose={() => setActiveStudent(null)} title={activeStudent?.name}>
        {activeStudent && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={activeStudent.avatar || `https://i.pravatar.cc/150?u=${activeStudent.id}`}
                alt={activeStudent.name}
                className="w-14 h-14 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold text-sm">{activeStudent.className} · Roll {activeStudent.rollNo}</p>
                <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusStyles[activeStudent.feeStatus]}`}>
                  {activeStudent.feeStatus} · ₹{activeStudent.feeDue.toLocaleString('en-IN')} due
                </span>
              </div>
            </div>

            <GlassCard padding="sm" className="space-y-2">
              <p className="text-xs font-semibold text-blush-700/60 dark:text-blush-200/50">Guardian</p>
              <p className="text-sm font-medium">{activeStudent.guardian}</p>
              <div className="flex items-center gap-2 text-xs text-blush-700/70 dark:text-blush-200/50">
                <HiOutlinePhone size={14} /> {activeStudent.guardianPhone}
              </div>
              {activeStudent.guardianEmail && (
                <div className="flex items-center gap-2 text-xs text-blush-700/70 dark:text-blush-200/50">
                  <HiOutlineMail size={14} /> {activeStudent.guardianEmail}
                </div>
              )}
            </GlassCard>

            <p className="text-xs text-blush-700/50">
              Attendance: {activeStudent.attendance}%. To edit this student's record, ask a school admin.
            </p>
          </div>
        )}
      </BottomSheet>
    </Screen>
  );
}
