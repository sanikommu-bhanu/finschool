import { arrayUnion, arrayRemove, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getMany, create, update, remove, COLLECTIONS } from '@/services/firestore';
import type { RouteDoc, RouteFormValues } from '@/schemas/route.schema';

export async function listRoutes(): Promise<RouteDoc[]> {
  return getMany<RouteFormValues>(COLLECTIONS.transportRoutes, { orderBy: [['name', 'asc']] }) as Promise<RouteDoc[]>;
}
export async function createRoute(data: RouteFormValues): Promise<string> {
  return create<Omit<RouteDoc, 'id'>>(COLLECTIONS.transportRoutes, { ...data, studentIds: [] });
}
export async function updateRoute(id: string, data: Partial<RouteFormValues>): Promise<void> {
  return update<RouteFormValues>(COLLECTIONS.transportRoutes, id, data);
}
export async function deleteRoute(id: string): Promise<void> {
  return remove(COLLECTIONS.transportRoutes, id);
}

/** Adds a student to a route's roster (used by the route-students assignment screen). */
export async function assignStudentToRoute(routeId: string, studentId: string): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.transportRoutes, routeId), { studentIds: arrayUnion(studentId) });
}

/** Removes a student from a route's roster. */
export async function unassignStudentFromRoute(routeId: string, studentId: string): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.transportRoutes, routeId), { studentIds: arrayRemove(studentId) });
}
