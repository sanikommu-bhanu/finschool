import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { getMany, update, COLLECTIONS } from '@/services/firestore';
import { validateJoinCode } from '@/services/joinCodes.service';
import { getFeeTemplateForClass } from '@/services/feeTemplates.service';
import { createStudent, getStudentByEmail } from '@/services/students.service';
import { createParent } from '@/services/parents.service';
import type { StudentFormValues, StudentDoc } from '@/schemas/student.schema';
import type { ParentFormValues } from '@/schemas/parent.schema';

/**
 * Redemption logic for the "join by code" onboarding flow described in the spec:
 *   Student enters Join Code -> class/teacher/fee-template auto-assigned.
 *   Parent enters Join Code + child details -> child linked, parent linked.
 *
 * This module implements the data layer (Firestore reads/writes) for the join-code
 * redemption flow. It's called from src/pages/onboarding/JoinCodeEntry.tsx, reached
 * from RoleSelect.tsx when a Parent/Student picks their role.
 */

export type JoinCodeError = 'invalid_code';

/**
 * Student redeems a join code at signup. Creates (or, if a matching studentEmail
 * doc already exists, links) the student record with className/teacherId/joinCodeId
 * set from the code, and the fee template for that class auto-assigned via
 * `createStudent`'s existing logic.
 */
export async function redeemJoinCodeForStudent(
  code: string,
  studentData: Omit<StudentFormValues, 'className' | 'teacherId' | 'joinCodeId' | 'feeDue' | 'feeStatus' | 'feeTemplateId'>
): Promise<{ studentId: string } | JoinCodeError> {
  const redemption = await validateJoinCode(code);
  if (!redemption) return 'invalid_code';

  const existing = studentData.studentEmail
    ? await getStudentByEmail(studentData.studentEmail)
    : null;

  if (existing) {
    await update<StudentFormValues>(COLLECTIONS.students, existing.id, {
      className: redemption.className,
      teacherId: redemption.teacherId,
      joinCodeId: redemption.joinCodeId,
    });
    return { studentId: existing.id };
  }

  const feeTemplate = await getFeeTemplateForClass(redemption.className);

  const studentId = await createStudent({
    ...studentData,
    className: redemption.className,
    teacherId: redemption.teacherId,
    joinCodeId: redemption.joinCodeId,
    feeDue: feeTemplate?.totalAmount ?? 0,
    feeStatus: (feeTemplate?.totalAmount ?? 0) > 0 ? 'due' : 'paid',
    feeTemplateId: feeTemplate?.id,
  });
  return { studentId };
}

interface RedeemParentCallableRequest {
  code: string;
  parent: { name: string; email: string; phone: string; address?: string; avatar?: string };
  childName: string;
  childRollNo?: string;
}

type RedeemParentCallableResult =
  | { ok: true; studentId: string; parentId: string; merged: boolean }
  | { ok: false; error: 'invalid_code' };

/**
 * Parent redeems a join code at signup. Links the parent's `childrenNames` entry to
 * the right class/teacher by creating the child's student record first (or reusing
 * one that already matches by name+className), then creates the parent doc with
 * `guardianEmail` set on the child so the existing students<->parents linkage
 * (already used everywhere in the app) picks it up automatically.
 *
 * Classmate-merge fix (was flagged as a known gap in increment 2): the "reuse an
 * existing roster row the admin already pre-registered" lookup needs to query
 * `students` by `className`, which Firestore rules correctly refuse to a
 * self-service (non-staff) caller — that query, if allowed, would let any signed-in
 * parent list every classmate's guardian phone/email/fee-due, which the rules are
 * intentionally scoped to prevent. So this now calls the `redeemJoinCodeForParent`
 * Cloud Function first (functions/src/index.ts), which runs that same lookup with
 * Admin SDK privileges that bypass Firestore rules entirely, then merges into the
 * matching roster row if one exists. See functions/README.md for deploy steps.
 *
 * If the callable fails for any reason — not deployed yet, no network, a Blaze
 * plan not enabled, cold start timeout, etc. — this falls back to the same
 * client-only logic increment 2 shipped (create a fresh student; the "merge"
 * optimization is skipped, exactly as documented then). That keeps join-code
 * redemption working end-to-end even in a project that hasn't deployed the
 * function, at the cost of losing the merge behavior until it is deployed.
 */
export async function redeemJoinCodeForParent(
  code: string,
  parentData: ParentFormValues,
  childName: string,
  childRollNo = ''
): Promise<{ parentId: string; studentId: string } | JoinCodeError> {
  try {
    const callable = httpsCallable<RedeemParentCallableRequest, RedeemParentCallableResult>(
      functions,
      'redeemJoinCodeForParent'
    );
    const { data } = await callable({
      code,
      parent: {
        name: parentData.name,
        email: parentData.email,
        phone: parentData.phone,
        address: parentData.address,
        avatar: parentData.avatar,
      },
      childName,
      childRollNo,
    });
    if (!data.ok) return 'invalid_code';
    return { parentId: data.parentId, studentId: data.studentId };
  } catch (err) {
     
    console.warn(
      '[onboarding] redeemJoinCodeForParent Cloud Function unavailable, falling back to client-only redemption (no classmate-merge). See functions/README.md.',
      err
    );
    return redeemJoinCodeForParentClientOnly(code, parentData, childName, childRollNo);
  }
}

/**
 * The increment-2 client-only fallback: still fully functional end-to-end, just
 * without the classmate-merge optimization (creates a fresh student record every
 * time rather than merging into an admin-pre-registered roster row), since the
 * roster lookup query is denied by Firestore rules for a non-staff caller.
 */
async function redeemJoinCodeForParentClientOnly(
  code: string,
  parentData: ParentFormValues,
  childName: string,
  childRollNo: string
): Promise<{ parentId: string; studentId: string } | JoinCodeError> {
  const redemption = await validateJoinCode(code);
  if (!redemption) return 'invalid_code';

  let classmates: StudentDoc[] = [];
  try {
    classmates = (await getMany<StudentFormValues>(COLLECTIONS.students, {
      where: [['className', '==', redemption.className]],
    })) as StudentDoc[];
  } catch {
    classmates = [];
  }
  const existingChild = classmates.find(
    (s) => s.name.trim().toLowerCase() === childName.trim().toLowerCase()
  );

  const feeTemplate = await getFeeTemplateForClass(redemption.className);

  const studentId = existingChild
    ? existingChild.id
    : await createStudent({
        name: childName,
        className: redemption.className,
        rollNo: childRollNo,
        guardian: parentData.name,
        guardianPhone: parentData.phone,
        guardianEmail: parentData.email,
        studentEmail: '',
        feeDue: feeTemplate?.totalAmount ?? 0,
        feeStatus: (feeTemplate?.totalAmount ?? 0) > 0 ? 'due' : 'paid',
        attendance: 100,
        avatar: '',
        teacherId: redemption.teacherId,
        joinCodeId: redemption.joinCodeId,
        feeTemplateId: feeTemplate?.id,
      });

  if (existingChild) {
    await update<StudentFormValues>(COLLECTIONS.students, existingChild.id, {
      guardianEmail: parentData.email,
      teacherId: redemption.teacherId,
      joinCodeId: redemption.joinCodeId,
    });
  }

  const parentId = await createParent({
    ...parentData,
    childrenNames: childName,
  });

  return { parentId, studentId };
}
