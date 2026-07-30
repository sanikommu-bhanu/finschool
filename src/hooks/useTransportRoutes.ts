import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  listRoutes, createRoute, updateRoute, deleteRoute,
  assignStudentToRoute, unassignStudentFromRoute,
} from '@/services/transportRoutes.service';
import type { RouteFormValues } from '@/schemas/route.schema';

const KEY = ['transportRoutes'] as const;

export function useTransportRoutes() {
  return useQuery({ queryKey: KEY, queryFn: listRoutes, staleTime: 20_000 });
}
export function useCreateRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RouteFormValues) => createRoute(data),
    onSuccess: () => { toast.success('Route added'); qc.invalidateQueries({ queryKey: KEY }); },
    onError: (e: Error) => toast.error(e.message || 'Could not add route'),
  });
}
export function useUpdateRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RouteFormValues> }) => updateRoute(id, data),
    onSuccess: () => { toast.success('Route updated'); qc.invalidateQueries({ queryKey: KEY }); },
    onError: (e: Error) => toast.error(e.message || 'Could not update route'),
  });
}
export function useDeleteRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRoute(id),
    onSuccess: () => { toast.success('Route removed'); qc.invalidateQueries({ queryKey: KEY }); },
    onError: (e: Error) => toast.error(e.message || 'Could not remove route'),
  });
}
export function useAssignStudentToRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ routeId, studentId }: { routeId: string; studentId: string }) => assignStudentToRoute(routeId, studentId),
    onSuccess: () => { toast.success('Student assigned'); qc.invalidateQueries({ queryKey: KEY }); },
    onError: (e: Error) => toast.error(e.message || 'Could not assign student'),
  });
}
export function useUnassignStudentFromRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ routeId, studentId }: { routeId: string; studentId: string }) => unassignStudentFromRoute(routeId, studentId),
    onSuccess: () => { toast.success('Student removed from route'); qc.invalidateQueries({ queryKey: KEY }); },
    onError: (e: Error) => toast.error(e.message || 'Could not remove student'),
  });
}
