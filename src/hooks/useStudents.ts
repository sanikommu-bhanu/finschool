import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  createStudent,
  updateStudent,
  deleteStudent,
  subscribeStudents,
} from '@/services/students.service';
import type { StudentDoc, StudentFormValues } from '@/schemas/student.schema';

const STUDENTS_KEY = ['students'] as const;

/**
 * Live (onSnapshot-backed) student list. Converted from a one-shot react-query fetch
 * so Admin's student count, Accountant's pending-dues widgets, and anywhere else that
 * reads this hook update immediately when a student is created/linked elsewhere (e.g.
 * a Parent/Student redeeming a join code via onboarding.service.ts) — no manual refresh
 * or cache invalidation needed. The returned shape ({ data, isLoading, isError })
 * intentionally matches the old react-query result so no consumer needed to change.
 */
export function useStudents() {
  const [data, setData] = useState<StudentDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeStudents(
      (items) => {
        setData(items);
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

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: StudentFormValues) => createStudent(data),
    onSuccess: () => {
      toast.success('Student added');
      qc.invalidateQueries({ queryKey: STUDENTS_KEY });
    },
    onError: (err: Error) => toast.error(err.message || 'Could not add student'),
  });
}

export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StudentFormValues> }) =>
      updateStudent(id, data),
    onSuccess: () => {
      toast.success('Student updated');
      qc.invalidateQueries({ queryKey: STUDENTS_KEY });
    },
    onError: (err: Error) => toast.error(err.message || 'Could not update student'),
  });
}

export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteStudent(id),
    onSuccess: () => {
      toast.success('Student removed');
      qc.invalidateQueries({ queryKey: STUDENTS_KEY });
    },
    onError: (err: Error) => toast.error(err.message || 'Could not remove student'),
  });
}
