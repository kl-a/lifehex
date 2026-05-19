import { useEffect, useRef } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { useDriveStore } from '../store/driveStore';
import { syncToDrive, syncFromDrive } from '../utils/driveSync';

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function useDriveSync() {
  const connected = useDriveStore((s) => s.connected);
  const locked = useSessionStore((s) => s.locked);
  const prevLockedRef = useRef(locked);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pull from Drive on mount
  useEffect(() => {
    if (connected) {
      syncFromDrive().catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pull from Drive when page becomes visible (covers mobile app-switching)
  useEffect(() => {
    if (!connected) return;
    function onVisible() {
      if (document.visibilityState === 'visible') {
        syncFromDrive().catch(console.error);
      }
    }
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [connected]);

  // Periodic pull every 5 minutes while connected
  useEffect(() => {
    if (!connected) return;
    const id = setInterval(() => {
      syncFromDrive().catch(console.error);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [connected]);

  // Push to Drive 3 seconds after session is locked
  useEffect(() => {
    if (connected && locked && !prevLockedRef.current) {
      timerRef.current = setTimeout(() => {
        syncToDrive().catch(console.error);
      }, 3000);
    }
    prevLockedRef.current = locked;

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [locked, connected]);
}
