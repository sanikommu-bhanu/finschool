import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  schoolProfileSchema,
  defaultSchoolProfileValues,
  type SchoolProfileFormValues,
} from '@/schemas/academicStructure.schema';
import { useSchoolProfile, useSaveSchoolProfile, useAcademicYears } from '@/hooks/useAcademicStructure';

const inputClass = 'glass-input w-full px-4 py-3 text-sm placeholder:text-blush-700/40 dark:placeholder:text-blush-200/30';
const labelClass = 'text-xs font-semibold text-blush-800/70 dark:text-blush-100/60 mb-1.5 block';
const errorClass = 'text-[11px] text-rose-600 mt-1';

export function SchoolProfileTab() {
  const { data: profile, isLoading } = useSchoolProfile();
  const { data: years = [] } = useAcademicYears();
  const saveMutation = useSaveSchoolProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SchoolProfileFormValues>({
    resolver: zodResolver(schoolProfileSchema),
    defaultValues: defaultSchoolProfileValues,
  });

  useEffect(() => {
    if (profile) reset(profile);
  }, [profile, reset]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-14 w-full rounded-xl3" />
        <Skeleton className="h-14 w-full rounded-xl3" />
        <Skeleton className="h-14 w-full rounded-xl3" />
      </div>
    );
  }

  return (
    <GlassCard padding="md">
      <p className="text-xs text-blush-700/50 dark:text-blush-200/40 mb-4 leading-relaxed">
        This is the school's own record — its name and contact details, and which Academic
        Year is currently active. Nothing else in the app reads from it yet.
      </p>
      <form onSubmit={handleSubmit((v) => saveMutation.mutate(v))} className="space-y-3.5">
        <div>
          <label className={labelClass}>School name</label>
          <input {...register('name')} className={inputClass} placeholder="Smart School" />
          {errors.name && <p className={errorClass}>{errors.name.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Address</label>
          <input {...register('address')} className={inputClass} placeholder="123 Main Street" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Phone</label>
            <input {...register('phone')} className={inputClass} placeholder="+91 98765 43210" />
            {errors.phone && <p className={errorClass}>{errors.phone.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input {...register('email')} className={inputClass} placeholder="office@school.edu" />
            {errors.email && <p className={errorClass}>{errors.email.message}</p>}
          </div>
        </div>
        <div>
          <label className={labelClass}>Website</label>
          <input {...register('website')} className={inputClass} placeholder="www.school.edu" />
        </div>
        <div>
          <label className={labelClass}>Active academic year</label>
          <select {...register('activeAcademicYearId')} className={`${inputClass} appearance-none`}>
            <option value="">Not set</option>
            {years.map((y) => (
              <option key={y.id} value={y.id}>{y.label}</option>
            ))}
          </select>
          {years.length === 0 && (
            <p className="text-[11px] text-blush-700/50 dark:text-blush-200/40 mt-1">
              Add an academic year on the "Years" tab first.
            </p>
          )}
        </div>
        <Button
          type="submit"
          fullWidth
          size="lg"
          disabled={saveMutation.isPending}
          className={saveMutation.isPending ? '!opacity-70 !cursor-wait' : ''}
        >
          {saveMutation.isPending ? 'Saving…' : 'Save school profile'}
        </Button>
      </form>
    </GlassCard>
  );
}
