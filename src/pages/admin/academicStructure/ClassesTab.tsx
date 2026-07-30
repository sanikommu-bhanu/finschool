import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineAcademicCap } from 'react-icons/hi';
import { GlassCard } from '@/components/ui/GlassCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  gradeSchema,
  defaultGradeValues,
  DEFAULT_GRADE_ORDER,
  classSectionSchema,
  defaultClassSectionValuesFor,
  buildClassName,
  type GradeDoc,
  type GradeFormValues,
  type ClassSectionFormValues,
} from '@/schemas/academicStructure.schema';
import {
  useGrades,
  useCreateGrade,
  useDeleteGrade,
  useClassSections,
  useCreateClassSection,
  useDeleteClassSection,
} from '@/hooks/useAcademicStructure';

const inputClass = 'glass-input w-full px-4 py-3 text-sm placeholder:text-blush-700/40 dark:placeholder:text-blush-200/30';
const labelClass = 'text-xs font-semibold text-blush-800/70 dark:text-blush-100/60 mb-1.5 block';
const errorClass = 'text-[11px] text-rose-600 mt-1';

function GradeForm({ submitting, onSubmit }: { submitting?: boolean; onSubmit: (values: GradeFormValues) => void }) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<GradeFormValues>({ resolver: zodResolver(gradeSchema), defaultValues: defaultGradeValues });

  const name = watch('name');
  useEffect(() => {
    // Auto-fill a sensible sort order when the name matches a known default class label.
    if (name && name in DEFAULT_GRADE_ORDER) setValue('order', DEFAULT_GRADE_ORDER[name]);
  }, [name, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
      <div>
        <label className={labelClass}>Grade name</label>
        <input {...register('name')} className={inputClass} placeholder="Class 5" />
        {errors.name && <p className={errorClass}>{errors.name.message}</p>}
      </div>
      <div>
        <label className={labelClass}>Sort order</label>
        <input type="number" {...register('order')} className={inputClass} placeholder="0" />
        <p className="text-[11px] text-blush-700/50 dark:text-blush-200/40 mt-1">Lower numbers show first.</p>
      </div>
      <Button type="submit" fullWidth size="lg" disabled={submitting} className={submitting ? '!opacity-70 !cursor-wait' : ''}>
        {submitting ? 'Adding…' : 'Add grade'}
      </Button>
    </form>
  );
}

