import {
  getMany,
  getById,
  create,
  update,
  remove,
  subscribe,
  createWithId,
  COLLECTIONS,
} from '@/services/firestore';
import {
  SCHOOL_PROFILE_DOC_ID,
  type SchoolProfileDoc,
  type SchoolProfileFormValues,
  type AcademicYearDoc,
  type AcademicYearFormValues,
  type GradeDoc,
  type GradeFormValues,
  type ClassSectionDoc,
  type ClassSectionFormValues,
} from '@/schemas/academicStructure.schema';

/**
 * All reads/writes for the new academic-structure entities: School profile
 * (singleton), Academic Years, Grades, and Classes (sections — stored in the
 * already-reserved `classes` collection). Same thin-wrapper pattern as every other
 * service in this app (see feeTemplates.service.ts) — nothing here talks to
 * firebase/firestore directly.
 */

// ---- School profile (singleton doc) ------------------------------------------------

export async function getSchoolProfile(): Promise<SchoolProfileDoc | null> {
  return getById<SchoolProfileFormValues>(COLLECTIONS.schoolProfile, SCHOOL_PROFILE_DOC_ID) as Promise<
    SchoolProfileDoc | null
  >;
}

/** Upsert — creates the singleton doc on first save, updates it on every save after. */
export async function saveSchoolProfile(data: SchoolProfileFormValues): Promise<void> {
  const existing = await getSchoolProfile();
  if (existing) {
    await update<SchoolProfileFormValues>(COLLECTIONS.schoolProfile, SCHOOL_PROFILE_DOC_ID, data);
  } else {
    await createWithId<SchoolProfileFormValues>(COLLECTIONS.schoolProfile, SCHOOL_PROFILE_DOC_ID, data);
  }
}

// ---- Academic years -----------------------------------------------------------------

export async function listAcademicYears(): Promise<AcademicYearDoc[]> {
  return getMany<AcademicYearFormValues>(COLLECTIONS.academicYears, {
    orderBy: [['startDate', 'desc']],
  }) as Promise<AcademicYearDoc[]>;
}

export function subscribeAcademicYears(
  cb: (years: AcademicYearDoc[]) => void,
  onError?: (err: Error) => void
) {
  return subscribe<AcademicYearFormValues>(
    COLLECTIONS.academicYears,
    { orderBy: [['startDate', 'desc']] },
    cb as (items: (AcademicYearFormValues & { id: string })[]) => void,
    onError
  );
}

/**
 * Create a year. If `isActive` is set, first demotes every other year to inactive —
 * mirrors the "one active year at a time" invariant the School Profile screen expects
 * (`activeAcademicYearId` picks from these).
 */
export async function createAcademicYear(data: AcademicYearFormValues): Promise<string> {
  if (data.isActive) await deactivateAllAcademicYears();
  return create<AcademicYearFormValues>(COLLECTIONS.academicYears, data);
}

export async function updateAcademicYear(id: string, data: Partial<AcademicYearFormValues>): Promise<void> {
  if (data.isActive) await deactivateAllAcademicYears(id);
  return update<AcademicYearFormValues>(COLLECTIONS.academicYears, id, data);
}

export async function deleteAcademicYear(id: string): Promise<void> {
  return remove(COLLECTIONS.academicYears, id);
}

async function deactivateAllAcademicYears(exceptId?: string): Promise<void> {
  const years = await listAcademicYears();
  await Promise.all(
    years
      .filter((y) => y.isActive && y.id !== exceptId)
      .map((y) => update<AcademicYearFormValues>(COLLECTIONS.academicYears, y.id, { isActive: false }))
  );
}

// ---- Grades -----------------------------------------------------------------------

export async function listGrades(): Promise<GradeDoc[]> {
  return getMany<GradeFormValues>(COLLECTIONS.grades, {
    orderBy: [['order', 'asc']],
  }) as Promise<GradeDoc[]>;
}

export function subscribeGrades(cb: (grades: GradeDoc[]) => void, onError?: (err: Error) => void) {
  return subscribe<GradeFormValues>(
    COLLECTIONS.grades,
    { orderBy: [['order', 'asc']] },
    cb as (items: (GradeFormValues & { id: string })[]) => void,
    onError
  );
}

export async function createGrade(data: GradeFormValues): Promise<string> {
  return create<GradeFormValues>(COLLECTIONS.grades, data);
}

export async function updateGrade(id: string, data: Partial<GradeFormValues>): Promise<void> {
  return update<GradeFormValues>(COLLECTIONS.grades, id, data);
}

/** Deletes the grade doc only. Existing Class (section) docs under it, and every student/
 * teacher/etc. record using its className string, are left untouched — this is metadata
 * cleanup, not a cascading delete of real school data. */
export async function deleteGrade(id: string): Promise<void> {
  return remove(COLLECTIONS.grades, id);
}

// ---- Classes (sections) — collection `classes` -------------------------------------

export async function listClassSections(): Promise<ClassSectionDoc[]> {
  return getMany<ClassSectionFormValues>(COLLECTIONS.classes, {
    orderBy: [['className', 'asc']],
  }) as Promise<ClassSectionDoc[]>;
}

