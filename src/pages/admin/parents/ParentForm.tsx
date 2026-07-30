import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { parentSchema, defaultParentValues, type ParentFormValues } from '@/schemas/parent.schema';

interface Props {
  defaultValues?: ParentFormValues;
  submitting?: boolean;
  submitLabel: string;
  onSubmit: (values: ParentFormValues) => void;
}

const inputClass = 'glass-input w-full px-4 py-3 text-sm placeholder:text-blush-700/40 dark:placeholder:text-blush-200/30';
const labelClass = 'text-xs font-semibold text-blush-800/70 dark:text-blush-100/60 mb-1.5 block';
const errorClass = 'text-[11px] text-rose-600 mt-1';

export function ParentForm({ defaultValues, submitting, submitLabel, onSubmit }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ParentFormValues>({
    resolver: zodResolver(parentSchema),
    defaultValues: defaultValues ?? defaultParentValues,
  });

  useEffect(() => { reset(defaultValues ?? defaultParentValues); }, [defaultValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
      <div>
        <label className={labelClass}>Full name</label>
        <input {...register('name')} className={inputClass} placeholder="Rohan Mehta" />
        {errors.name && <p className={errorClass}>{errors.name.message}</p>}
      </div>
      <div>
        <label className={labelClass}>Email</label>
        <input {...register('email')} className={inputClass} placeholder="rohan.mehta@gmail.com" />
        <p className="text-[10px] text-blush-700/40 mt-1">Must match this parent's Google account email so their app shows the right children.</p>
        {errors.email && <p className={errorClass}>{errors.email.message}</p>}
      </div>
      <div>
        <label className={labelClass}>Phone</label>
        <input {...register('phone')} className={inputClass} placeholder="+91 98765 43210" />
        {errors.phone && <p className={errorClass}>{errors.phone.message}</p>}
      </div>
      <div>
        <label className={labelClass}>Address (optional)</label>
        <input {...register('address')} className={inputClass} placeholder="12 Green Park, New Delhi" />
      </div>
      <div>
        <label className={labelClass}>Children</label>
        <input {...register('childrenNames')} className={inputClass} placeholder="Aarav Sharma, Priya Sharma" />
        {errors.childrenNames && <p className={errorClass}>{errors.childrenNames.message}</p>}
      </div>
      <Button type="submit" fullWidth size="lg" disabled={submitting} className={submitting ? '!opacity-70 !cursor-wait' : ''}>
        {submitting ? 'Saving…' : submitLabel}
      </Button>
    </form>
  );
}
