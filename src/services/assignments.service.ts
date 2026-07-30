import { getMany, create, remove, COLLECTIONS } from '@/services/firestore';
import type { AssignmentDoc, AssignmentFormValues } from '@/schemas/assignment.schema';
import { resolveClassIdByName } from '@/services/academicStructure.service';

export async function listAssignmentsForClasses(classNames: string[]): Promise<AssignmentDoc[]> {
  if (classNames.length === 0) return [];
  return getMany<AssignmentFormValues>(COLLECTIONS.assignments, {
    where: [['className', 'in', classNames.slice(0, 10)]],
    orderBy: [['dueDate', 'asc']],
  }) as Promise<AssignmentDoc[]>;
}

export async function listAssignmentsForClass(className: string): Promise<AssignmentDoc[]> {
  return getMany<AssignmentFormValues>(COLLECTIONS.assignments, {
    where: [['className', '==', className]],
    orderBy: [['dueDate', 'asc']],
  }) as Promise<AssignmentDoc[]>;
}

export async function createAssignment(data: AssignmentFormValues): Promise<string> {
  // Best-effort only — never blocks assignment creation if the lookup fails.
  const classId = await resolveClassIdByName(data.className);
  return create(COLLECTIONS.assignments, classId ? { ...data, classId } : data);
}

export async function deleteAssignment(id: string): Promise<void> {
  return remove(COLLECTIONS.assignments, id);
}