export function subscribeClassSections(
  cb: (sections: ClassSectionDoc[]) => void,
  onError?: (err: Error) => void
) {
  return subscribe<ClassSectionFormValues>(
    COLLECTIONS.classes,
    { orderBy: [['className', 'asc']] },
    cb as (items: (ClassSectionFormValues & { id: string })[]) => void,
    onError
  );
}

export async function listClassSectionsForGrade(gradeId: string): Promise<ClassSectionDoc[]> {
  return getMany<ClassSectionFormValues>(COLLECTIONS.classes, {
    where: [['gradeId', '==', gradeId]],
  }) as Promise<ClassSectionDoc[]>;
}

/** Guards against two sections resolving to the same className, since every other
 * feature in the app treats className as a unique key for a class (one fee template,
 * one join code, etc. per className). */
export async function createClassSection(data: ClassSectionFormValues): Promise<string> {
  const clashing = await getMany<ClassSectionFormValues>(COLLECTIONS.classes, {
    where: [['className', '==', data.className]],
    limit: 1,
  });
  if (clashing.length > 0) {
    throw new Error(`A class named "${data.className}" already exists.`);
  }
  const id = await create<ClassSectionFormValues>(COLLECTIONS.classes, data);
  invalidateClassNameToIdCache();
  return id;
}

export async function updateClassSection(id: string, data: Partial<ClassSectionFormValues>): Promise<void> {
  await update<ClassSectionFormValues>(COLLECTIONS.classes, id, data);
  // Invalidate whenever className itself might have changed (e.g. section renamed),
  // not just always — a capacity/classTeacherId-only edit doesn't need to bust the
  // cache, but it's cheap and safe to do it unconditionally too; kept conditional
  // here to make the intent explicit for the next reader.
  if (data.className !== undefined) invalidateClassNameToIdCache();
}

/** Deletes the Class (section) reference doc only — never touches students, fee
 * templates, join codes, attendance, or anything else already keyed on this className
 * string. Those keep working exactly as before; this only removes it from the
 * Grades & Classes management screen. */
export async function deleteClassSection(id: string): Promise<void> {
  await remove(COLLECTIONS.classes, id);
  invalidateClassNameToIdCache();
}

// ---- className -> classId bridge (increment 5 step 1) ------------------------------
//
// The bigger migration (teachers/join codes/attendance/assignments/announcements/
// payments/reports/AI context moving off the flat `className` string onto a real
// `classId` reference) is explicitly staged, not done in one pass — see PROGRESS.md.
// This is step 1: a best-effort resolver so newly-written docs in those collections
// can start carrying an *optional* `classId` alongside their existing `className`,
// with zero risk to any existing read path (every current query still filters on
// `className`, untouched). Once every writer has been backfilling `classId` for a
// while, a later increment can migrate reads over — that's the actual "materially
// bigger, separate change" flagged in increment 4.1's notes, still not started here.

let classNameToIdCache: Map<string, string> | null = null;
let classNameToIdCacheAt = 0;
const CLASS_ID_CACHE_TTL_MS = 60_000;

/** Invalidate the cache — call after creating/renaming a Class (section) so a
 * resolver call right after doesn't return a stale miss. Exported for callers/tests
 * that mutate class sections in the same session and need an immediate lookup. */
export function invalidateClassNameToIdCache(): void {
  classNameToIdCache = null;
}

async function getClassNameToIdMap(): Promise<Map<string, string>> {
  const isStale = !classNameToIdCache || Date.now() - classNameToIdCacheAt > CLASS_ID_CACHE_TTL_MS;
  if (isStale) {
    const sections = await listClassSections();
    classNameToIdCache = new Map(sections.map((s) => [s.className, s.id]));
    classNameToIdCacheAt = Date.now();
  }
  return classNameToIdCache!;
}

/**
 * Resolves a `className` string (e.g. "Class 5") to the `classId` of its Class
 * (section) doc, if one has been defined on the Academic Structure screen yet.
 * Returns `undefined` (never throws) when no admin has created classes yet, or the
 * given className doesn't match any of them, or the lookup fails for any reason
 * (offline, permission-denied, etc.) — callers should treat this as a nice-to-have
 * enrichment, not a dependency, exactly like `useClassNameOptions()`'s fallback.
 */
export async function resolveClassIdByName(className: string): Promise<string | undefined> {
  if (!className || className === 'All') return undefined;
  try {
    const map = await getClassNameToIdMap();
    return map.get(className);
  } catch {
    return undefined;
  }
}

/**
 * Bulk variant of `resolveClassIdByName()` for callers that already have a list of
 * class-name strings to resolve (e.g. a teacher's comma-separated `classes` field).
 * Same never-throws, best-effort contract: entries with no match are simply omitted
 * from the returned map rather than causing the whole call to fail.
 */
export async function resolveClassIdsByNames(classNames: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  try {
    const map = await getClassNameToIdMap();
    for (const name of classNames) {
      const id = map.get(name);
      if (id) result.set(name, id);
    }
  } catch {
    // Best-effort — return whatever was resolved before the failure (empty map on
    // a failure during the initial fetch, since getClassNameToIdMap() throws before
    // the loop starts in that case).
  }
  return result;
}
