import { z } from 'zod';

export const teacherSchema = z.object({
  name: z.string().trim().min(2, "Enter the teacher's full name"),
  subject: z.string().trim().min(1, 'Subject is required'),
  classes: z.string().trim().min(1, 'e.g. "10A, 10B"'),
  phone: z.string().trim().regex(/^[0-9+\-\s]{7,15}$/, 'Enter a valid phone number'),
  email: z.string().trim().email('Enter a valid email'),
  status: z.enum(['active', 'on_leave']),
  avatar: z.string().url().or(z.literal('')).optional(),
  // Optional — a { className: classId } map for whichever of this teacher's
  // comma-separated `classes` currently resolve to a real Class (section) doc.
  // Populated best-effort by createTeacher()/updateTeacher() via
  // resolveClassIdsByNames(). `classes` (the free-text CSV string) remains the
  // source of truth every existing screen reads/writes — this is purely additive,
  // same convention as the single-className classId fields added in increment 5.
  classIds: z.record(z.string(), z.string()).optional(),
});

export type TeacherFormValues = z.infer<typeof teacherSchema>;

export interface TeacherDoc extends TeacherFormValues {
  id: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export const defaultTeacherValues: TeacherFormValues = {
  name: '',
  subject: '',
  classes: '',
  phone: '',
  email: '',
  status: 'active',
  avatar: '',
};
