import { AnimatePresence, motion } from 'framer-motion';
import { HiOutlineWifi, HiOutlineStatusOffline } from 'react-icons/hi';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

/**
 * Global connectivity indicator. Renders nothing while online (the default,
 * common case), so it never touches existing screen layouts — it only
 * appears as a small pill dropped in from the top when offline, and briefly
 * when reconnecting, then disappears on its own.
 */
export function OfflineBanner() {
  const status = useOnlineStatus();

  return (
    <div className="pointer-events-none fixed top-0 inset-x-0 z-[999] flex justify-center safe-top pt-2">
      <AnimatePresence>
        {status !== 'online' && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className={
              'glass-pill pointer-events-auto flex items-center gap-2 px-4 py-2 text-xs font-semibold shadow-glass ' +
              (status === 'offline'
                ? 'text-amber-700 dark:text-amber-300'
                : 'text-emerald-700 dark:text-emerald-300')
            }
          >
            {status === 'offline' ? (
              <>
                <HiOutlineStatusOffline size={15} />
                You're offline — changes will sync once you're back online
              </>
            ) : (
              <>
                <HiOutlineWifi size={15} />
                Back online — syncing…
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
