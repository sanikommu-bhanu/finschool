import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineTruck, HiOutlineUserCircle } from 'react-icons/hi';
import { Screen } from '@/components/layout/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Fab } from '@/components/ui/Fab';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { VehicleForm } from './VehicleForm';
import { useVehicles, useCreateVehicle, useUpdateVehicle, useDeleteVehicle } from '@/hooks/useVehicles';
import { useDrivers } from '@/hooks/useDrivers';
import type { VehicleDoc, VehicleFormValues } from '@/schemas/vehicle.schema';

const statusStyle: Record<VehicleFormValues['status'], string> = {
  active: 'bg-emerald-500/15 text-emerald-600',
  maintenance: 'bg-amber-500/15 text-amber-600',
  inactive: 'bg-rose-500/15 text-rose-600',
};

export default function Vehicles() {
  const { data: vehicles = [], isLoading, isError } = useVehicles();
  const { data: drivers = [] } = useDrivers();
  const createMutation = useCreateVehicle();
  const updateMutation = useUpdateVehicle();
  const deleteMutation = useDeleteVehicle();

  const [search, setSearch] = useState('');
  const [sheetMode, setSheetMode] = useState<'closed' | 'add' | 'edit' | 'detail'>('closed');
  const [active, setActive] = useState<VehicleDoc | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const driverName = (id?: string) => drivers.find((d) => d.id === id)?.name || 'Unassigned';

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter((v) => v.name.toLowerCase().includes(q) || v.regNo.toLowerCase().includes(q));
  }, [vehicles, search]);

  const closeSheet = () => setSheetMode('closed');
  const openAdd = () => { setActive(null); setSheetMode('add'); };
  const openDetail = (v: VehicleDoc) => { setActive(v); setSheetMode('detail'); };
  const openEdit = (v: VehicleDoc) => { setActive(v); setSheetMode('edit'); };

  const handleCreate = (values: VehicleFormValues) => createMutation.mutate(values, { onSuccess: closeSheet });
  const handleUpdate = (values: VehicleFormValues) => {
    if (!active) return;
    updateMutation.mutate({ id: active.id, data: values }, { onSuccess: closeSheet });
  };
  const handleDelete = (id: string) => deleteMutation.mutate(id, { onSuccess: () => { setConfirmDeleteId(null); closeSheet(); } });

  return (
    <Screen>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-xl font-semibold">Vehicles</h1>
        <span className="text-xs font-semibold text-blush-700/60 dark:text-blush-200/50">{vehicles.length} total</span>
      </div>

      <div className="mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search name or reg. no." />
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-xl3" />
          <Skeleton className="h-20 w-full rounded-xl3" />
        </div>
      )}

      {isError && <EmptyState icon={HiOutlineTruck} title="Couldn't load vehicles" description="Check your connection and try again." />}

      {!isLoading && !isError && filtered.length === 0 && (
        <EmptyState
          icon={HiOutlineTruck}
          title={vehicles.length === 0 ? 'No vehicles yet' : 'No matches'}
          description={vehicles.length === 0 ? 'Tap the + button to add your first vehicle.' : 'Try a different search.'}
        />
      )}

      <div className="space-y-3">
        {filtered.map((v) => (
          <GlassCard key={v.id} padding="md" className="flex items-center gap-3" onClick={() => openDetail(v)}>
            <div className="w-12 h-12 rounded-xl2 bg-peach-200/70 flex items-center justify-center shrink-0">
              <HiOutlineTruck className="text-peach-700" size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm truncate">{v.name}</p>
              <p className="text-xs text-blush-700/50 dark:text-blush-200/40 truncate">{v.regNo} · {v.capacity} seats · {driverName(v.driverId)}</p>
            </div>
            <span className={clsx('text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0', statusStyle[v.status])}>
              {v.status === 'active' ? 'Active' : v.status === 'maintenance' ? 'Service' : 'Inactive'}
            </span>
          </GlassCard>
        ))}
      </div>

      <Fab icon={HiOutlinePlus} label="Add vehicle" onClick={openAdd} />

      <BottomSheet open={sheetMode === 'add'} onClose={closeSheet} title="Add vehicle">
        <VehicleForm drivers={drivers} submitLabel="Add vehicle" submitting={createMutation.isPending} onSubmit={handleCreate} />
      </BottomSheet>

      <BottomSheet open={sheetMode === 'edit'} onClose={closeSheet} title="Edit vehicle">
        {active && <VehicleForm defaultValues={active} drivers={drivers} submitLabel="Save changes" submitting={updateMutation.isPending} onSubmit={handleUpdate} />}
      </BottomSheet>

      <BottomSheet open={sheetMode === 'detail'} onClose={closeSheet} title={active?.name}>
        {active && (
          <div className="space-y-4">
            <GlassCard padding="sm" className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-blush-700/70 dark:text-blush-200/50"><HiOutlineTruck size={14} /> {active.regNo} · {active.capacity} seats</div>
              <div className="flex items-center gap-2 text-xs text-blush-700/70 dark:text-blush-200/50"><HiOutlineUserCircle size={14} /> Driver: {driverName(active.driverId)}</div>
            </GlassCard>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="glass" icon={<HiOutlinePencil size={16} />} onClick={() => openEdit(active)}>Edit</Button>
              <Button variant="outline" icon={<HiOutlineTrash size={16} />} className="!text-rose-600 !border-rose-400" onClick={() => setConfirmDeleteId(active.id)}>Delete</Button>
            </div>
          </div>
        )}
      </BottomSheet>

      <BottomSheet open={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)} title="Remove vehicle?">
        <p className="text-sm text-blush-700/70 dark:text-blush-200/50 mb-4">This permanently deletes the vehicle record from Firestore.</p>
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
