import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { listParents, createParent, updateParent, deleteParent } from '@/services/parents.service';
import type { ParentFormValues } from '@/schemas/parent.schema';

const KEY = ['parents'] as const;

export function useParents() {
  return useQuery({ queryKey: KEY, queryFn: listParents, staleTime: 30_000 });
}
export function useCreateParent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ParentFormValues) => createParent(data),
    onSuccess: () => { toast.success('Parent added'); qc.invalidateQueries({ queryKey: KEY }); },
    onError: (e: Error) => toast.error(e.message || 'Could not add parent'),
  });
}
export function useUpdateParent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ParentFormValues> }) => updateParent(id, data),
    onSuccess: () => { toast.success('Parent updated'); qc.invalidateQueries({ queryKey: KEY }); },
    onError: (e: Error) => toast.error(e.message || 'Could not update parent'),
  });
}
export function useDeleteParent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteParent(id),
    onSuccess: () => { toast.success('Parent removed'); qc.invalidateQueries({ queryKey: KEY }); },
    onError: (e: Error) => toast.error(e.message || 'Could not remove parent'),
  });
}
