import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineCalendar } from 'react-icons/hi';
import { GlassCard } from '@/components/ui/GlassCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Fab } from '@/components/ui/Fab';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  academicYearSchema,
  defaultAcademicYearValues,
  type AcademicYearDoc,
  type AcademicYearFormValues,
} from '@/schemas/academicStructure.schema';
import {
  useAcademicYears,
  useCreateAcademicYear,
  useUpdateAcademicYear,
  useDeleteAcademicYear,
} from '@/hooks/useAcademicStructure';

const inputClass = 'glass-input w-full px-4 py-3 text-sm placeholder:text-blush-700/40 dark:placeholder:text-blush-200/30';
const labelClass = 'text-xs font-semibold text-blush-800/70 dark:text-blush-100/60 mb-1.5 block';
const errorClass = 'text-[11px] text-rose-600 mt-1';

function AcademicYearForm({
  defaultValues,
  submitting,
  submitLabel,
  onSubmit,
}: {
  defaultValues?: AcademicYearFormValues;
  submitting?: boolean;
  submitLabel: string;
  onSubmit: (values: AcademicYearFormValues) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AcademicYearFormValues>({
    resolver: zodResolver(academicYearSchema),
    defaultValues: defaultValues ?? defaultAcademicYearValues,
  });

  useEffect(() => {
    reset(defaultValues ?? defaultAcademicYearValues);
  }, [defaultValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
      <div>
        <label className={labelClass}>Label</label>
        <input {...register('label')} className={inputClass} placeholder="2025-2026" />
        {errors.label && <p className={errorClass}>{errors.label.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Start date</label>
          <input type="date" {...register('startDate')} className={inputClass} />
          {errors.startDate && <p className={errorClass}>{errors.startDate.message}</p>}
        </div>
        <div>
          <label className={labelClass}>End date</label>
          <input type="date" {...register('endDate')} className={inputClass} />
          {errors.endDate && <p className={errorClass}>{errors.endDate.message}</p>}
        </div>
      </div>
      <label className="flex items-center gap-2.5 py-1">
        <input type="checkbox" {...register('isActive')} className="w-4 h-4 accent-blush-600" />
        <span className="text-sm">Mark as the active year</span>
      </label>
      <p className="text-[11px] text-blush-700/50 dark:text-blush-200/40 -mt-2">
        Only one year can be active at a time — marking this one active un-marks any other.
      </p>
      <Button type="submit" fullWidth size="lg" disabled={submitting} className={submitting ? '!opacity-70 !cursor-wait' : ''}>
        {submitting ? 'Saving…' : submitLabel}
      </Button>
    </form>
  );
}

export function AcademicYearsTab() {
  const { data: years = [], isLoading, isError } = useAcademicYears();
  const createMutation = useCreateAcademicYear();
  const updateMutation = useUpdateAcademicYear();
  const deleteMutation = useDeleteAcademicYear();

  const [sheetMode, setSheetMode] = useState<'closed' | 'add' | 'edit'>('closed');
  const [active, setActive] = useState<AcademicYearDoc | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const closeSheet = () => setSheetMode('closed');

  return (
    <>
      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-xl3" />
          <Skeleton className="h-16 w-full rounded-xl3" />
        </div>
      )}

      {isError && (
        <EmptyState icon={HiOutlineCalendar} title="Couldn't load academic years" description="Check your connection and pull to refresh." />
      )}

      {!isLoading && !isError && years.length === 0 && (
        <EmptyState icon={HiOutlineCalendar} title="No academic years yet" description="Tap the + button to add the first one, e.g. 2025-2026." />
      )}

      <div className="space-y-3">
        {years.map((y) => (
          <GlassCard key={y.id} padding="md" className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm truncate">{y.label}</p>
                {y.isActive && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gradient-cta text-white shrink-0">Active</span>
                )}
              </div>
              <p className="text-xs text-blush-700/50 dark:text-blush-200/40 truncate">{y.startDate} → {y.endDate}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => { setActive(y); setSheetMode('edit'); }}
                aria-label="Edit academic year"
                className="w-8 h-8 rounded-xl2 flex items-center justify-center glass-pill"
              >
                <HiOutlinePencil size={14} />
              </button>
              <button
                onClick={() => setConfirmDeleteId(y.id)}
                aria-label="Delete academic year"
                className="w-8 h-8 rounded-xl2 flex items-center justify-center glass-pill !text-rose-600"
              >
                <HiOutlineTrash size={14} />
              </button>
            </div>
          </GlassCard>
        ))}
      </div>

      <Fab icon={HiOutlinePlus} label="Add academic year" onClick={() => { setActive(null); setSheetMode('add'); }} />

      <BottomSheet open={sheetMode === 'add'} onClose={closeSheet} title="New academic year">
        <AcademicYearForm
          submitLabel="Add year"
          submitting={createMutation.isPending}
          onSubmit={(v) => createMutation.mutate(v, { onSuccess: closeSheet })}
        />
      </BottomSheet>

      <BottomSheet open={sheetMode === 'edit'} onClose={closeSheet} title="Edit academic year">
        {active && (
          <AcademicYearForm
            defaultValues={active}
            submitLabel="Save changes"
            submitting={updateMutation.isPending}
            onSubmit={(v) => updateMutation.mutate({ id: active.id, data: v }, { onSuccess: closeSheet })}
          />
        )}
      </BottomSheet>

      <BottomSheet open={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)} title="Remove academic year?">
        <p className="text-sm text-blush-700/70 dark:text-blush-200/50 mb-4">
          This only removes the year record. Students, fees, and everything else are unaffected.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="glass" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
          <Button
            className="!bg-rose-600"
            disabled={deleteMutation.isPending}
            onClick={() => confirmDeleteId && deleteMutation.mutate(confirmDeleteId, { onSuccess: () => setConfirmDeleteId(null) })}
          >
            {deleteMutation.isPending ? 'Removing…' : 'Remove'}
          </Button>
        </div>
      </BottomSheet>
    </>
  );
}
