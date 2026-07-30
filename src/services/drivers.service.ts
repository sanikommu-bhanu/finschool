import { getMany, create, update, remove, COLLECTIONS } from '@/services/firestore';
import type { DriverDoc, DriverFormValues } from '@/schemas/driver.schema';

export async function listDrivers(): Promise<DriverDoc[]> {
  return getMany<DriverFormValues>(COLLECTIONS.drivers, { orderBy: [['name', 'asc']] }) as Promise<DriverDoc[]>;
}
export async function createDriver(data: DriverFormValues): Promise<string> {
  return create<DriverFormValues>(COLLECTIONS.drivers, data);
}
export async function updateDriver(id: string, data: Partial<DriverFormValues>): Promise<void> {
  return update<DriverFormValues>(COLLECTIONS.drivers, id, data);
}
export async function deleteDriver(id: string): Promise<void> {
  return remove(COLLECTIONS.drivers, id);
}
