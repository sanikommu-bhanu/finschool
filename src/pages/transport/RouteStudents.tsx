import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineUserGroup, HiOutlineCheck, HiOutlinePlus } from 'react-icons/hi';
import { Screen } from '@/components/layout/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useTransportRoutes, useAssignStudentToRoute, useUnassignStudentFromRoute } from '@/hooks/useTransportRoutes';
import { useStudents } from '@/hooks/useStudents';

export default function RouteStudents() {
  const { routeId } = useParams<{ routeId: string }>();
  const navigate = useNavigate();
  const { data: routes = [], isLoading: routesLoading } = useTransportRoutes();
  const { data: students = [], isLoading: studentsLoading } = useStudents();
  const assignMutation = useAssignStudentToRoute();
  const unassignMutation = useUnassignStudentFromRoute();
  const [search, setSearch] = useState('');

  const route = routes.find((r) => r.id === routeId);
  const assignedIds = new Set(route?.studentIds ?? []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => s.name.toLowerCase().includes(q) || s.className.toLowerCase().includes(q));
  }, [students, search]);

  const isLoading = routesLoading || studentsLoading;

  return (
    <Screen>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="glass-pill w-10 h-10 flex items-center justify-center shrink-0" aria-label="Back">
          <HiOutlineArrowLeft size={18} />
        </button>
        <div className="min-w-0">
          <h1 className="font-display text-lg font-semibold truncate">{route?.name || 'Route students'}</h1>
          <p className="text-xs text-blush-700/50">{assignedIds.size} of {students.length} students assigned</p>
        </div>
      </div>

      <div className="mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search students by name or class" />
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-xl3" />
          <Skeleton className="h-16 w-full rounded-xl3" />
        </div>
      )}

      {!isLoading && !route && (
        <EmptyState icon={HiOutlineUserGroup} title="Route not found" description="This route may have been deleted." />
      )}

      {!isLoading && route && filtered.length === 0 && (
        <EmptyState icon={HiOutlineUserGroup} title="No students found" description="Try a different search, or add students in Admin first." />
      )}

      {!isLoading && route && (
        <div className="space-y-2.5">
          {filtered.map((s) => {
            const assigned = assignedIds.has(s.id);
            return (
              <GlassCard key={s.id} padding="sm" className="flex items-center gap-3">
                <img src={s.avatar || `https://i.pravatar.cc/150?u=${s.id}`} alt={s.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{s.name}</p>
                  <p className="text-xs text-blush-700/50 truncate">{s.className} · Roll {s.rollNo}</p>
                </div>
                <button
                  onClick={() =>
                    assigned
                      ? unassignMutation.mutate({ routeId: route.id, studentId: s.id })
                      : assignMutation.mutate({ routeId: route.id, studentId: s.id })
                  }
                  disabled={assignMutation.isPending || unassignMutation.isPending}
                  className={
                    assigned
                      ? 'w-9 h-9 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0'
                      : 'w-9 h-9 rounded-full glass-pill flex items-center justify-center shrink-0 text-blush-600'
                  }
                  aria-label={assigned ? 'Remove from route' : 'Add to route'}
                >
                  {assigned ? <HiOutlineCheck size={16} /> : <HiOutlinePlus size={16} />}
                </button>
              </GlassCard>
            );
          })}
        </div>
      )}
    </Screen>
  );
}
