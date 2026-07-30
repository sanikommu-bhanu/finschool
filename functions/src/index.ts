import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp();
const db = getFirestore();

/**
 * Fixes the classmate-merge limitation flagged in PROGRESS.md (increment 2):
 *
 * A self-service parent redeeming a join code for a child the admin already
 * pre-registered on the class roster needs to find that roster row and merge
 * into it (set guardianEmail/teacherId/joinCodeId) instead of creating a
 * second, duplicate student record. Finding that row requires querying
 * `students` by `className` — a query Firestore's security rules correctly
 * refuse to a non-staff caller, because the rules can only be proven safe for
 * queries scoped to the exact field they check (guardianEmail/studentEmail),
 * and `className` isn't a private field the rule can key off without leaking
 * every other student in the class to whoever asks.
 *
 * Rather than loosening the `students` read rule (which would let any signed-in
 * parent/student list every classmate's guardian phone/email/fee-due — a real
 * privacy regression that couldn't be justified for this), this runs the
 * lookup + merge here, with the Admin SDK, which bypasses Firestore rules
 * entirely. Nothing about this function is reachable without a valid signed-in
 * auth token, and it only ever writes a student it just found/merged plus the
 * caller's own parent doc — never leaks the classmate list back to the client.
 */

interface ParentInput {
  name: string;
  email: string;
  phone: string;
  address?: string;
  avatar?: string;
}

interface RedeemParentRequest {
  code: string;
  parent: ParentInput;
  childName: string;
  childRollNo?: string;
}

type RedeemParentResult =
  | { ok: true; studentId: string; parentId: string; merged: boolean }
  | { ok: false; error: 'invalid_code' };

export const redeemJoinCodeForParent = onCall<RedeemParentRequest, Promise<RedeemParentResult>>(
  { region: 'us-central1' },
  async (request) => {
    const callerEmail = request.auth?.token?.email;
    if (!request.auth || !callerEmail) {
      throw new HttpsError('unauthenticated', 'Sign in required.');
    }

    const { code, parent, childName, childRollNo } = request.data ?? ({} as RedeemParentRequest);
    if (!code?.trim() || !parent?.name?.trim() || !parent?.email?.trim() || !parent?.phone?.trim() || !childName?.trim()) {
      throw new HttpsError('invalid-argument', 'code, parent (name/email/phone), and childName are required.');
    }

    // Same rule the client-side Firestore rules already enforce for a parent doc's
    // `email` field — re-checked here because this function runs with Admin SDK
    // privileges that bypass those rules, so it must not trust the payload blindly.
    if (parent.email.trim().toLowerCase() !== callerEmail.toLowerCase()) {
      throw new HttpsError('permission-denied', "parent.email must match the signed-in account's email.");
    }

    // 1. Resolve the join code.
    const codeSnap = await db
      .collection('classJoinCodes')
      .where('code', '==', code.trim().toUpperCase())
      .limit(1)
      .get();
    const codeDoc = codeSnap.docs[0];
    if (!codeDoc || codeDoc.data().active !== true) {
      return { ok: false, error: 'invalid_code' };
    }
    const { className, teacherId } = codeDoc.data() as { className: string; teacherId: string };
    const joinCodeId = codeDoc.id;

    // 2. Elevated lookup for an existing roster row in this class matching the
    // child's name (case/whitespace-insensitive, mirroring the client's prior
    // best-effort match) — this is the query a non-staff client is correctly
    // denied under firestore.rules.
    const classmatesSnap = await db.collection('students').where('className', '==', className).get();
    const normalizedChildName = childName.trim().toLowerCase();
    const existingDoc = classmatesSnap.docs.find(
      (d) => String(d.data().name ?? '').trim().toLowerCase() === normalizedChildName
    );

    // 3. Fee template total, for brand-new students only — never overrides an
    // already-assigned feeDue on a merged/existing row, same as createStudent().
    const templateSnap = await db.collection('feeTemplates').where('className', '==', className).limit(1).get();
    const templateDoc = templateSnap.docs[0];
    const feeTotal = templateDoc ? Number(templateDoc.data().totalAmount ?? 0) : 0;

    let studentId: string;
    const merged = !!existingDoc;

    if (existingDoc) {
      await existingDoc.ref.update({
        guardianEmail: callerEmail,
        teacherId,
        joinCodeId,
        updatedAt: FieldValue.serverTimestamp(),
      });
      studentId = existingDoc.id;
    } else {
      const newStudentRef = await db.collection('students').add({
        name: childName.trim(),
        className,
        rollNo: childRollNo?.trim() ?? '',
        guardian: parent.name.trim(),
        guardianPhone: parent.phone.trim(),
        guardianEmail: callerEmail,
        studentEmail: '',
        feeDue: feeTotal,
        feeStatus: feeTotal > 0 ? 'due' : 'paid',
        attendance: 100,
        avatar: '',
        teacherId,
        joinCodeId,
        feeTemplateId: templateDoc?.id ?? null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      studentId = newStudentRef.id;
    }

    // 4. Parent doc — upsert by email so a parent linking a second child (a second
    // call to this same function) reuses their existing parent record instead of
    // creating a duplicate, appending the new child's name to `childrenNames`.
    const existingParentSnap = await db.collection('parents').where('email', '==', callerEmail).limit(1).get();

    let parentId: string;
    if (!existingParentSnap.empty) {
      const parentDoc = existingParentSnap.docs[0];
      const prevNames = String(parentDoc.data().childrenNames ?? '');
      const names = new Set(
        prevNames
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      );
      names.add(childName.trim());
      await parentDoc.ref.update({
        name: parent.name.trim(),
        phone: parent.phone.trim(),
        address: parent.address?.trim() ?? '',
        childrenNames: Array.from(names).join(', '),
        updatedAt: FieldValue.serverTimestamp(),
      });
      parentId = parentDoc.id;
    } else {
      const newParentRef = await db.collection('parents').add({
        name: parent.name.trim(),
        email: callerEmail,
        phone: parent.phone.trim(),
        address: parent.address?.trim() ?? '',
        childrenNames: childName.trim(),
        avatar: parent.avatar ?? '',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      parentId = newParentRef.id;
    }

    return { ok: true, studentId, parentId, merged };
  }
);
