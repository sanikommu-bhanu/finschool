import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';
import type { Role } from '@/types';

export interface AppUserDoc {
  uid: string;
  name: string;
  email: string;
  avatar: string;
  phone?: string;
  role: Role | null;
  profileCompleted?: boolean;
  createdAt?: Timestamp;
  lastLoginAt?: Timestamp;
}

const usersCol = (uid: string) => doc(db, 'users', uid);

/**
 * Opens the native Google account chooser (real multi-account picker —
 * this replaces the mock AccountPicker screen's data, not its layout).
 * Throws on failure/cancellation so callers can toast the error.
 */
export async function signInWithGoogle(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider);
  await ensureUserDocument(result.user);
  return result.user;
}

export async function signUpWithEmail(email: string, password: string, name: string): Promise<FirebaseUser> {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName: name });
  await ensureUserDocument(result.user);
  return result.user;
}

export async function signInWithEmail(email: string, password: string): Promise<FirebaseUser> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserDocument(result.user);
  return result.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

/** Creates the Firestore user doc on first login, or refreshes lastLoginAt on repeat logins. */
export async function ensureUserDocument(user: FirebaseUser): Promise<AppUserDoc> {
  const ref = usersCol(user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const newDoc: AppUserDoc = {
      uid: user.uid,
      name: user.displayName ?? 'Unnamed User',
      email: user.email ?? '',
      avatar: user.photoURL ?? '',
      role: null,
    };
    await setDoc(ref, { ...newDoc, createdAt: serverTimestamp(), lastLoginAt: serverTimestamp() });
    return newDoc;
  }

  await updateDoc(ref, { lastLoginAt: serverTimestamp() });
  return snap.data() as AppUserDoc;
}

export async function getUserDocument(uid: string): Promise<AppUserDoc | null> {
  const snap = await getDoc(usersCol(uid));
  return snap.exists() ? (snap.data() as AppUserDoc) : null;
}

/** Sets the role once, at role-select time. Role is treated as immutable after this — admins can change it via Admin > Users. */
export async function setUserRole(uid: string, role: Role): Promise<void> {
  await updateDoc(usersCol(uid), { role });
}

/** Marks profile completion so the user isn't re-prompted on next login. */
export async function markProfileCompleted(uid: string, extraFields: Record<string, string> = {}): Promise<void> {
  await updateDoc(usersCol(uid), {
    ...extraFields,
    profileCompleted: true,
  });
}

export async function updateUserProfile(name: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Not logged in');
  
  await updateProfile(currentUser, { displayName: name });
  await updateDoc(usersCol(currentUser.uid), { name });
}

/** Sends a password-reset email via Firebase Auth. */
export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export function subscribeToAuthChanges(cb: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, cb);
}
