import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlinePlus, HiOutlineBookOpen, HiOutlineTrash } from 'react-icons/hi';
import { Screen } from '@/components/layout/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { Fab } from '@/components/ui/Fab';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { useMyTeacherRecord } from '@/hooks/useMyTeacherRecord';
import { useAssignmentsForClasses, useCreateAssignment, useDeleteAssignment } from '@/hooks/useAssignments';
import { assignmentSchema, defaultAssignmentValues, type AssignmentFormValues } from '@/schemas/assignment.schema';

const inputClass = 'glass-input w-full px-4 py-3 text-sm placeholder:text-blush-700/40 dark:placeholder:text-blush-200/30';
const labelClass = 'text-xs font-semibold text-blush-800/70 dark:text-blush-100/60 mb-1.5 block';
const errorClass = 'text-[11px] text-rose-600 mt-1';

export default function TeacherAssignments() {
  const navigate = useNavigate();
  const { data: teacher, myClasses } = useMyTeacherRecord();
  const { data: assignments = [], isLoading } = useAssignmentsForClasses(myClasses);
  const createMutation = useCreateAssignment();
  const deleteMutation = useDeleteAssignment();
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: { ...defaultAssignmentValues, teacherName: teacher?.name ?? '' },
  });

  const onSubmit = (values: AssignmentFormValues) => {
    createMutation.mutate(
      { ...values, teacherName: teacher?.name ?? '' },
      {
        onSuccess: () => {
          setOpen(false);
          reset({ ...defaultAssignmentValues, teacherName: teacher?.name ?? '' });
        },
      }
    );
  };

  return (
    <Screen>
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => navigate(-1)} className="glass-pill w-9 h-9 flex items-center justify-center">
          <HiOutlineArrowLeft size={18} />
        </button>
        <h1 className="font-display text-lg font-semibold">Assignments</h1>
      </div>

      {isLoading && <DashboardSkeleton />}

      {!isLoading && assignments.length === 0 && (
        <EmptyState icon={HiOutlineBookOpen} title="No assignments yet" description="Tap + to post a new assignment to one of your classes." />
      )}

      <div className="space-y-2.5">
        {assignments.map((a) => (
          <GlassCard key={a.id} padding="md">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wide text-blush-600">{a.className} · {a.subject}</span>
                <p className="font-semibold text-sm mt-0.5 truncate">{a.title}</p>
                <p className="text-xs text-blush-700/60 mt-1">{a.description}</p>
                <p className="text-[11px] text-blush-700/40 mt-2">Due {a.dueDate}</p>
              </div>
              <button
                onClick={() => deleteMutation.mutate(a.id)}
                className="glass-pill w-8 h-8 flex items-center justify-center shrink-0"
                aria-label="Delete"
              >
                <HiOutlineTrash size={14} className="text-rose-600" />
              </button>
            </div>
          </GlassCard>
        ))}
      </div>

      <Fab icon={HiOutlinePlus} label="Post assignment" onClick={() => setOpen(true)} />

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Post Assignment">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
          <div>
            <label className={labelClass}>Class</label>
            <select {...register('className')} className={clsx(inputClass, 'appearance-none')}>
              <option value="">Select a class</option>
              {myClasses.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.className && <p className={errorClass}>{errors.className.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Subject</label>
            <input {...register('subject')} className={inputClass} placeholder="Mathematics" />
            {errors.subject && <p className={errorClass}>{errors.subject.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Title</label>
            <input {...register('title')} className={inputClass} placeholder="Chapter 4 worksheet" />
            {errors.title && <p className={errorClass}>{errors.title.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Instructions</label>
            <textarea {...register('description')} rows={3} className={inputClass} placeholder="Solve Q1–Q10, show all steps" />
            {errors.description && <p className={errorClass}>{errors.description.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Due date</label>
            <input type="date" {...register('dueDate')} className={inputClass} />
            {errors.dueDate && <p className={errorClass}>{errors.dueDate.message}</p>}
          </div>
          <Button type="submit" fullWidth size="lg" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Posting…' : 'Post Assignment'}
          </Button>
        </form>
      </BottomSheet>
    </Screen>
  );
}
