import { useMemo, useState } from 'react';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlinePhone, HiOutlineMail, HiOutlineHome, HiOutlineUsers } from 'react-icons/hi';
import { Screen } from '@/components/layout/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Fab } from '@/components/ui/Fab';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ParentForm } from './ParentForm';
import { useParents, useCreateParent, useUpdateParent, useDeleteParent } from '@/hooks/useParents';
import type { ParentDoc, ParentFormValues } from '@/schemas/parent.schema';

export default function ParentList() {
  const { data: parents = [], isLoading, isError } = useParents();
  const createMutation = useCreateParent();
  const updateMutation = useUpdateParent();
  const deleteMutation = useDeleteParent();

  const [search, setSearch] = useState('');
  const [sheetMode, setSheetMode] = useState<'closed' | 'add' | 'edit' | 'detail'>('closed');
  const [active, setActive] = useState<ParentDoc | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return parents;
    return parents.filter((p) => p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || p.childrenNames.toLowerCase().includes(q));
  }, [parents, search]);

  const closeSheet = () => setSheetMode('closed');
  const openAdd = () => { setActive(null); setSheetMode('add'); };
  const openDetail = (p: ParentDoc) => { setActive(p); setSheetMode('detail'); };
  const openEdit = (p: ParentDoc) => { setActive(p); setSheetMode('edit'); };

  const handleCreate = (values: ParentFormValues) => createMutation.mutate(values, { onSuccess: closeSheet });
  const handleUpdate = (values: ParentFormValues) => {
    if (!active) return;
    updateMutation.mutate({ id: active.id, data: values }, { onSuccess: closeSheet });
  };
  const handleDelete = (id: string) => deleteMutation.mutate(id, { onSuccess: () => { setConfirmDeleteId(null); closeSheet(); } });

  return (
    <Screen>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-xl font-semibold">Parents</h1>
        <span className="text-xs font-semibold text-blush-700/60 dark:text-blush-200/50">{parents.length} total</span>
      </div>

      <div className="mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search name, email or child" />
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-xl3" />
          <Skeleton className="h-20 w-full rounded-xl3" />
        </div>
      )}

      {isError && <EmptyState icon={HiOutlineUsers} title="Couldn't load parents" description="Check your connection and try again." />}

      {!isLoading && !isError && filtered.length === 0 && (
        <EmptyState
          icon={HiOutlineUsers}
          title={parents.length === 0 ? 'No parents yet' : 'No matches'}
          description={parents.length === 0 ? 'Tap the + button to add your first parent.' : 'Try a different search.'}
        />
      )}

      <div className="space-y-3">
        {filtered.map((p) => (
          <GlassCard key={p.id} padding="md" className="flex items-center gap-3" onClick={() => openDetail(p)}>
            <img src={p.avatar || `https://i.pravatar.cc/150?u=${p.id}`} alt={p.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm truncate">{p.name}</p>
              <p className="text-xs text-blush-700/50 dark:text-blush-200/40 truncate">{p.childrenNames}</p>
            </div>
          </GlassCard>
        ))}
      </div>

      <Fab icon={HiOutlinePlus} label="Add parent" onClick={openAdd} />

      <BottomSheet open={sheetMode === 'add'} onClose={closeSheet} title="Add parent">
        <ParentForm submitLabel="Add parent" submitting={createMutation.isPending} onSubmit={handleCreate} />
      </BottomSheet>

      <BottomSheet open={sheetMode === 'edit'} onClose={closeSheet} title="Edit parent">
        {active && <ParentForm defaultValues={active} submitLabel="Save changes" submitting={updateMutation.isPending} onSubmit={handleUpdate} />}
      </BottomSheet>

      <BottomSheet open={sheetMode === 'detail'} onClose={closeSheet} title={active?.name}>
        {active && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src={active.avatar || `https://i.pravatar.cc/150?u=${active.id}`} alt={active.name} className="w-14 h-14 rounded-full object-cover" />
              <p className="font-semibold text-sm">{active.childrenNames}</p>
            </div>
            <GlassCard padding="sm" className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-blush-700/70 dark:text-blush-200/50"><HiOutlinePhone size={14} /> {active.phone}</div>
              <div className="flex items-center gap-2 text-xs text-blush-700/70 dark:text-blush-200/50"><HiOutlineMail size={14} /> {active.email}</div>
              {active.address && <div className="flex items-center gap-2 text-xs text-blush-700/70 dark:text-blush-200/50"><HiOutlineHome size={14} /> {active.address}</div>}
            </GlassCard>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="glass" icon={<HiOutlinePencil size={16} />} onClick={() => openEdit(active)}>Edit</Button>
              <Button variant="outline" icon={<HiOutlineTrash size={16} />} className="!text-rose-600 !border-rose-400" onClick={() => setConfirmDeleteId(active.id)}>Delete</Button>
            </div>
          </div>
        )}
      </BottomSheet>

      <BottomSheet open={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)} title="Remove parent?">
        <p className="text-sm text-blush-700/70 dark:text-blush-200/50 mb-4">This permanently deletes the parent record from Firestore.</p>
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
