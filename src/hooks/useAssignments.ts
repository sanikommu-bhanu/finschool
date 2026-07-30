import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  listAssignmentsForClasses,
  listAssignmentsForClass,
  createAssignment,
  deleteAssignment,
} from '@/services/assignments.service';
import { listStudentsForCollection } from '@/services/payments.service';
import { createNotificationsForMany } from '@/services/notifications.service';
import type { AssignmentFormValues } from '@/schemas/assignment.schema';

export function useAssignmentsForClasses(classNames: string[]) {
  return useQuery({
    queryKey: ['assignments', 'classes', classNames],
    queryFn: () => listAssignmentsForClasses(classNames),
    enabled: classNames.length > 0,
    staleTime: 20_000,
  });
}

export function useAssignmentsForClass(className: string) {
  return useQuery({
    queryKey: ['assignments', 'class', className],
    queryFn: () => listAssignmentsForClass(className),
    enabled: !!className,
    staleTime: 20_000,
  });
}

export function useCreateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: AssignmentFormValues) => {
      const id = await createAssignment(data);
      try {
        const students = await listStudentsForCollection();
        const emails = students
          .filter(s => s.className === data.className)
          .flatMap(s => [s.studentEmail, s.guardianEmail])
          .filter((e): e is string => !!e);
        if (emails.length > 0) {
          await createNotificationsForMany(emails, {
            title: `New Assignment: ${data.title}`,
            description: `Due ${data.dueDate}`,
            type: 'assignment'
          });
        }
      } catch (err) {
        console.error('Failed to notify students:', err);
      }
      return id;
    },
    onSuccess: () => {
      toast.success('Assignment posted and students notified');
      qc.invalidateQueries({ queryKey: ['assignments'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Could not post assignment'),
  });
}

export function useDeleteAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAssignment(id),
    onSuccess: () => {
      toast.success('Assignment removed');
      qc.invalidateQueries({ queryKey: ['assignments'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Could not remove assignment'),
  });
}
