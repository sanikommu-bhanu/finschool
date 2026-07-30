import { z } from 'zod';

export const assignmentSchema = z.object({
  className: z.string().min(1, 'Select a class'),
  subject: z.string().trim().min(1, 'Subject is required'),
  title: z.string().trim().min(2, 'Enter a title'),
  description: z.string().trim().min(2, 'Enter instructions for students'),
  dueDate: z.string().min(1, 'Pick a due date'),
  teacherName: z.string().min(1),
  // Optional — populated best-effort by createAssignment() via resolveClassIdByName().
  // Additive only; listAssignmentsForClass(es) still query on className, unchanged.
  classId: z.string().optional(),
});

export type AssignmentFormValues = z.infer<typeof assignmentSchema>;

export interface AssignmentDoc extends AssignmentFormValues {
  id: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export const defaultAssignmentValues: Omit<AssignmentFormValues, 'teacherName'> = {
  className: '',
  subject: '',
  title: '',
  description: '',
  dueDate: '',
};
