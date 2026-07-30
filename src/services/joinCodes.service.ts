import {
  getById,
  getMany,
  createWithId,
  update,
  subscribe,
  COLLECTIONS,
} from '@/services/firestore';
import type { ClassJoinCodeDoc, ClassJoinCodeFormValues, JoinCodeRedemption } from '@/schemas/joinCode.schema';
import { resolveClassIdByName } from '@/services/academicStructure.service';

/**
 * Class join codes — the "Students and parents join using this code" system.
 *
 * One doc per (teacherId, className) pair, keyed by a deterministic id so a
 * teacher can never accumulate duplicate codes for a class they already have
 * one for (the spec: "Teacher cannot create duplicate classes that already exist").
 */

// Excludes 0/O/1/I to avoid codes that are ambiguous to read aloud or copy by hand.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode(length = 6): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function joinCodeDocId(teacherId: string, className: string): string {
  return `${teacherId}__${slugify(className)}`;
}

/** Parses a teacher's comma-separated `classes` field, same convention as teachers.service.ts. */
function parseClasses(classes: string): string[] {
  return classes.split(',').map((c) => c.trim()).filter(Boolean);
}

/**
 * Ensures a join code exists for every class currently assigned to a teacher.
 * Safe to call every time a teacher doc is created/updated — existing codes for
 * classes the teacher still has are left untouched; codes are only ever created
 * for classes that don't have one yet.
 */
export async function ensureJoinCodesForTeacher(
  teacherId: string,
  teacherName: string,
  teacherEmail: string,
  classesCsv: string
): Promise<ClassJoinCodeDoc[]> {
  const classNames = parseClasses(classesCsv);
  const results: ClassJoinCodeDoc[] = [];

  for (const className of classNames) {
    const id = joinCodeDocId(teacherId, className);
    const existing = await getById<ClassJoinCodeFormValues>(COLLECTIONS.classJoinCodes, id);
    if (existing) {
      results.push(existing as ClassJoinCodeDoc);
      continue;
    }
    // Best-effort only — resolveClassIdByName() never throws, so a lookup failure
    // (offline, no classes defined yet, etc.) simply leaves classId unset rather
    // than blocking join-code creation.
    const classId = await resolveClassIdByName(className);
    const data: ClassJoinCodeFormValues = {
      code: generateCode(),
      className,
      teacherId,
      teacherName,
      teacherEmail,
      active: true,
      ...(classId ? { classId } : {}),
    };
    await createWithId<ClassJoinCodeFormValues>(COLLECTIONS.classJoinCodes, id, data);
    results.push({ id, ...data });
  }

  return results;
}

export function subscribeJoinCodesForTeacher(
  teacherId: string,
  cb: (codes: ClassJoinCodeDoc[]) => void,
  onError?: (err: Error) => void
) {
  return subscribe<ClassJoinCodeFormValues>(
    COLLECTIONS.classJoinCodes,
    { where: [['teacherId', '==', teacherId]], orderBy: [['className', 'asc']] },
    cb as (items: (ClassJoinCodeFormValues & { id: string })[]) => void,
    onError
  );
}

export async function listJoinCodesForTeacher(teacherId: string): Promise<ClassJoinCodeDoc[]> {
  return getMany<ClassJoinCodeFormValues>(COLLECTIONS.classJoinCodes, {
    where: [['teacherId', '==', teacherId]],
    orderBy: [['className', 'asc']],
  }) as Promise<ClassJoinCodeDoc[]>;
}

/** Regenerates the code for one class (the "Refresh Code" action), invalidating the old one. */
export async function refreshJoinCode(id: string): Promise<string> {
  const newCode = generateCode();
  await update<ClassJoinCodeFormValues>(COLLECTIONS.classJoinCodes, id, { code: newCode });
  return newCode;
}

/**
 * Validates a join code entered by a parent or student and resolves it to the
 * class + teacher it belongs to. Returns null for an unknown or deactivated code
 * rather than throwing, so the calling form can show a plain "invalid code" message.
 */
export async function validateJoinCode(rawCode: string): Promise<JoinCodeRedemption | null> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return null;
  const results = (await getMany<ClassJoinCodeFormValues>(COLLECTIONS.classJoinCodes, {
    where: [['code', '==', code]],
    limit: 1,
  })) as ClassJoinCodeDoc[];
  const match = results[0];
  if (!match || !match.active) return null;
  return {
    joinCodeId: match.id,
    className: match.className,
    teacherId: match.teacherId,
    teacherName: match.teacherName,
    teacherEmail: match.teacherEmail,
  };
}
