import { z } from 'zod';

export const roleSchema = z.enum(['admin', 'accountant', 'teacher', 'parent', 'student', 'transport']);

export const appUserSchema = z.object({
  uid: z.string().min(1),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  avatar: z.string().url().or(z.literal('')),
  role: roleSchema.nullable(),
});

export type AppUser = z.infer<typeof appUserSchema>;
