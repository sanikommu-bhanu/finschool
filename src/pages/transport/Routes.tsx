import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineMap, HiOutlineUserGroup, HiOutlineChevronRight } from 'react-icons/hi';
import { Screen } from '@/components/layout/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Fab } from '@/components/ui/Fab';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { RouteForm } from './RouteForm';
import { RouteMap } from './RouteMap';
import { useTransportRoutes, useCreateRoute, useUpdateRoute, useDeleteRoute } from '@/hooks/useTransportRoutes';
import { useDrivers } from '@/hooks/useDrivers';
import { useVehicles } from '@/hooks/useVehicles';
import type { RouteDoc, RouteFormValues } from '@/schemas/route.schema';

const statusStyle: Record<RouteFormValues['status'], string> = {
  on_time: 'bg-emerald-500/15 text-emerald-600',
  delayed: 'bg-amber-500/15 text-amber-600',
  inactive: 'bg-rose-500/15 text-rose-600',
};
const statusLabel: Record<RouteFormValues['status'], string> = {
  on_time: 'On time',
  delayed: 'Delayed',
  inactive: 'Inactive',
};

export default function Routes() {
  const navigate = useNavigate();
  const { data: routes = [], isLoading, isError } = useTransportRoutes();
  const { data: drivers = [] } = useDrivers();
  const { data: vehicles = [] } = useVehicles();
  const createMutation = useCreateRoute();
  const updateMutation = useUpdateRoute();
  const deleteMutation = useDeleteRoute();

  const [search, setSearch] = useState('');
  const [sheetMode, setSheetMode] = useState<'closed' | 'add' | 'edit' | 'detail'>('closed');
  const [active, setActive] = useState<RouteDoc | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const vehicleName = (id?: string) => vehicles.find((v) => v.id === id)?.name || 'Unassigned';
  const driverName = (id?: string) => drivers.find((d) => d.id === id)?.name || 'Unassigned';

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return routes;
    return routes.filter((r) => r.name.toLowerCase().includes(q));
  }, [routes, search]);

  const closeSheet = () => setSheetMode('closed');
  const openAdd = () => { setActive(null); setSheetMode('add'); };
  const openDetail = (r: RouteDoc) => { setActive(r); setSheetMode('detail'); };
  const openEdit = (r: RouteDoc) => { setActive(r); setSheetMode('edit'); };

  const handleCreate = (values: RouteFormValues) => createMutation.mutate(values, { onSuccess: closeSheet });
  const handleUpdate = (values: RouteFormValues) => {
    if (!active) return;
    updateMutation.mutate({ id: active.id, data: values }, { onSuccess: closeSheet });
  };
  const handleDelete = (id: string) => deleteMutation.mutate(id, { onSuccess: () => { setConfirmDeleteId(null); closeSheet(); } });

  return (
    <Screen>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-xl font-semibold">Routes</h1>
        <span className="text-xs font-semibold text-blush-700/60 dark:text-blush-200/50">{routes.length} total</span>
      </div>

      <div className="mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search route name" />
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-xl3" />
          <Skeleton className="h-20 w-full rounded-xl3" />
        </div>
      )}

      {isError && <EmptyState icon={HiOutlineMap} title="Couldn't load routes" description="Check your connection and try again." />}

      {!isLoading && !isError && filtered.length === 0 && (
        <EmptyState
          icon={HiOutlineMap}
          title={routes.length === 0 ? 'No routes yet' : 'No matches'}
          description={routes.length === 0 ? 'Tap the + button to create your first route.' : 'Try a different search.'}
        />
      )}

      <div className="space-y-3">
        {filtered.map((r) => (
          <GlassCard key={r.id} padding="md" onClick={() => openDetail(r)}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl2 bg-blush-200/70 flex items-center justify-center shrink-0">
                <HiOutlineMap className="text-blush-700" size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm truncate">{r.name}</p>
                <p className="text-xs text-blush-700/50 dark:text-blush-200/40 truncate">
                  {r.stops.length} stops · {vehicleName(r.vehicleId)} · {driverName(r.driverId)}
                </p>
              </div>
              <span className={clsx('text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0', statusStyle[r.status])}>
                {statusLabel[r.status]}
              </span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`route-students/${r.id}`); }}
              className="mt-3 w-full flex items-center justify-between text-xs font-semibold text-blush-600 glass-input px-3 py-2"
            >
              <span className="flex items-center gap-1.5"><HiOutlineUserGroup size={14} /> {r.studentIds?.length ?? 0} students assigned</span>
              <HiOutlineChevronRight size={14} />
            </button>
          </GlassCard>
        ))}
      </div>

      <Fab icon={HiOutlinePlus} label="Add route" onClick={openAdd} />

      <BottomSheet open={sheetMode === 'add'} onClose={closeSheet} title="Add route">
        <RouteForm drivers={drivers} vehicles={vehicles} submitLabel="Add route" submitting={createMutation.isPending} onSubmit={handleCreate} />
      </BottomSheet>

      <BottomSheet open={sheetMode === 'edit'} onClose={closeSheet} title="Edit route">
        {active && <RouteForm defaultValues={active} drivers={drivers} vehicles={vehicles} submitLabel="Save changes" submitting={updateMutation.isPending} onSubmit={handleUpdate} />}
      </BottomSheet>

      <BottomSheet open={sheetMode === 'detail'} onClose={closeSheet} title={active?.name}>
        {active && (
          <div className="space-y-4">
            <RouteMap stops={active.stops} />
            <GlassCard padding="sm" className="space-y-2">
              <div className="text-xs text-blush-700/70 dark:text-blush-200/50">Vehicle: {vehicleName(active.vehicleId)}</div>
              <div className="text-xs text-blush-700/70 dark:text-blush-200/50">Driver: {driverName(active.driverId)}</div>
              <div className="text-xs text-blush-700/70 dark:text-blush-200/50">Fare: ₹{active.fare}/month · Starts {active.startTime || '—'}</div>
            </GlassCard>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="glass" icon={<HiOutlinePencil size={16} />} onClick={() => openEdit(active)}>Edit</Button>
              <Button variant="outline" icon={<HiOutlineTrash size={16} />} className="!text-rose-600 !border-rose-400" onClick={() => setConfirmDeleteId(active.id)}>Delete</Button>
            </div>
          </div>
        )}
      </BottomSheet>

      <BottomSheet open={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)} title="Remove route?">
        <p className="text-sm text-blush-700/70 dark:text-blush-200/50 mb-4">This permanently deletes the route from Firestore.</p>
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
