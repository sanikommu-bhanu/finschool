import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineChevronLeft, HiOutlineSearch, HiOutlineChatAlt2 } from 'react-icons/hi';
import { Screen } from '@/components/layout/Screen';
import { SearchBar } from '@/components/ui/SearchBar';
import { GlassCard } from '@/components/ui/GlassCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useStudents } from '@/hooks/useStudents';
import { useTeachers } from '@/hooks/useTeachers';
import { useParents } from '@/hooks/useParents';
import { usePayments } from '@/hooks/usePayments';
import { useAuthStore } from '@/store/authStore';
import type { ThreadParticipant } from '@/schemas/message.schema';

export default function Search() {
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.role);
  const [q, setQ] = useState('');
  const { data: students = [], isLoading: studentsLoading, isError: studentsError } = useStudents();
  const { data: teachers = [], isLoading: teachersLoading, isError: teachersError } = useTeachers();
  const { data: parents = [], isLoading: parentsLoading, isError: parentsError } = useParents();
  const { data: payments = [], isLoading: paymentsLoading, isError: paymentsError } = usePayments();

  const isLoading = studentsLoading || teachersLoading || parentsLoading || paymentsLoading;
  const isError = studentsError || teachersError || parentsError || paymentsError;

  const results = useMemo(() => {
    if (!q) return { students: [], teachers: [], parents: [], payments: [] };
    const query = q.toLowerCase();
    return {
      students: students.filter((s) => s.name.toLowerCase().includes(query) || s.rollNo.toLowerCase().includes(query)),
      teachers: teachers.filter((t) => t.name.toLowerCase().includes(query) || t.subject.toLowerCase().includes(query)),
      parents: parents.filter((p) => p.name.toLowerCase().includes(query) || p.childrenNames.toLowerCase().includes(query)),
      payments: payments.filter(
        (p) => p.studentName.toLowerCase().includes(query) || p.transactionId.toLowerCase().includes(query)
      ),
    };
  }, [q, students, teachers, parents, payments]);

  const totalResults = results.students.length + results.teachers.length + results.parents.length + results.payments.length;

  const messagePerson = (person: ThreadParticipant, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/${role}/messages`, { state: { startThreadWith: person } });
  };

  return (
    <Screen withNav={false}>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => navigate(-1)} className="glass-pill w-9 h-9 flex items-center justify-center">
          <HiOutlineChevronLeft size={18} />
        </button>
        <div className="flex-1">
          <SearchBar value={q} onChange={setQ} placeholder="Search students, staff, transactions…" autoFocus />
        </div>
      </div>

      {!q && <EmptyState icon={HiOutlineSearch} title="Search anything" description="Find students, staff, parents, and transactions." />}
      {q && isLoading && (
        <div className="space-y-2.5">
          <Skeleton className="h-14 rounded-xl3" />
          <Skeleton className="h-14 rounded-xl3" />
        </div>
      )}
      {q && !isLoading && isError && (
        <EmptyState icon={HiOutlineSearch} title="Couldn't search right now" description="Check your connection and try again." />
      )}
      {q && !isLoading && !isError && totalResults === 0 && (
        <EmptyState icon={HiOutlineSearch} title="No results" description={`Nothing matched "${q}"`} />
      )}
      {q && !isLoading && !isError && totalResults > 0 && (
        <div className="space-y-2.5">
          {results.students.map((s) => (
            <GlassCard key={s.id} padding="sm" className="flex items-center gap-3">
              <img src={s.avatar || `https://i.pravatar.cc/150?u=${s.id}`} className="w-10 h-10 rounded-full object-cover" alt={s.name} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{s.name}</p>
                <p className="text-xs text-blush-700/50 truncate">Class {s.className} · Roll {s.rollNo}</p>
              </div>
              {s.studentEmail && (
                <button
                  onClick={(e) => messagePerson({ email: s.studentEmail!, name: s.name, avatar: s.avatar || '' }, e)}
                  className="glass-pill w-9 h-9 flex items-center justify-center shrink-0"
                  aria-label={`Message ${s.name}`}
                >
                  <HiOutlineChatAlt2 size={16} />
                </button>
              )}
            </GlassCard>
          ))}
          {results.teachers.map((t) => (
            <GlassCard key={t.id} padding="sm" className="flex items-center gap-3">
              <img src={t.avatar || `https://i.pravatar.cc/150?u=${t.id}`} className="w-10 h-10 rounded-full object-cover" alt={t.name} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{t.name}</p>
                <p className="text-xs text-blush-700/50 truncate">Teacher · {t.subject}</p>
              </div>
              <button
                onClick={(e) => messagePerson({ email: t.email, name: t.name, avatar: t.avatar || '' }, e)}
                className="glass-pill w-9 h-9 flex items-center justify-center shrink-0"
                aria-label={`Message ${t.name}`}
              >
                <HiOutlineChatAlt2 size={16} />
              </button>
            </GlassCard>
          ))}
          {results.parents.map((p) => (
            <GlassCard key={p.id} padding="sm" className="flex items-center gap-3">
              <img src={p.avatar || `https://i.pravatar.cc/150?u=${p.id}`} className="w-10 h-10 rounded-full object-cover" alt={p.name} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{p.name}</p>
                <p className="text-xs text-blush-700/50 truncate">Parent · {p.childrenNames}</p>
              </div>
              <button
                onClick={(e) => messagePerson({ email: p.email, name: p.name, avatar: p.avatar || '' }, e)}
                className="glass-pill w-9 h-9 flex items-center justify-center shrink-0"
                aria-label={`Message ${p.name}`}
              >
                <HiOutlineChatAlt2 size={16} />
              </button>
            </GlassCard>
          ))}
          {results.payments.map((p) => (
            <GlassCard key={p.id} padding="sm" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full glass flex items-center justify-center shrink-0 text-xs font-semibold">
                ₹
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{p.studentName} · ₹{p.amount.toLocaleString('en-IN')}</p>
                <p className="text-xs text-blush-700/50 truncate">{p.transactionId} · {p.status}</p>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </Screen>
  );
}
