import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  listVehicles, createVehicle, updateVehicle, deleteVehicle,
  listMaintenanceLogs, addMaintenanceLog, deleteMaintenanceLog,
} from '@/services/vehicles.service';
import type { VehicleFormValues, MaintenanceLogValues } from '@/schemas/vehicle.schema';

const KEY = ['vehicles'] as const;
const LOG_KEY = ['maintenanceLogs'] as const;

export function useVehicles() {
  return useQuery({ queryKey: KEY, queryFn: listVehicles, staleTime: 30_000 });
}
export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: VehicleFormValues) => createVehicle(data),
    onSuccess: () => { toast.success('Vehicle added'); qc.invalidateQueries({ queryKey: KEY }); },
    onError: (e: Error) => toast.error(e.message || 'Could not add vehicle'),
  });
}
export function useUpdateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VehicleFormValues> }) => updateVehicle(id, data),
    onSuccess: () => { toast.success('Vehicle updated'); qc.invalidateQueries({ queryKey: KEY }); },
    onError: (e: Error) => toast.error(e.message || 'Could not update vehicle'),
  });
}
export function useDeleteVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteVehicle(id),
    onSuccess: () => { toast.success('Vehicle removed'); qc.invalidateQueries({ queryKey: KEY }); },
    onError: (e: Error) => toast.error(e.message || 'Could not remove vehicle'),
  });
}

export function useMaintenanceLogs() {
  return useQuery({ queryKey: LOG_KEY, queryFn: listMaintenanceLogs, staleTime: 15_000 });
}
export function useAddMaintenanceLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: MaintenanceLogValues) => addMaintenanceLog(data),
    onSuccess: () => { toast.success('Maintenance log added'); qc.invalidateQueries({ queryKey: LOG_KEY }); },
    onError: (e: Error) => toast.error(e.message || 'Could not add log'),
  });
}
export function useDeleteMaintenanceLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMaintenanceLog(id),
    onSuccess: () => { toast.success('Log removed'); qc.invalidateQueries({ queryKey: LOG_KEY }); },
    onError: (e: Error) => toast.error(e.message || 'Could not remove log'),
  });
}
