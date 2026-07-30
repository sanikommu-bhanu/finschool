import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlinePhone, HiOutlineIdentification, HiOutlineUserGroup } from 'react-icons/hi';
import { Screen } from '@/components/layout/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Fab } from '@/components/ui/Fab';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { DriverForm } from './DriverForm';
import { useDrivers, useCreateDriver, useUpdateDriver, useDeleteDriver } from '@/hooks/useDrivers';
import type { DriverDoc, DriverFormValues } from '@/schemas/driver.schema';

export default function Drivers() {
  const { data: drivers = [], isLoading, isError } = useDrivers();
  const createMutation = useCreateDriver();
  const updateMutation = useUpdateDriver();
  const deleteMutation = useDeleteDriver();

  const [search, setSearch] = useState('');
  const [sheetMode, setSheetMode] = useState<'closed' | 'add' | 'edit' | 'detail'>('closed');
  const [active, setActive] = useState<DriverDoc | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return drivers;
    return drivers.filter((d) => d.name.toLowerCase().includes(q) || d.licenseNo.toLowerCase().includes(q));
  }, [drivers, search]);

  const closeSheet = () => setSheetMode('closed');
  const openAdd = () => { setActive(null); setSheetMode('add'); };
  const openDetail = (d: DriverDoc) => { setActive(d); setSheetMode('detail'); };
  const openEdit = (d: DriverDoc) => { setActive(d); setSheetMode('edit'); };

  const handleCreate = (values: DriverFormValues) => createMutation.mutate(values, { onSuccess: closeSheet });
  const handleUpdate = (values: DriverFormValues) => {
    if (!active) return;
    updateMutation.mutate({ id: active.id, data: values }, { onSuccess: closeSheet });
  };
  const handleDelete = (id: string) => deleteMutation.mutate(id, { onSuccess: () => { setConfirmDeleteId(null); closeSheet(); } });

  return (
    <Screen>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-xl font-semibold">Drivers</h1>
        <span className="text-xs font-semibold text-blush-700/60 dark:text-blush-200/50">{drivers.length} total</span>
      </div>

      <div className="mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search name or license no." />
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-xl3" />
          <Skeleton className="h-20 w-full rounded-xl3" />
        </div>
      )}

      {isError && <EmptyState icon={HiOutlineUserGroup} title="Couldn't load drivers" description="Check your connection and try again." />}

      {!isLoading && !isError && filtered.length === 0 && (
        <EmptyState
          icon={HiOutlineUserGroup}
          title={drivers.length === 0 ? 'No drivers yet' : 'No matches'}
          description={drivers.length === 0 ? 'Tap the + button to add your first driver.' : 'Try a different search.'}
        />
      )}

      <div className="space-y-3">
        {filtered.map((d) => (
          <GlassCard key={d.id} padding="md" className="flex items-center gap-3" onClick={() => openDetail(d)}>
            <img src={d.avatar || `https://i.pravatar.cc/150?u=${d.id}`} alt={d.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm truncate">{d.name}</p>
              <p className="text-xs text-blush-700/50 dark:text-blush-200/40 truncate">{d.licenseNo} · {d.experienceYears} yrs exp.</p>
            </div>
            <span className={clsx('text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0', d.status === 'active' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/15 text-amber-600')}>
              {d.status === 'active' ? 'Active' : 'On leave'}
            </span>
          </GlassCard>
        ))}
      </div>

      <Fab icon={HiOutlinePlus} label="Add driver" onClick={openAdd} />

      <BottomSheet open={sheetMode === 'add'} onClose={closeSheet} title="Add driver">
        <DriverForm submitLabel="Add driver" submitting={createMutation.isPending} onSubmit={handleCreate} />
      </BottomSheet>

      <BottomSheet open={sheetMode === 'edit'} onClose={closeSheet} title="Edit driver">
        {active && <DriverForm defaultValues={active} submitLabel="Save changes" submitting={updateMutation.isPending} onSubmit={handleUpdate} />}
      </BottomSheet>

      <BottomSheet open={sheetMode === 'detail'} onClose={closeSheet} title={active?.name}>
        {active && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src={active.avatar || `https://i.pravatar.cc/150?u=${active.id}`} alt={active.name} className="w-14 h-14 rounded-full object-cover" />
              <div>
                <p className="font-semibold text-sm">{active.experienceYears} years experience</p>
                <p className="text-xs text-blush-700/50">{active.licenseNo}</p>
              </div>
            </div>
            <GlassCard padding="sm" className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-blush-700/70 dark:text-blush-200/50"><HiOutlinePhone size={14} /> {active.phone}</div>
              <div className="flex items-center gap-2 text-xs text-blush-700/70 dark:text-blush-200/50"><HiOutlineIdentification size={14} /> {active.licenseNo}</div>
            </GlassCard>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="glass" icon={<HiOutlinePencil size={16} />} onClick={() => openEdit(active)}>Edit</Button>
              <Button variant="outline" icon={<HiOutlineTrash size={16} />} className="!text-rose-600 !border-rose-400" onClick={() => setConfirmDeleteId(active.id)}>Delete</Button>
            </div>
          </div>
        )}
      </BottomSheet>

      <BottomSheet open={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)} title="Remove driver?">
        <p className="text-sm text-blush-700/70 dark:text-blush-200/50 mb-4">This permanently deletes the driver record from Firestore.</p>
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
