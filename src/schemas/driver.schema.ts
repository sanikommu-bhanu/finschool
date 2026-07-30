import { z } from 'zod';

export const driverSchema = z.object({
  name: z.string().trim().min(2, "Enter the driver's full name"),
  phone: z.string().trim().regex(/^[0-9+\-\s]{7,15}$/, 'Enter a valid phone number'),
  licenseNo: z.string().trim().min(3, 'Enter the license number'),
  experienceYears: z.coerce.number().int().min(0, 'Cannot be negative'),
  status: z.enum(['active', 'on_leave']),
  avatar: z.string().url().or(z.literal('')).optional(),
});

export type DriverFormValues = z.infer<typeof driverSchema>;

export interface DriverDoc extends DriverFormValues {
  id: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export const defaultDriverValues: DriverFormValues = {
  name: '',
  phone: '',
  licenseNo: '',
  experienceYears: 1,
  status: 'active',
  avatar: '',
};
