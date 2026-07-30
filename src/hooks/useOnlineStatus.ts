import { useEffect, useState } from 'react';

export type ConnectionState = 'online' | 'offline' | 'reconnected';

/**
 * Tracks browser connectivity for the offline-mode requirement.
 * Firestore itself already queues writes locally (see `lib/firebase.ts`'s
 * `persistentLocalCache`) and replays them the moment the socket reconnects —
 * this hook is purely for surfacing that state to the user via a banner.
 *
 * When the connection comes back, it reports 'reconnected' for a few seconds
 * (so the user sees a "back online, syncing…" confirmation) before settling
 * into 'online'.
 */
export function useOnlineStatus(): ConnectionState {
  const [state, setState] = useState<ConnectionState>(navigator.onLine ? 'online' : 'offline');

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

    function handleOnline() {
      setState('reconnected');
      reconnectTimer = setTimeout(() => setState('online'), 3000);
    }

    function handleOffline() {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      setState('offline');
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, []);

  return state;
}
