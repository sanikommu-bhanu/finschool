import { z } from 'zod';

/**
 * Firestore doc shape for the `classJoinCodes` collection.
 * One doc per (teacherId, className) pair. Deterministic doc id — see
 * `joinCodes.service.ts` `joinCodeDocId()` — so a teacher can never end up with two
 * codes for the same class.
 */
export const classJoinCodeSchema = z.object({
  code: z.string().length(6),
  className: z.string().trim().min(1),
  teacherId: z.string().min(1),
  teacherName: z.string().trim().min(1),
  teacherEmail: z.string().trim().email().or(z.literal('')),
  active: z.boolean(),
  // Optional — the Class (section) doc's id for this className, populated
  // best-effort by ensureJoinCodesForTeacher() via resolveClassIdByName() when a
  // matching Class exists. Existing/older docs simply don't have it, and every
  // current read path still keys off className, so this is purely additive.
  // See academicStructure.service.ts's "className -> classId bridge" note.
  classId: z.string().optional(),
});

export type ClassJoinCodeFormValues = z.infer<typeof classJoinCodeSchema>;

export interface ClassJoinCodeDoc extends ClassJoinCodeFormValues {
  id: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

/** Result of redeeming a join code — what a parent/student registration screen needs. */
export interface JoinCodeRedemption {
  joinCodeId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
}
