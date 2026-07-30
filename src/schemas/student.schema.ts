import { z } from 'zod';

/** Firestore doc shape for the `students` collection. */
export const studentSchema = z.object({
  name: z.string().trim().min(2, 'Enter the student\'s full name'),
  className: z.string().min(1, 'Select a class'),
  rollNo: z.string().trim().min(1, 'Roll number is required'),
  guardian: z.string().trim().min(2, 'Guardian name is required'),
  guardianPhone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{7,15}$/, 'Enter a valid phone number'),
  guardianEmail: z.string().trim().email('Enter a valid email').or(z.literal('')).optional(),
  studentEmail: z.string().trim().email('Enter a valid email').or(z.literal('')).optional(),
  feeDue: z.coerce.number().min(0, 'Fee due cannot be negative'),
  feeStatus: z.enum(['paid', 'due', 'overdue']),
  attendance: z.coerce.number().min(0).max(100),
  avatar: z.string().url().or(z.literal('')).optional(),
  // Optional — populated automatically when a fee template exists for `className`
  // (see services/students.service.ts `createStudent`) or when a student is
  // registered via a teacher's join code (services/joinCodes.service.ts). Existing
  // forms that don't set these keep working unchanged since both are optional.
  feeTemplateId: z.string().optional(),
  teacherId: z.string().optional(),
  joinCodeId: z.string().optional(),
});

export type StudentFormValues = z.infer<typeof studentSchema>;

export interface StudentDoc extends StudentFormValues {
  id: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export const CLASS_OPTIONS = [
  'Nursery', 'LKG', 'UKG',
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11', 'Class 12',
];

export const defaultStudentValues: StudentFormValues = {
  name: '',
  className: CLASS_OPTIONS[3],
  rollNo: '',
  guardian: '',
  guardianPhone: '',
  guardianEmail: '',
  studentEmail: '',
  feeDue: 0,
  feeStatus: 'paid',
  attendance: 100,
  avatar: '',
};
