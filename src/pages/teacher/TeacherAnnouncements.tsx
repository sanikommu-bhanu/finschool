import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlinePlus, HiOutlineSpeakerphone, HiOutlineTrash } from 'react-icons/hi';
import { Screen } from '@/components/layout/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { Fab } from '@/components/ui/Fab';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { useMyTeacherRecord } from '@/hooks/useMyTeacherRecord';
import { useAnnouncementsForClasses, useCreateAnnouncement, useDeleteAnnouncement } from '@/hooks/useAnnouncements';
import { announcementSchema, defaultAnnouncementValues, type AnnouncementFormValues } from '@/schemas/announcement.schema';

const inputClass = 'glass-input w-full px-4 py-3 text-sm placeholder:text-blush-700/40 dark:placeholder:text-blush-200/30';
const labelClass = 'text-xs font-semibold text-blush-800/70 dark:text-blush-100/60 mb-1.5 block';
const errorClass = 'text-[11px] text-rose-600 mt-1';

export default function TeacherAnnouncements() {
  const navigate = useNavigate();
  const { data: teacher, myClasses } = useMyTeacherRecord();
  const { data: announcements = [], isLoading } = useAnnouncementsForClasses(myClasses);
  const createMutation = useCreateAnnouncement();
  const deleteMutation = useDeleteAnnouncement();
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { ...defaultAnnouncementValues, teacherName: teacher?.name ?? '' },
  });

  const onSubmit = (values: AnnouncementFormValues) => {
    createMutation.mutate(
      { ...values, teacherName: teacher?.name ?? '' },
      {
        onSuccess: () => {
          setOpen(false);
          reset({ ...defaultAnnouncementValues, teacherName: teacher?.name ?? '' });
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
        <h1 className="font-display text-lg font-semibold">Announcements</h1>
      </div>

      {isLoading && <DashboardSkeleton />}

      {!isLoading && announcements.length === 0 && (
        <EmptyState icon={HiOutlineSpeakerphone} title="No announcements yet" description="Tap + to post an announcement to a class, or all of them." />
      )}

      <div className="space-y-2.5">
        {announcements.map((a) => (
          <GlassCard key={a.id} padding="md">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wide text-blush-600">{a.className}</span>
                <p className="font-semibold text-sm mt-0.5 truncate">{a.title}</p>
                <p className="text-xs text-blush-700/60 mt-1">{a.message}</p>
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

      <Fab icon={HiOutlinePlus} label="New announcement" onClick={() => setOpen(true)} />

      <BottomSheet open={open} onClose={() => setOpen(false)} title="New Announcement">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
          <div>
            <label className={labelClass}>Audience</label>
            <select {...register('className')} className={clsx(inputClass, 'appearance-none')}>
              <option value="All">All my classes</option>
              {myClasses.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.className && <p className={errorClass}>{errors.className.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Title</label>
            <input {...register('title')} className={inputClass} placeholder="PTM rescheduled" />
            {errors.title && <p className={errorClass}>{errors.title.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Message</label>
            <textarea {...register('message')} rows={3} className={inputClass} placeholder="Write your announcement…" />
            {errors.message && <p className={errorClass}>{errors.message.message}</p>}
          </div>
          <Button type="submit" fullWidth size="lg" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Posting…' : 'Post Announcement'}
          </Button>
        </form>
      </BottomSheet>
    </Screen>
  );
}
