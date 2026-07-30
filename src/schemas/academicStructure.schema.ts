import { z } from 'zod';
import { CLASS_OPTIONS } from '@/schemas/student.schema';

/**
 * Schemas for School / AcademicYear / Grade / Class(Section) — the first-class
 * "academic structure" entities.
 *
 * IMPORTANT — additive, not a replacement:
 * Every existing feature (students, teachers, fee templates, join codes, attendance,
 * assignments, announcements, payments, reports, AI context — 21 files in total) is
 * keyed off the flat `className` string (e.g. "Class 5") that already lives on those
 * docs. Rewriting all of that to reference a normalized `classId` in one pass isn't
 * something that can be safely done without a compiler in this sandbox (see
 * PROGRESS.md's honest-gaps note), and the brief says not to touch existing UI/nav/
 * behavior — so this module intentionally does NOT change any of those 21 files.
 *
 * What it does do: give the school a real place to define its School profile,
 * Academic Years, Grades, and Classes (sections) as their own Firestore documents,
 * manageable from a new Admin screen. A `Class` doc's `className` field is the exact
 * same string used everywhere else today (drawn from the same `CLASS_OPTIONS` list
 * by default, or a custom section label like "Class 5 - A"), so anything created here
 * is immediately usable by pointing an existing form's className field/dropdown at it
 * later — that wiring is the explicitly-deferred next step, not done in this pass.
 */

// ---- School profile (singleton doc: schoolProfile/default) ----------------------

export const schoolProfileSchema = z.object({
  name: z.string().trim().min(2, "Enter the school's name"),
  address: z.string().trim().optional(),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{0,15}$/, 'Enter a valid phone number')
    .optional()
    .or(z.literal('')),
  email: z.string().trim().email('Enter a valid email').or(z.literal('')).optional(),
  website: z.string().trim().optional(),
  activeAcademicYearId: z.string().optional(),
});

export type SchoolProfileFormValues = z.infer<typeof schoolProfileSchema>;

export interface SchoolProfileDoc extends SchoolProfileFormValues {
  id: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export const defaultSchoolProfileValues: SchoolProfileFormValues = {
  name: 'Smart School',
  address: '',
  phone: '',
  email: '',
  website: '',
  activeAcademicYearId: '',
};

export const SCHOOL_PROFILE_DOC_ID = 'default';

// ---- Academic year ----------------------------------------------------------------

export const academicYearSchema = z.object({
  label: z.string().trim().min(4, 'e.g. "2025-2026"'),
  startDate: z.string().min(1, 'Start date is required'), // YYYY-MM-DD, same convention as attendance.schema.ts
  endDate: z.string().min(1, 'End date is required'),
  isActive: z.boolean(),
});

export type AcademicYearFormValues = z.infer<typeof academicYearSchema>;

export interface AcademicYearDoc extends AcademicYearFormValues {
  id: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export const defaultAcademicYearValues: AcademicYearFormValues = {
  label: '',
  startDate: '',
  endDate: '',
  isActive: false,
};

// ---- Grade --------------------------------------------------------------------------

export const gradeSchema = z.object({
  name: z.string().trim().min(1, 'Grade name is required'), // e.g. "Class 5", "Nursery" — free text so it isn't locked to CLASS_OPTIONS
  order: z.coerce.number().int(), // sort key, e.g. Nursery=0, LKG=1, UKG=2, Class 1=3...
});

export type GradeFormValues = z.infer<typeof gradeSchema>;

export interface GradeDoc extends GradeFormValues {
  id: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

/** Seed order so Grades created from CLASS_OPTIONS sort the same way that list already does. */
export const DEFAULT_GRADE_ORDER: Record<string, number> = Object.fromEntries(
  CLASS_OPTIONS.map((name, index) => [name, index])
);

export const defaultGradeValues: GradeFormValues = {
  name: '',
  order: CLASS_OPTIONS.length,
};

// ---- Class (section) — reuses the already-reserved `classes` collection -----------

export const classSectionSchema = z.object({
  gradeId: z.string().min(1, 'Select a grade'),
  gradeName: z.string().min(1), // denormalized so lists/pickers don't need an extra read per row
  section: z.string().trim().min(1, 'Section is required').default('A'),
  // Canonical display string — the exact value the rest of the app already stores/reads
  // as `className` on students/teachers/feeTemplates/joinCodes/attendance/etc.
  className: z.string().min(1),
  academicYearId: z.string().optional(),
  classTeacherId: z.string().optional(),
  capacity: z.coerce.number().int().min(0).optional(),
});

export type ClassSectionFormValues = z.infer<typeof classSectionSchema>;

export interface ClassSectionDoc extends ClassSectionFormValues {
  id: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

/** "Class 5" + "A" -> "Class 5 - A"; if section is just "A" and it's the grade's only section, callers may pass gradeName straight through instead. */
export function buildClassName(gradeName: string, section: string): string {
  const trimmedSection = section.trim();
  if (!trimmedSection || trimmedSection.toUpperCase() === 'A') return gradeName;
  return `${gradeName} - ${trimmedSection}`;
}

/** Default form values for the "add class" sheet, seeded from whichever grade is
 * selected first (or blank if no grades exist yet — the form guards against that case). */
export function defaultClassSectionValuesFor(grade?: GradeDoc): ClassSectionFormValues {
  return {
    gradeId: grade?.id ?? '',
    gradeName: grade?.name ?? '',
    section: 'A',
    className: grade?.name ?? '',
    academicYearId: '',
    classTeacherId: '',
  };
}