function ClassSectionForm({
  grades,
  submitting,
  onSubmit,
}: {
  grades: GradeDoc[];
  submitting?: boolean;
  onSubmit: (values: ClassSectionFormValues) => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ClassSectionFormValues>({
    resolver: zodResolver(classSectionSchema),
    defaultValues: defaultClassSectionValuesFor(grades[0]),
  });

  const gradeId = watch('gradeId');
  const section = watch('section');

  useEffect(() => {
    const grade = grades.find((g) => g.id === gradeId);
    if (!grade) return;
    setValue('gradeName', grade.name);
    setValue('className', buildClassName(grade.name, section || 'A'));
  }, [gradeId, section, grades, setValue]);

  if (grades.length === 0) {
    return (
      <p className="text-sm text-blush-700/60 dark:text-blush-200/50">
        Add a grade first — a class always belongs to one.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
      <div>
        <label className={labelClass}>Grade</label>
        <select {...register('gradeId')} className={clsx(inputClass, 'appearance-none')}>
          {grades.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        {errors.gradeId && <p className={errorClass}>{errors.gradeId.message}</p>}
      </div>
      <div>
        <label className={labelClass}>Section</label>
        <input {...register('section')} className={inputClass} placeholder="A" />
        {errors.section && <p className={errorClass}>{errors.section.message}</p>}
      </div>
      <div>
        <label className={labelClass}>Capacity (optional)</label>
        <input type="number" {...register('capacity')} className={inputClass} placeholder="40" />
      </div>
      <div className="glass-card !bg-blush-50/40 px-4 py-3">
        <p className="text-xs font-semibold text-blush-700/60 dark:text-blush-200/50 mb-0.5">Class name</p>
        <p className="font-display font-semibold text-sm">{watch('className') || '—'}</p>
        <p className="text-[11px] text-blush-700/50 dark:text-blush-200/40 mt-1">
          This is the exact string students, teachers, fee templates, and join codes will use.
        </p>
      </div>
      <Button type="submit" fullWidth size="lg" disabled={submitting} className={submitting ? '!opacity-70 !cursor-wait' : ''}>
        {submitting ? 'Adding…' : 'Add class'}
      </Button>
    </form>
  );
}

export function ClassesTab() {
  const { data: grades = [], isLoading: gradesLoading } = useGrades();
  const { data: sections = [], isLoading: sectionsLoading } = useClassSections();
  const createGradeMutation = useCreateGrade();
  const deleteGradeMutation = useDeleteGrade();
  const createSectionMutation = useCreateClassSection();
  const deleteSectionMutation = useDeleteClassSection();

  const [sheet, setSheet] = useState<'closed' | 'addGrade' | 'addClass'>('closed');
  const [confirmDeleteGradeId, setConfirmDeleteGradeId] = useState<string | null>(null);
  const [confirmDeleteClassId, setConfirmDeleteClassId] = useState<string | null>(null);
  const closeSheet = () => setSheet('closed');

  const sectionsByGrade = useMemo(() => {
    const map = new Map<string, typeof sections>();
    for (const s of sections) {
      const list = map.get(s.gradeId) ?? [];
      list.push(s);
      map.set(s.gradeId, list);
    }
    return map;
  }, [sections]);

  const isLoading = gradesLoading || sectionsLoading;

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <Button variant="glass" size="sm" icon={<HiOutlinePlus size={14} />} onClick={() => setSheet('addGrade')}>
          Add grade
        </Button>
        <Button variant="glass" size="sm" icon={<HiOutlinePlus size={14} />} onClick={() => setSheet('addClass')} disabled={grades.length === 0}>
          Add class
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-xl3" />
          <Skeleton className="h-20 w-full rounded-xl3" />
        </div>
      )}

      {!isLoading && grades.length === 0 && (
        <EmptyState icon={HiOutlineAcademicCap} title="No grades yet" description="Add a grade (e.g. Class 5) to start defining its class sections." />
      )}

      <div className="space-y-4">
        {grades.map((g) => (
          <GlassCard key={g.id} padding="md">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-sm">{g.name}</p>
              <button
                onClick={() => setConfirmDeleteGradeId(g.id)}
                aria-label="Delete grade"
                className="w-7 h-7 rounded-xl2 flex items-center justify-center glass-pill !text-rose-600"
              >
                <HiOutlineTrash size={13} />
              </button>
            </div>
            {(sectionsByGrade.get(g.id) ?? []).length === 0 ? (
              <p className="text-xs text-blush-700/50 dark:text-blush-200/40">No classes yet for this grade.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(sectionsByGrade.get(g.id) ?? []).map((s) => (
                  <div key={s.id} className="glass-pill flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium">
                    <span>{s.className}</span>
                    <button
                      onClick={() => setConfirmDeleteClassId(s.id)}
                      aria-label="Delete class"
                      className="text-rose-600"
                    >
                      <HiOutlineTrash size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        ))}
      </div>

      <BottomSheet open={sheet === 'addGrade'} onClose={closeSheet} title="New grade">
        <GradeForm
          submitting={createGradeMutation.isPending}
          onSubmit={(v) => createGradeMutation.mutate(v, { onSuccess: closeSheet })}
        />
      </BottomSheet>

      <BottomSheet open={sheet === 'addClass'} onClose={closeSheet} title="New class">
        <ClassSectionForm
          grades={grades}
          submitting={createSectionMutation.isPending}
          onSubmit={(v) => createSectionMutation.mutate(v, { onSuccess: closeSheet })}
        />
      </BottomSheet>

      <BottomSheet open={!!confirmDeleteGradeId} onClose={() => setConfirmDeleteGradeId(null)} title="Remove grade?">
        <p className="text-sm text-blush-700/70 dark:text-blush-200/50 mb-4">
          This only removes the grade record — its classes, and any students already in them, are unaffected.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="glass" onClick={() => setConfirmDeleteGradeId(null)}>Cancel</Button>
          <Button
            className="!bg-rose-600"
            disabled={deleteGradeMutation.isPending}
            onClick={() => confirmDeleteGradeId && deleteGradeMutation.mutate(confirmDeleteGradeId, { onSuccess: () => setConfirmDeleteGradeId(null) })}
          >
            {deleteGradeMutation.isPending ? 'Removing…' : 'Remove'}
          </Button>
        </div>
      </BottomSheet>

      <BottomSheet open={!!confirmDeleteClassId} onClose={() => setConfirmDeleteClassId(null)} title="Remove class?">
        <p className="text-sm text-blush-700/70 dark:text-blush-200/50 mb-4">
          This only removes the class reference — students, fee templates, and join codes already using this
          class name are unaffected.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="glass" onClick={() => setConfirmDeleteClassId(null)}>Cancel</Button>
          <Button
            className="!bg-rose-600"
            disabled={deleteSectionMutation.isPending}
            onClick={() => confirmDeleteClassId && deleteSectionMutation.mutate(confirmDeleteClassId, { onSuccess: () => setConfirmDeleteClassId(null) })}
          >
            {deleteSectionMutation.isPending ? 'Removing…' : 'Remove'}
          </Button>
        </div>
      </BottomSheet>
    </>
  );
}
