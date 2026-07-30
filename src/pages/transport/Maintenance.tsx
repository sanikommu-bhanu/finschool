import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineWrench, HiOutlineCurrencyRupee } from 'react-icons/hi2';
import { Screen } from '@/components/layout/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Fab } from '@/components/ui/Fab';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { maintenanceLogSchema, type MaintenanceLogValues } from '@/schemas/vehicle.schema';
import { useVehicles, useMaintenanceLogs, useAddMaintenanceLog, useDeleteMaintenanceLog } from '@/hooks/useVehicles';

const inputClass = 'glass-input w-full px-4 py-3 text-sm placeholder:text-blush-700/40 dark:placeholder:text-blush-200/30';
const labelClass = 'text-xs font-semibold text-blush-800/70 dark:text-blush-100/60 mb-1.5 block';
const errorClass = 'text-[11px] text-rose-600 mt-1';

function LogForm({ vehicles, submitting, onSubmit }: { vehicles: { id: string; name: string }[]; submitting?: boolean; onSubmit: (v: MaintenanceLogValues) => void }) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<MaintenanceLogValues>({
    resolver: zodResolver(maintenanceLogSchema),
    defaultValues: { vehicleId: vehicles[0]?.id ?? '', vehicleName: vehicles[0]?.name ?? '', note: '', cost: 0, date: new Date().toISOString().slice(0, 10) },
  });
  const vehicleId = watch('vehicleId');

  useEffect(() => {
    const v = vehicles.find((x) => x.id === vehicleId);
    if (v) setValue('vehicleName', v.name);
  }, [vehicleId, vehicles, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
      <div>
        <label className={labelClass}>Vehicle</label>
        <select {...register('vehicleId')} className={clsx(inputClass, 'appearance-none')}>
          {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
      </div>
      <div>
        <label className={labelClass}>Work done</label>
        <input {...register('note')} className={inputClass} placeholder="Brake pad replacement" />
        {errors.note && <p className={errorClass}>{errors.note.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Cost (₹)</label>
          <input type="number" {...register('cost')} className={inputClass} placeholder="2500" />
          {errors.cost && <p className={errorClass}>{errors.cost.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Date</label>
          <input type="date" {...register('date')} className={inputClass} />
        </div>
      </div>
      <Button type="submit" fullWidth size="lg" disabled={submitting} className={submitting ? '!opacity-70 !cursor-wait' : ''}>
        {submitting ? 'Saving…' : 'Add log'}
      </Button>
    </form>
  );
}

export default function Maintenance() {
  const { data: vehicles = [] } = useVehicles();
  const { data: logs = [], isLoading, isError } = useMaintenanceLogs();
  const addMutation = useAddMaintenanceLog();
  const deleteMutation = useDeleteMaintenanceLog();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const totalCost = useMemo(() => logs.reduce((sum, l) => sum + (l.cost || 0), 0), [logs]);

  const handleAdd = (values: MaintenanceLogValues) => addMutation.mutate(values, { onSuccess: () => setSheetOpen(false) });
  const handleDelete = (id: string) => deleteMutation.mutate(id, { onSuccess: () => setConfirmDeleteId(null) });

  return (
    <Screen>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-xl font-semibold">Maintenance</h1>
        <span className="text-xs font-semibold text-blush-700/60 dark:text-blush-200/50">₹{totalCost.toLocaleString('en-IN')} total spend</span>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-xl3" />
          <Skeleton className="h-16 w-full rounded-xl3" />
        </div>
      )}

      {isError && <EmptyState icon={HiOutlineWrench} title="Couldn't load logs" description="Check your connection and try again." />}

      {!isLoading && !isError && logs.length === 0 && (
        <EmptyState icon={HiOutlineWrench} title="No maintenance logs" description="Tap the + button to record your first service entry." />
      )}

      {!isLoading && vehicles.length === 0 && (
        <EmptyState icon={HiOutlineWrench} title="Add a vehicle first" description="You'll need at least one vehicle before logging maintenance." />
      )}

      <div className="space-y-2.5">
        {logs.map((l) => (
          <GlassCard key={l.id} padding="sm" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl2 bg-amber-200/60 flex items-center justify-center shrink-0">
              <HiOutlineWrench className="text-amber-700" size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{l.note}</p>
              <p className="text-xs text-blush-700/50 truncate">{l.vehicleName} · {l.date}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="flex items-center text-xs font-semibold text-blush-700"><HiOutlineCurrencyRupee size={12} />{l.cost.toLocaleString('en-IN')}</span>
              <button onClick={() => setConfirmDeleteId(l.id)} aria-label="Delete log" className="text-rose-500">
                <HiOutlineTrash size={16} />
              </button>
            </div>
          </GlassCard>
        ))}
      </div>

      {vehicles.length > 0 && <Fab icon={HiOutlinePlus} label="Add log" onClick={() => setSheetOpen(true)} />}

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Add maintenance log">
        <LogForm vehicles={vehicles.map((v) => ({ id: v.id, name: v.name }))} submitting={addMutation.isPending} onSubmit={handleAdd} />
      </BottomSheet>

      <BottomSheet open={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)} title="Remove log?">
        <p className="text-sm text-blush-700/70 dark:text-blush-200/50 mb-4">This permanently deletes the maintenance record.</p>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="glass" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
          <Button className="!bg-rose-600" disabled={deleteMutation.isPending} onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}>
            {deleteMutation.isPending ? 'Removing…' : 'Remove'}
          </Button>
        </div>
      </BottomSheet>
    </Screen>
  );
}
