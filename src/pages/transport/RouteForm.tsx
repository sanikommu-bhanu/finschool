import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import { Button } from '@/components/ui/Button';
import { routeSchema, defaultRouteValues, type RouteFormValues } from '@/schemas/route.schema';
import type { DriverDoc } from '@/schemas/driver.schema';
import type { VehicleDoc } from '@/schemas/vehicle.schema';

interface Props {
  defaultValues?: RouteFormValues;
  drivers: DriverDoc[];
  vehicles: VehicleDoc[];
  submitting?: boolean;
  submitLabel: string;
  onSubmit: (values: RouteFormValues) => void;
}

const inputClass = 'glass-input w-full px-4 py-3 text-sm placeholder:text-blush-700/40 dark:placeholder:text-blush-200/30';
const labelClass = 'text-xs font-semibold text-blush-800/70 dark:text-blush-100/60 mb-1.5 block';
const errorClass = 'text-[11px] text-rose-600 mt-1';

export function RouteForm({ defaultValues, drivers, vehicles, submitting, submitLabel, onSubmit }: Props) {
  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<RouteFormValues>({
    resolver: zodResolver(routeSchema),
    defaultValues: defaultValues ?? defaultRouteValues,
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'stops' });

  useEffect(() => { reset(defaultValues ?? defaultRouteValues); }, [defaultValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
      <div>
        <label className={labelClass}>Route name</label>
        <input {...register('name')} className={inputClass} placeholder="Route 1 — Green Park" />
        {errors.name && <p className={errorClass}>{errors.name.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Vehicle</label>
          <select {...register('vehicleId')} className={clsx(inputClass, 'appearance-none')}>
            <option value="">Unassigned</option>
            {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Driver</label>
          <select {...register('driverId')} className={clsx(inputClass, 'appearance-none')}>
            <option value="">Unassigned</option>
            {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Monthly fare (₹)</label>
          <input type="number" {...register('fare')} className={inputClass} placeholder="1500" />
          {errors.fare && <p className={errorClass}>{errors.fare.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Start time</label>
          <input type="time" {...register('startTime')} className={inputClass} />
        </div>
      </div>
      <div>
        <label className={labelClass}>Status</label>
        <select {...register('status')} className={clsx(inputClass, 'appearance-none')}>
          <option value="on_time">On time</option>
          <option value="delayed">Delayed</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={clsx(labelClass, 'mb-0')}>Stops</label>
          <button
            type="button"
            onClick={() => append({ name: '', lat: 28.6139, lng: 77.209, time: '' })}
            className="flex items-center gap-1 text-xs font-semibold text-blush-600"
          >
            <HiOutlinePlus size={14} /> Add stop
          </button>
        </div>
        {errors.stops?.root && <p className={errorClass}>{errors.stops.root.message}</p>}
        <div className="space-y-2.5">
          {fields.map((field, i) => (
            <div key={field.id} className="glass-input p-3 space-y-2">
              <div className="flex items-center gap-2">
                <input {...register(`stops.${i}.name`)} className={clsx(inputClass, 'flex-1')} placeholder={`Stop ${i + 1} name`} />
                <button type="button" onClick={() => remove(i)} aria-label="Remove stop" className="text-rose-500 shrink-0">
                  <HiOutlineTrash size={18} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input type="number" step="any" {...register(`stops.${i}.lat`)} className={inputClass} placeholder="Lat" />
                <input type="number" step="any" {...register(`stops.${i}.lng`)} className={inputClass} placeholder="Lng" />
                <input {...register(`stops.${i}.time`)} className={inputClass} placeholder="Time" />
              </div>
              {errors.stops?.[i]?.name && <p className={errorClass}>{errors.stops[i]?.name?.message}</p>}
            </div>
          ))}
        </div>
      </div>

      <Button type="submit" fullWidth size="lg" disabled={submitting} className={submitting ? '!opacity-70 !cursor-wait' : ''}>
        {submitting ? 'Saving…' : submitLabel}
      </Button>
    </form>
  );
}
