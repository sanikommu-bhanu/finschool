import { getMany, create, update, remove, subscribe, COLLECTIONS } from '@/services/firestore';
import type { TeacherDoc, TeacherFormValues } from '@/schemas/teacher.schema';
import { ensureJoinCodesForTeacher } from '@/services/joinCodes.service';
import { resolveClassIdsByNames } from '@/services/academicStructure.service';

/** Best-effort { className: classId } map for a teacher's parsed classes — never
 * throws; returns an empty object if nothing resolves or the lookup fails. */
async function buildClassIdsMap(classesCsv: string): Promise<Record<string, string> | undefined> {
  const names = parseTeacherClasses(classesCsv);
  if (names.length === 0) return undefined;
  const map = await resolveClassIdsByNames(names);
  if (map.size === 0) return undefined;
  return Object.fromEntries(map);
}

export async function listTeachers(): Promise<TeacherDoc[]> {
  return getMany<TeacherFormValues>(COLLECTIONS.teachers, { orderBy: [['name', 'asc']] }) as Promise<TeacherDoc[]>;
}

export function subscribeTeachers(cb: (teachers: TeacherDoc[]) => void, onError?: (err: Error) => void) {
  return subscribe<TeacherFormValues>(
    COLLECTIONS.teachers,
    { orderBy: [['name', 'asc']] },
    cb as (items: (TeacherFormValues & { id: string })[]) => void,
    onError
  );
}

/**
 * Creates a teacher, then ensures a join code exists for each class they're assigned
 * ("For each assigned class: Generate a secure Join Code"). Code generation runs
 * after the teacher doc is written so the join-code docs can reference a real
 * teacherId; if it fails for any reason the teacher record itself still saves —
 * codes can always be (re)synced later via `ensureJoinCodesForTeacher`.
 */
export async function createTeacher(data: TeacherFormValues): Promise<string> {
  // Best-effort only — never blocks teacher creation if the lookup fails.
  const classIds = await buildClassIdsMap(data.classes);
  const payload = classIds ? { ...data, classIds } : data;
  const id = await create<TeacherFormValues>(COLLECTIONS.teachers, payload);
  try {
    await ensureJoinCodesForTeacher(id, data.name, data.email, data.classes);
  } catch {
    // Non-fatal — the teacher record is the source of truth; codes can be resynced.
  }
  return id;
}

/**
 * Updates a teacher, then re-syncs join codes so any newly-added class in
 * `data.classes` gets a code too. Existing codes for classes the teacher still
 * has are left untouched (see ensureJoinCodesForTeacher).
 */
export async function updateTeacher(id: string, data: Partial<TeacherFormValues>): Promise<void> {
  let payload: Partial<TeacherFormValues> = data;
  if (data.classes) {
    // Best-effort only — never blocks the update if the lookup fails.
    const classIds = await buildClassIdsMap(data.classes);
    if (classIds) payload = { ...data, classIds };
  }
  await update<TeacherFormValues>(COLLECTIONS.teachers, id, payload);
  if (data.classes) {
    try {
      await ensureJoinCodesForTeacher(id, data.name ?? '', data.email ?? '', data.classes);
    } catch {
      // Non-fatal — same reasoning as createTeacher.
    }
  }
}
export async function deleteTeacher(id: string): Promise<void> {
  return remove(COLLECTIONS.teachers, id);
}

/** The signed-in teacher's own record, matched by the email set by admin. */
export async function getTeacherByEmail(email: string): Promise<TeacherDoc | null> {
  if (!email) return null;
  const results = await getMany<TeacherFormValues>(COLLECTIONS.teachers, {
    where: [['email', '==', email]],
    limit: 1,
  }) as TeacherDoc[];
  return results[0] ?? null;
}

/** Parses the comma-separated `classes` field on a teacher doc into a clean array, e.g. "10A, 10B" -> ["10A","10B"]. */
export function parseTeacherClasses(classes: string): string[] {
  return classes
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
}
