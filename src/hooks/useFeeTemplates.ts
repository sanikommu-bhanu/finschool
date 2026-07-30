import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  listFeeTemplates,
  createFeeTemplate,
  updateFeeTemplate,
  deleteFeeTemplate,
} from '@/services/feeTemplates.service';
import type { FeeTemplateFormValues } from '@/schemas/feeTemplate.schema';

const KEY = ['feeTemplates'] as const;

export function useFeeTemplates() {
  return useQuery({ queryKey: KEY, queryFn: listFeeTemplates, staleTime: 30_000 });
}

export function useCreateFeeTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FeeTemplateFormValues) => createFeeTemplate(data),
    onSuccess: () => {
      toast.success('Fee template created');
      qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (e: Error) => toast.error(e.message || 'Could not create fee template'),
  });
}

export function useUpdateFeeTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FeeTemplateFormValues> }) =>
      updateFeeTemplate(id, data),
    onSuccess: () => {
      toast.success('Fee template updated');
      qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (e: Error) => toast.error(e.message || 'Could not update fee template'),
  });
}

export function useDeleteFeeTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFeeTemplate(id),
    onSuccess: () => {
      toast.success('Fee template removed');
      qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (e: Error) => toast.error(e.message || 'Could not remove fee template'),
  });
}
