import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { listDrivers, createDriver, updateDriver, deleteDriver } from '@/services/drivers.service';
import type { DriverFormValues } from '@/schemas/driver.schema';

const KEY = ['drivers'] as const;

export function useDrivers() {
  return useQuery({ queryKey: KEY, queryFn: listDrivers, staleTime: 30_000 });
}
export function useCreateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: DriverFormValues) => createDriver(data),
    onSuccess: () => { toast.success('Driver added'); qc.invalidateQueries({ queryKey: KEY }); },
    onError: (e: Error) => toast.error(e.message || 'Could not add driver'),
  });
}
export function useUpdateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DriverFormValues> }) => updateDriver(id, data),
    onSuccess: () => { toast.success('Driver updated'); qc.invalidateQueries({ queryKey: KEY }); },
    onError: (e: Error) => toast.error(e.message || 'Could not update driver'),
  });
}
export function useDeleteDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDriver(id),
    onSuccess: () => { toast.success('Driver removed'); qc.invalidateQueries({ queryKey: KEY }); },
    onError: (e: Error) => toast.error(e.message || 'Could not remove driver'),
  });
}
