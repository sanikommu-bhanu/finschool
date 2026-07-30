import { z } from 'zod';

export const vehicleSchema = z.object({
  name: z.string().trim().min(2, 'e.g. "Bus Route 1"'),
  regNo: z.string().trim().min(3, 'Enter the registration number'),
  capacity: z.coerce.number().int().positive('Enter seating capacity'),
  driverId: z.string().optional(),
  routeId: z.string().optional(),
  status: z.enum(['active', 'maintenance', 'inactive']),
  lastServiceDate: z.string().optional(),
  nextServiceDate: z.string().optional(),
});

export type VehicleFormValues = z.infer<typeof vehicleSchema>;

export interface VehicleDoc extends VehicleFormValues {
  id: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export const defaultVehicleValues: VehicleFormValues = {
  name: '',
  regNo: '',
  capacity: 40,
  driverId: '',
  routeId: '',
  status: 'active',
  lastServiceDate: '',
  nextServiceDate: '',
};

export const maintenanceLogSchema = z.object({
  vehicleId: z.string().min(1),
  vehicleName: z.string().min(1),
  note: z.string().trim().min(2, 'Describe the maintenance work'),
  cost: z.coerce.number().min(0, 'Cost cannot be negative'),
  date: z.string().min(1),
});

export type MaintenanceLogValues = z.infer<typeof maintenanceLogSchema>;

export interface MaintenanceLogDoc extends MaintenanceLogValues {
  id: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}
