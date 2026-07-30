import { useEffect } from 'react';
import { subscribeToAuthChanges, getUserDocument } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';

/**
 * Mounted once at the app root. Keeps the zustand auth store in sync with
 * Firebase's real session state (which itself persists across reloads via IndexedDB),
 * and pulls the user's role from Firestore so a refresh lands them on the right dashboard
 * instead of bouncing through role-select again.
 */
export function useAuthListener() {
  const setSession = useAuthStore((s) => s.setSession);
  const setInitialized = useAuthStore((s) => s.setInitialized);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      if (!firebaseUser) {
        setSession(null, null, false);
        setInitialized();
        return;
      }

      const userDoc = await getUserDocument(firebaseUser.uid);

      // This listener's doc read races with Login's role write: on first sign-in the
      // read can be issued before setUserRole lands and resolve after it, which would
      // clobber the just-committed role back to null and bounce the user to
      // /role-select. So never downgrade state we already know locally — only fill in
      // what the doc actually has.
      const { role: knownRole, profileCompleted: knownProfileCompleted } = useAuthStore.getState();

      setSession(
        {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName ?? userDoc?.name ?? 'Unnamed User',
          email: firebaseUser.email ?? userDoc?.email ?? '',
          avatar: firebaseUser.photoURL ?? userDoc?.avatar ?? '',
        },
        userDoc?.role ?? knownRole ?? null,
        userDoc?.profileCompleted ?? knownProfileCompleted ?? false
      );
      setInitialized();
    });

    return unsubscribe;
  }, [setSession, setInitialized]);
}
