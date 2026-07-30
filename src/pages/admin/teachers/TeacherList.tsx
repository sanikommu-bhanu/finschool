import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlinePhone, HiOutlineMail, HiOutlineAcademicCap, HiOutlineBriefcase } from 'react-icons/hi';
import { Screen } from '@/components/layout/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Fab } from '@/components/ui/Fab';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { TeacherForm } from './TeacherForm';
import { useTeachers, useCreateTeacher, useUpdateTeacher, useDeleteTeacher } from '@/hooks/useTeachers';
import type { TeacherDoc, TeacherFormValues } from '@/schemas/teacher.schema';

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

export default function TeacherList() {
  const { data: teachers = [], isLoading, isError } = useTeachers();
  const createMutation = useCreateTeacher();
  const updateMutation = useUpdateTeacher();
  const deleteMutation = useDeleteTeacher();

  const [search, setSearch] = useState('');
  const [sheetMode, setSheetMode] = useState<'closed' | 'add' | 'edit' | 'detail'>('closed');
  const [active, setActive] = useState<TeacherDoc | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter((t) => t.name.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q) || t.classes.toLowerCase().includes(q));
  }, [teachers, search]);

  const closeSheet = () => setSheetMode('closed');
  const openAdd = () => { setActive(null); setSheetMode('add'); };
  const openDetail = (t: TeacherDoc) => { setActive(t); setSheetMode('detail'); };
  const openEdit = (t: TeacherDoc) => { setActive(t); setSheetMode('edit'); };

  const handleCreate = (values: TeacherFormValues) => createMutation.mutate(values, { onSuccess: closeSheet });
  const handleUpdate = (values: TeacherFormValues) => {
    if (!active) return;
    updateMutation.mutate({ id: active.id, data: values }, { onSuccess: closeSheet });
  };
  const handleDelete = (id: string) => deleteMutation.mutate(id, { onSuccess: () => { setConfirmDeleteId(null); closeSheet(); } });

  return (
    <Screen>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Teachers</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-blush-700/60 dark:text-blush-200/50 bg-blush-500/10 px-2.5 py-1 rounded-full border border-blush-200/50 dark:border-white/5">
            {teachers.length} total
          </span>
        </div>
      </div>

      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blush-700/40">
          <SearchBar value={search} onChange={setSearch} placeholder="Search name, subject or class..." />
        </div>
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
          icon={HiOutlineAcademicCap} 
          title="Couldn't load teachers" 
          description="Check your connection and try again." 
        />
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <EmptyState
          icon={HiOutlineAcademicCap}
          title={teachers.length === 0 ? 'No teachers yet' : 'No matches found'}
          description={teachers.length === 0 ? 'Tap the + button to onboard your first teacher.' : 'Try adjusting your search.'}
        />
      )}

      <motion.div variants={containerVars} initial="hidden" animate="show" className="space-y-3 pb-20">
        {filtered.map((t) => (
          <motion.div key={t.id} variants={itemVars}>
            <GlassCard padding="sm" className="flex items-center gap-3 relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-blush-300/50 group cursor-pointer" onClick={() => openDetail(t)}>
              <div className={`absolute inset-y-0 left-0 w-1 transition-colors ${t.status === 'active' ? 'bg-emerald-400/20 group-hover:bg-emerald-400' : 'bg-amber-400/20 group-hover:bg-amber-400'}`} />
              <div className="relative ml-2 shrink-0">
                <img src={t.avatar || `https://i.pravatar.cc/150?u=${t.id}`} alt={t.name} className="w-12 h-12 rounded-2xl object-cover shadow-inner" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-[15px] truncate text-gray-900 dark:text-white">{t.name}</p>
                <p className="text-[11px] font-semibold text-blush-700/60 dark:text-blush-200/50 truncate flex items-center gap-1 mt-0.5">
                  <HiOutlineAcademicCap size={12} /> {t.subject} <span className="w-1 h-1 rounded-full bg-blush-700/30" /> {t.classes}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0 pr-1">
                <span className={clsx('text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider', t.status === 'active' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/15 text-amber-600')}>
                  {t.status === 'active' ? 'Active' : 'On Leave'}
                </span>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      <Fab icon={HiOutlinePlus} label="Add Teacher" onClick={openAdd} />

      <BottomSheet open={sheetMode === 'add'} onClose={closeSheet} title="Add Teacher">
        <TeacherForm submitLabel="Add Teacher" submitting={createMutation.isPending} onSubmit={handleCreate} />
      </BottomSheet>

      <BottomSheet open={sheetMode === 'edit'} onClose={closeSheet} title="Edit Teacher">
        {active && <TeacherForm defaultValues={active} submitLabel="Save Changes" submitting={updateMutation.isPending} onSubmit={handleUpdate} />}
      </BottomSheet>

      <BottomSheet open={sheetMode === 'detail'} onClose={closeSheet} title="Teacher Profile">
        {active && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-white/40 dark:bg-black/20 p-4 rounded-2xl border border-white/50 dark:border-white/10 shadow-inner">
              <img src={active.avatar || `https://i.pravatar.cc/150?u=${active.id}`} alt={active.name} className="w-16 h-16 rounded-2xl object-cover shadow-sm" />
              <div className="min-w-0">
                <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white truncate">{active.name}</h3>
                <p className="font-semibold text-xs text-blush-700/70 dark:text-blush-200/50 mb-1.5 flex items-center gap-1">
                  <HiOutlineAcademicCap size={14} /> {active.subject}
                </p>
                <div className="flex gap-2">
                  <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider', active.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600')}>
                    {active.status}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/60 dark:bg-black/40 text-gray-700 dark:text-gray-300 border border-white/40 dark:border-white/10">
                    {active.classes}
                  </span>
                </div>
              </div>
            </div>

            <GlassCard padding="md" className="space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-20 pointer-events-none">
                <HiOutlineBriefcase size={40} className="text-blush-800 dark:text-blush-200" />
              </div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-blush-700/60 dark:text-blush-200/50">Contact Details</p>
              <div className="flex flex-col gap-2 mt-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <div className="w-7 h-7 rounded-lg bg-blush-500/10 flex items-center justify-center text-blush-600"><HiOutlinePhone size={14} /></div> 
                  {active.phone}
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <div className="w-7 h-7 rounded-lg bg-blush-500/10 flex items-center justify-center text-blush-600"><HiOutlineMail size={14} /></div>
                  {active.email}
                </div>
              </div>
            </GlassCard>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button variant="glass" icon={<HiOutlinePencil size={16} />} onClick={() => openEdit(active)}>Edit Teacher</Button>
              <Button variant="outline" icon={<HiOutlineTrash size={16} />} className="!text-rose-600 !border-rose-300/50 hover:!bg-rose-50" onClick={() => setConfirmDeleteId(active.id)}>Remove</Button>
            </div>
          </div>
        )}
      </BottomSheet>

      <BottomSheet open={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)} title="Remove teacher?">
        <div className="flex flex-col items-center text-center p-2">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-4">
            <HiOutlineTrash size={24} className="text-rose-600" />
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Are you sure?</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-6">This permanently deletes the teacher record from Firestore. This action cannot be undone.</p>
          <div className="grid grid-cols-2 gap-3 w-full">
            <Button variant="glass" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
            <Button className="!bg-rose-600 font-bold" disabled={deleteMutation.isPending} onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}>
              {deleteMutation.isPending ? 'Removing…' : 'Delete Teacher'}
            </Button>
          </div>
        </div>
      </BottomSheet>
    </Screen>
  );
}
