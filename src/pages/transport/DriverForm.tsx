import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { driverSchema, defaultDriverValues, type DriverFormValues } from '@/schemas/driver.schema';

interface Props {
  defaultValues?: DriverFormValues;
  submitting?: boolean;
  submitLabel: string;
  onSubmit: (values: DriverFormValues) => void;
}

const inputClass = 'glass-input w-full px-4 py-3 text-sm placeholder:text-blush-700/40 dark:placeholder:text-blush-200/30';
const labelClass = 'text-xs font-semibold text-blush-800/70 dark:text-blush-100/60 mb-1.5 block';
const errorClass = 'text-[11px] text-rose-600 mt-1';

export function DriverForm({ defaultValues, submitting, submitLabel, onSubmit }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema),
    defaultValues: defaultValues ?? defaultDriverValues,
  });

  useEffect(() => { reset(defaultValues ?? defaultDriverValues); }, [defaultValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
      <div>
        <label className={labelClass}>Full name</label>
        <input {...register('name')} className={inputClass} placeholder="Rajesh Kumar" />
        {errors.name && <p className={errorClass}>{errors.name.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Phone</label>
          <input {...register('phone')} className={inputClass} placeholder="+91 98765 43210" />
          {errors.phone && <p className={errorClass}>{errors.phone.message}</p>}
        </div>
        <div>
          <label className={labelClass}>License no.</label>
          <input {...register('licenseNo')} className={inputClass} placeholder="DL-1420110012345" />
          {errors.licenseNo && <p className={errorClass}>{errors.licenseNo.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Experience (years)</label>
          <input type="number" {...register('experienceYears')} className={inputClass} placeholder="5" />
          {errors.experienceYears && <p className={errorClass}>{errors.experienceYears.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <select {...register('status')} className={clsx(inputClass, 'appearance-none')}>
            <option value="active">Active</option>
            <option value="on_leave">On leave</option>
          </select>
        </div>
      </div>
      <Button type="submit" fullWidth size="lg" disabled={submitting} className={submitting ? '!opacity-70 !cursor-wait' : ''}>
        {submitting ? 'Saving…' : submitLabel}
      </Button>
    </form>
  );
}
