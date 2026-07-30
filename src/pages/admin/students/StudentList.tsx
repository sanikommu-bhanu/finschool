import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineUserGroup,
  HiOutlineQrcode,
  HiOutlineAcademicCap
} from 'react-icons/hi';
import { Screen } from '@/components/layout/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Fab } from '@/components/ui/Fab';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { StudentForm } from './StudentForm';
import { useStudents, useCreateStudent, useUpdateStudent, useDeleteStudent } from '@/hooks/useStudents';
import { useClassNameOptions } from '@/hooks/useAcademicStructure';
import { type StudentDoc, type StudentFormValues } from '@/schemas/student.schema';

const statusStyles: Record<StudentDoc['feeStatus'], string> = {
  paid: 'bg-emerald-500/15 text-emerald-600',
  due: 'bg-amber-500/15 text-amber-600',
  overdue: 'bg-rose-500/15 text-rose-600',
};

const containerVars = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVars = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function StudentList() {
  const { data: students = [], isLoading, isError } = useStudents();
  const { options: classOptions } = useClassNameOptions();
  const createMutation = useCreateStudent();
  const updateMutation = useUpdateStudent();
  const deleteMutation = useDeleteStudent();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [sheetMode, setSheetMode] = useState<'closed' | 'add' | 'edit' | 'detail'>('closed');
  const [activeStudent, setActiveStudent] = useState<StudentDoc | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const focusId = searchParams.get('focus');
    if (!focusId || students.length === 0) return;
    const match = students.find((s) => s.id === focusId);
    if (match) {
      setActiveStudent(match);
      setSheetMode('detail');
    }
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('focus');
      return next;
    }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students]);

  const availableClasses = useMemo(() => {
    const inUse = new Set(students.map((s) => s.className));
    return classOptions.filter((c) => inUse.has(c));
  }, [students, classOptions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      const matchesClass = classFilter === 'all' || s.className === classFilter;
      const matchesQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.rollNo.toLowerCase().includes(q) ||
        s.guardian.toLowerCase().includes(q);
      return matchesClass && matchesQuery;
    });
  }, [students, search, classFilter]);

  const openAdd = () => {
    setActiveStudent(null);
    setSheetMode('add');
  };

  const openDetail = (s: StudentDoc) => {
    setActiveStudent(s);
    setSheetMode('detail');
  };

  const openEdit = (s: StudentDoc) => {
    setActiveStudent(s);
    setSheetMode('edit');
  };

  const closeSheet = () => setSheetMode('closed');

  const handleCreate = (values: StudentFormValues) => {
    createMutation.mutate(values, { onSuccess: closeSheet });
  };

  const handleUpdate = (values: StudentFormValues) => {
    if (!activeStudent) return;
    updateMutation.mutate(
      { id: activeStudent.id, data: values },
      { onSuccess: closeSheet }
    );
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        setConfirmDeleteId(null);
        closeSheet();
      },
    });
  };

  return (
    <Screen>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Students</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-blush-700/60 dark:text-blush-200/50 bg-blush-500/10 px-2.5 py-1 rounded-full border border-blush-200/50 dark:border-white/5">
            {students.length} total
          </span>
          <button
            onClick={() => navigate('/admin/scan')}
            aria-label="Scan QR"
            className="w-8 h-8 rounded-full bg-white/60 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 border border-white/50 dark:border-white/10 flex items-center justify-center transition-all shadow-sm active:scale-95 text-blush-700 dark:text-blush-300"
          >
            <HiOutlineQrcode size={16} />
          </button>
        </div>
      </div>

      <div className="mb-4 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blush-700/40">
          <SearchBar value={search} onChange={setSearch} placeholder="Search students..." />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4 no-scrollbar items-center">
        <button
          onClick={() => setClassFilter('all')}
          className={clsx(
            'shrink-0 text-xs font-bold px-4 py-2 rounded-full transition-all duration-300 shadow-sm border',
            classFilter === 'all' ? 'bg-gradient-cta text-white border-transparent scale-105' : 'bg-white/40 dark:bg-black/20 text-gray-600 dark:text-gray-300 border-white/40 dark:border-white/10 hover:border-blush-300/50'
          )}
        >
          All Classes
        </button>
        {availableClasses.map((c) => (
          <button
            key={c}
            onClick={() => setClassFilter(c)}
            className={clsx(
              'shrink-0 text-xs font-bold px-4 py-2 rounded-full transition-all duration-300 shadow-sm border',
              classFilter === c ? 'bg-gradient-cta text-white border-transparent scale-105' : 'bg-white/40 dark:bg-black/20 text-gray-600 dark:text-gray-300 border-white/40 dark:border-white/10 hover:border-blush-300/50'
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      )}

      {isError && (
        <EmptyState
          icon={HiOutlineUserGroup}
          title="Couldn't load students"
          description="Check your connection and pull to refresh. Data will sync automatically once you're back online."
        />
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <EmptyState
          icon={HiOutlineAcademicCap}
          title={students.length === 0 ? 'No students yet' : 'No matches found'}
          description={
            students.length === 0
              ? 'Tap the + button to enroll your first student into the system.'
              : 'Try adjusting your search or class filter.'
          }
        />
      )}

      <motion.div variants={containerVars} initial="hidden" animate="show" className="space-y-3 pb-20">
        {filtered.map((s) => (
          <motion.div key={s.id} variants={itemVars}>
            <GlassCard padding="sm" className="flex items-center gap-3 relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-blush-300/50 group cursor-pointer" onClick={() => openDetail(s)}>
              <div className="absolute inset-y-0 left-0 w-1 bg-blush-400/20 group-hover:bg-blush-400 transition-colors" />
              <div className="relative ml-2 shrink-0">
                <img
                  src={s.avatar || `https://i.pravatar.cc/150?u=${s.id}`}
                  alt={s.name}
                  className="w-12 h-12 rounded-2xl object-cover shadow-inner"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-[15px] truncate text-gray-900 dark:text-white">{s.name}</p>
                <p className="text-[11px] font-semibold text-blush-700/60 dark:text-blush-200/50 truncate flex items-center gap-1 mt-0.5">
                  {s.className} <span className="w-1 h-1 rounded-full bg-blush-700/30" /> Roll {s.rollNo}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0 pr-1">
                <span className={clsx('text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider', statusStyles[s.feeStatus])}>
                  {s.feeStatus}
                </span>
                <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400 bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-md">
                  {s.attendance}% Att.
                </span>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      <Fab icon={HiOutlinePlus} label="Enroll Student" onClick={openAdd} />

      <BottomSheet open={sheetMode === 'add'} onClose={closeSheet} title="Enroll Student">
        <StudentForm submitLabel="Enroll Student" submitting={createMutation.isPending} onSubmit={handleCreate} />
      </BottomSheet>

      <BottomSheet open={sheetMode === 'edit'} onClose={closeSheet} title="Edit Student">
        {activeStudent && (
          <StudentForm
            defaultValues={activeStudent}
            submitLabel="Save Changes"
            submitting={updateMutation.isPending}
            onSubmit={handleUpdate}
          />
        )}
      </BottomSheet>

      <BottomSheet open={sheetMode === 'detail'} onClose={closeSheet} title="Student Details">
        {activeStudent && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-white/40 dark:bg-black/20 p-4 rounded-2xl border border-white/50 dark:border-white/10 shadow-inner">
              <img
                src={activeStudent.avatar || `https://i.pravatar.cc/150?u=${activeStudent.id}`}
                alt={activeStudent.name}
                className="w-16 h-16 rounded-2xl object-cover shadow-sm"
              />
              <div className="min-w-0">
                <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white truncate">{activeStudent.name}</h3>
                <p className="font-semibold text-xs text-blush-700/70 dark:text-blush-200/50 mb-1.5">{activeStudent.className} · Roll {activeStudent.rollNo}</p>
                <div className="flex gap-2">
                  <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider', statusStyles[activeStudent.feeStatus])}>
                    {activeStudent.feeStatus}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600">
                    ₹{activeStudent.feeDue.toLocaleString('en-IN')} Due
                  </span>
                </div>
              </div>
            </div>

            <GlassCard padding="md" className="space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-20 pointer-events-none">
                <HiOutlineUserGroup size={40} className="text-blush-800 dark:text-blush-200" />
              </div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-blush-700/60 dark:text-blush-200/50">Guardian Details</p>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{activeStudent.guardian}</p>
                <div className="flex flex-col gap-1.5 mt-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                    <div className="w-6 h-6 rounded-md bg-blush-500/10 flex items-center justify-center text-blush-600"><HiOutlinePhone size={12} /></div> 
                    {activeStudent.guardianPhone}
                  </div>
                  {activeStudent.guardianEmail && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                      <div className="w-6 h-6 rounded-md bg-blush-500/10 flex items-center justify-center text-blush-600"><HiOutlineMail size={12} /></div>
                      {activeStudent.guardianEmail}
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button variant="glass" icon={<HiOutlinePencil size={16} />} onClick={() => openEdit(activeStudent)}>
                Edit Student
              </Button>
              <Button
                variant="outline"
                icon={<HiOutlineTrash size={16} />}
                className="!text-rose-600 !border-rose-300/50 hover:!bg-rose-50"
                onClick={() => setConfirmDeleteId(activeStudent.id)}
              >
                Remove
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>

      <BottomSheet open={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)} title="Remove student?">
        <div className="flex flex-col items-center text-center p-2">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-4">
            <HiOutlineTrash size={24} className="text-rose-600" />
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Are you sure?</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-6">
            This permanently deletes the student record from Firestore. This action cannot be undone.
          </p>
          <div className="grid grid-cols-2 gap-3 w-full">
            <Button variant="glass" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
            <Button
              className="!bg-rose-600 font-bold"
              disabled={deleteMutation.isPending}
              onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
            >
              {deleteMutation.isPending ? 'Removing…' : 'Delete Student'}
            </Button>
          </div>
        </div>
      </BottomSheet>
    </Screen>
  );
}
