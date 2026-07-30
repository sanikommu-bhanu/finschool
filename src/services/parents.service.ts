import { getMany, create, update, remove, COLLECTIONS } from '@/services/firestore';
import type { ParentDoc, ParentFormValues } from '@/schemas/parent.schema';

export async function listParents(): Promise<ParentDoc[]> {
  return getMany<ParentFormValues>(COLLECTIONS.parents, { orderBy: [['name', 'asc']] }) as Promise<ParentDoc[]>;
}
export async function createParent(data: ParentFormValues): Promise<string> {
  return create<ParentFormValues>(COLLECTIONS.parents, data);
}
export async function updateParent(id: string, data: Partial<ParentFormValues>): Promise<void> {
  return update<ParentFormValues>(COLLECTIONS.parents, id, data);
}
export async function deleteParent(id: string): Promise<void> {
  return remove(COLLECTIONS.parents, id);
}
