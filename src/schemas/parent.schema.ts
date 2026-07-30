import { z } from 'zod';

export const parentSchema = z.object({
  name: z.string().trim().min(2, "Enter the parent's full name"),
  email: z.string().trim().email('Enter a valid email'),
  phone: z.string().trim().regex(/^[0-9+\-\s]{7,15}$/, 'Enter a valid phone number'),
  address: z.string().trim().optional(),
  childrenNames: z.string().trim().min(1, 'e.g. "Aarav Sharma, Priya Sharma"'),
  avatar: z.string().url().or(z.literal('')).optional(),
});

export type ParentFormValues = z.infer<typeof parentSchema>;

export interface ParentDoc extends ParentFormValues {
  id: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export const defaultParentValues: ParentFormValues = {
  name: '',
  email: '',
  phone: '',
  address: '',
  childrenNames: '',
  avatar: '',
};
