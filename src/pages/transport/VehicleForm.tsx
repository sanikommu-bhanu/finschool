import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { vehicleSchema, defaultVehicleValues, type VehicleFormValues } from '@/schemas/vehicle.schema';
import type { DriverDoc } from '@/schemas/driver.schema';

interface Props {
  defaultValues?: VehicleFormValues;
  drivers: DriverDoc[];
  submitting?: boolean;
  submitLabel: string;
  onSubmit: (values: VehicleFormValues) => void;
}

const inputClass = 'glass-input w-full px-4 py-3 text-sm placeholder:text-blush-700/40 dark:placeholder:text-blush-200/30';
const labelClass = 'text-xs font-semibold text-blush-800/70 dark:text-blush-100/60 mb-1.5 block';
const errorClass = 'text-[11px] text-rose-600 mt-1';

export function VehicleForm({ defaultValues, drivers, submitting, submitLabel, onSubmit }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: defaultValues ?? defaultVehicleValues,
  });

  useEffect(() => { reset(defaultValues ?? defaultVehicleValues); }, [defaultValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
      <div>
        <label className={labelClass}>Vehicle name</label>
        <input {...register('name')} className={inputClass} placeholder="Bus Route 1" />
        {errors.name && <p className={errorClass}>{errors.name.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Registration no.</label>
          <input {...register('regNo')} className={inputClass} placeholder="DL 01 AB 1234" />
          {errors.regNo && <p className={errorClass}>{errors.regNo.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Capacity</label>
          <input type="number" {...register('capacity')} className={inputClass} placeholder="40" />
          {errors.capacity && <p className={errorClass}>{errors.capacity.message}</p>}
        </div>
      </div>
      <div>
        <label className={labelClass}>Assigned driver</label>
        <select {...register('driverId')} className={clsx(inputClass, 'appearance-none')}>
          <option value="">Unassigned</option>
          {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Last service</label>
          <input type="date" {...register('lastServiceDate')} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Next service</label>
          <input type="date" {...register('nextServiceDate')} className={inputClass} />
        </div>
      </div>
      <div>
        <label className={labelClass}>Status</label>
        <select {...register('status')} className={clsx(inputClass, 'appearance-none')}>
          <option value="active">Active</option>
          <option value="maintenance">In maintenance</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <Button type="submit" fullWidth size="lg" disabled={submitting} className={submitting ? '!opacity-70 !cursor-wait' : ''}>
        {submitting ? 'Saving…' : submitLabel}
      </Button>
    </form>
  );
}
