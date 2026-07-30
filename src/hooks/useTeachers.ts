import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { subscribeTeachers, createTeacher, updateTeacher, deleteTeacher } from '@/services/teachers.service';
import type { TeacherDoc, TeacherFormValues } from '@/schemas/teacher.schema';

const KEY = ['teachers'] as const;

export function useTeachers() {
  const [data, setData] = useState<TeacherDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeTeachers(
      (items) => {
        setData(items as TeacherDoc[]);
        setIsLoading(false);
        setIsError(false);
      },
      () => {
        setIsLoading(false);
        setIsError(true);
      }
    );
    return unsubscribe;
  }, []);

  return { data, isLoading, isError };
}
export function useCreateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TeacherFormValues) => createTeacher(data),
    onSuccess: () => { toast.success('Teacher added'); qc.invalidateQueries({ queryKey: KEY }); },
    onError: (e: Error) => toast.error(e.message || 'Could not add teacher'),
  });
}
export function useUpdateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TeacherFormValues> }) => updateTeacher(id, data),
    onSuccess: () => { toast.success('Teacher updated'); qc.invalidateQueries({ queryKey: KEY }); },
    onError: (e: Error) => toast.error(e.message || 'Could not update teacher'),
  });
}
export function useDeleteTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTeacher(id),
    onSuccess: () => { toast.success('Teacher removed'); qc.invalidateQueries({ queryKey: KEY }); },
    onError: (e: Error) => toast.error(e.message || 'Could not remove teacher'),
  });
}
