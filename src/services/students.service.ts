import { getMany, getById, create, update, remove, subscribe, COLLECTIONS } from '@/services/firestore';
import type { StudentDoc, StudentFormValues } from '@/schemas/student.schema';
import { getFeeTemplateForClass } from '@/services/feeTemplates.service';

/**
 * All reads/writes for the `students` collection go through here.
 * Kept thin on purpose — TanStack Query hooks (useStudents.ts) own caching,
 * loading/error state, and cache invalidation on mutations.
 */

export async function listStudents(): Promise<StudentDoc[]> {
  return getMany<StudentFormValues>(COLLECTIONS.students, {
    orderBy: [['name', 'asc']],
  }) as Promise<StudentDoc[]>;
}

/** Live subscription over every student — powers useStudents() so Admin/Accountant dashboards update without a manual refresh. */
export function subscribeStudents(
  cb: (students: StudentDoc[]) => void,
  onError?: (err: Error) => void
) {
  return subscribe<StudentFormValues>(
    COLLECTIONS.students,
    { orderBy: [['name', 'asc']] },
    cb as (items: (StudentFormValues & { id: string })[]) => void,
    onError
  );
}

/** Live subscription scoped to a teacher's classes — powers useMyClassStudents() on Teacher screens. */
export function subscribeStudentsByClasses(
  classNames: string[],
  cb: (students: StudentDoc[]) => void,
  onError?: (err: Error) => void
) {
  if (classNames.length === 0) {
    cb([]);
    return () => {};
  }
  return subscribe<StudentFormValues>(
    COLLECTIONS.students,
    { where: [['className', 'in', classNames.slice(0, 10)]], orderBy: [['name', 'asc']] },
    cb as (items: (StudentFormValues & { id: string })[]) => void,
    onError
  );
}

export async function getStudent(id: string): Promise<StudentDoc | null> {
  return getById<StudentFormValues>(COLLECTIONS.students, id) as Promise<StudentDoc | null>;
}

/**
 * Creates a student. If the Admin has a fee template for this class and the caller
 * didn't already set an explicit fee amount (feeDue left at the form default of 0),
 * the template's current total is auto-assigned — "Whenever a student joins Grade 8,
 * automatically assign this fee template. No manual fee creation." Callers that
 * already computed a specific feeDue (e.g. mid-year partial fees) are left alone,
 * so this never overrides a deliberate value.
 */
export async function createStudent(data: StudentFormValues): Promise<string> {
  let payload = data;
  if (!data.feeTemplateId && (!data.feeDue || data.feeDue === 0)) {
    const template = await getFeeTemplateForClass(data.className);
    if (template) {
      payload = {
        ...data,
        feeDue: template.totalAmount,
        feeStatus: template.totalAmount > 0 ? 'due' : data.feeStatus,
        feeTemplateId: template.id,
      };
    }
  }
  return create<StudentFormValues>(COLLECTIONS.students, payload);
}

export async function updateStudent(id: string, data: Partial<StudentFormValues>): Promise<void> {
  return update<StudentFormValues>(COLLECTIONS.students, id, data);
}

export async function deleteStudent(id: string): Promise<void> {
  return remove(COLLECTIONS.students, id);
}

/** Children belonging to the signed-in parent, matched by the guardian email set on each student record. */
export async function listChildrenByGuardianEmail(email: string): Promise<StudentDoc[]> {
  if (!email) return [];
  return getMany<StudentFormValues>(COLLECTIONS.students, {
    where: [['guardianEmail', '==', email]],
  }) as Promise<StudentDoc[]>;
}

/** All students across one or more classes — used by Teacher screens (attendance, assignments, fee reminders). */
export async function listStudentsByClasses(classNames: string[]): Promise<StudentDoc[]> {
  if (classNames.length === 0) return [];
  return getMany<StudentFormValues>(COLLECTIONS.students, {
    where: [['className', 'in', classNames.slice(0, 10)]],
    orderBy: [['name', 'asc']],
  }) as Promise<StudentDoc[]>;
}

/** The signed-in student's own record, matched by the student email set by admin. */
export async function getStudentByEmail(email: string): Promise<StudentDoc | null> {
  if (!email) return null;
  const results = await getMany<StudentFormValues>(COLLECTIONS.students, {
    where: [['studentEmail', '==', email]],
    limit: 1,
  }) as StudentDoc[];
  return results[0] ?? null;
}
