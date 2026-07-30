import { z } from 'zod';

export const stopSchema = z.object({
  name: z.string().trim().min(1, 'Stop name is required'),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  time: z.string().optional(),
});

export type StopValues = z.infer<typeof stopSchema>;

export const routeSchema = z.object({
  name: z.string().trim().min(2, 'e.g. "Route 1 — Green Park"'),
  vehicleId: z.string().optional(),
  driverId: z.string().optional(),
  fare: z.coerce.number().min(0, 'Fare cannot be negative'),
  startTime: z.string().optional(),
  status: z.enum(['on_time', 'delayed', 'inactive']),
  stops: z.array(stopSchema).min(1, 'Add at least one stop'),
});

export type RouteFormValues = z.infer<typeof routeSchema>;

export interface RouteDoc extends RouteFormValues {
  id: string;
  studentIds?: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export const defaultRouteValues: RouteFormValues = {
  name: '',
  vehicleId: '',
  driverId: '',
  fare: 1500,
  startTime: '07:30',
  status: 'on_time',
  stops: [
    { name: 'School', lat: 28.6139, lng: 77.209, time: '07:30' },
    { name: 'Green Park', lat: 28.5588, lng: 77.2064, time: '07:50' },
  ],
};
