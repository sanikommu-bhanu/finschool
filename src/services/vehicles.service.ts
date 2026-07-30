import { getMany, create, update, remove, COLLECTIONS } from '@/services/firestore';
import type { VehicleDoc, VehicleFormValues, MaintenanceLogDoc, MaintenanceLogValues } from '@/schemas/vehicle.schema';

const MAINTENANCE_COL = 'maintenanceLogs';

export async function listVehicles(): Promise<VehicleDoc[]> {
  return getMany<VehicleFormValues>(COLLECTIONS.vehicles, { orderBy: [['name', 'asc']] }) as Promise<VehicleDoc[]>;
}
export async function createVehicle(data: VehicleFormValues): Promise<string> {
  return create<VehicleFormValues>(COLLECTIONS.vehicles, data);
}
export async function updateVehicle(id: string, data: Partial<VehicleFormValues>): Promise<void> {
  return update<VehicleFormValues>(COLLECTIONS.vehicles, id, data);
}
export async function deleteVehicle(id: string): Promise<void> {
  return remove(COLLECTIONS.vehicles, id);
}

export async function listMaintenanceLogs(): Promise<MaintenanceLogDoc[]> {
  return getMany<MaintenanceLogValues>(MAINTENANCE_COL, { orderBy: [['date', 'desc']], limit: 100 }) as Promise<MaintenanceLogDoc[]>;
}
export async function addMaintenanceLog(data: MaintenanceLogValues): Promise<string> {
  return create<MaintenanceLogValues>(MAINTENANCE_COL, data);
}
export async function deleteMaintenanceLog(id: string): Promise<void> {
  return remove(MAINTENANCE_COL, id);
}
