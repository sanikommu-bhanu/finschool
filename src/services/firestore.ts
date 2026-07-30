import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as fsLimit,
  onSnapshot,
  serverTimestamp,
  type QueryConstraint,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Thin, typed wrapper around the Firestore modular SDK.
 * Every feature module (students, fees, teachers, transport, ...) should
 * go through these helpers instead of calling firebase/firestore directly —
 * keeps query shape, timestamps, and error handling consistent everywhere.
 */

export type OrderDirection = 'asc' | 'desc';

export interface QueryOptions {
  where?: [string, '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'in', unknown][];
  orderBy?: [string, OrderDirection?][];
  limit?: number;
}

function buildConstraints(opts?: QueryOptions): QueryConstraint[] {
  const constraints: QueryConstraint[] = [];
  if (!opts) return constraints;
  opts.where?.forEach(([field, op, value]) => constraints.push(where(field, op, value)));
  opts.orderBy?.forEach(([field, dir]) => constraints.push(orderBy(field, dir ?? 'asc')));
  if (opts.limit) constraints.push(fsLimit(opts.limit));
  return constraints;
}

export async function getById<T = DocumentData>(col: string, id: string): Promise<(T & { id: string }) | null> {
  const snap = await getDoc(doc(db, col, id));
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as T) }) : null;
}

export async function getMany<T = DocumentData>(col: string, opts?: QueryOptions): Promise<(T & { id: string })[]> {
  const q = query(collection(db, col), ...buildConstraints(opts));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) }));
}

export async function create<T extends object>(col: string, data: T): Promise<string> {
  const ref = await addDoc(collection(db, col), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function createWithId<T extends object>(col: string, id: string, data: T): Promise<void> {
  await setDoc(doc(db, col, id), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function update<T extends object>(col: string, id: string, data: Partial<T>): Promise<void> {
  await updateDoc(doc(db, col, id), { ...data, updatedAt: serverTimestamp() });
}

export async function remove(col: string, id: string): Promise<void> {
  await deleteDoc(doc(db, col, id));
}

/** Live subscription — used for dashboards/charts that should update without a manual refetch. */
export function subscribe<T = DocumentData>(
  col: string,
  opts: QueryOptions | undefined,
  cb: (items: (T & { id: string })[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(collection(db, col), ...buildConstraints(opts));
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) }))),
    onError
  );
}

// Collection name constants — single source of truth, avoids typos like 'Studnets'.
export const COLLECTIONS = {
  users: 'users',
  students: 'students',
  parents: 'parents',
  teachers: 'teachers',
  accountants: 'accountants',
  transport: 'transport',
  fees: 'fees',
  payments: 'payments',
  receipts: 'receipts',
  expenses: 'expenses',
  messages: 'messages',
  threads: 'threads',
  notifications: 'notifications',
  reports: 'reports',
  settings: 'settings',
  classes: 'classes',
  schoolProfile: 'schoolProfile',
  academicYears: 'academicYears',
  grades: 'grades',
  attendance: 'attendance',
  assignments: 'assignments',
  transportRoutes: 'transportRoutes',
  vehicles: 'vehicles',
  drivers: 'drivers',
  analytics: 'analytics',
  aiLogs: 'aiLogs',
  announcements: 'announcements',
  feeTemplates: 'feeTemplates',
  classJoinCodes: 'classJoinCodes',
} as const;
