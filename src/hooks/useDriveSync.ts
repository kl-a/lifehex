import { useEffect, useRef } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { useDriveStore } from '../store/driveStore';
import { syncToDrive, syncFromDrive } from '../utils/driveSync';

export function useDriveSync() {
  const connected = useDriveStore((s) => s.connected);
  const locked = useSessionStore((s) => s.locked);
  const prevLockedRef = useRef(locked);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pull from Drive on app mount (catches data from other devices/browsers)
  useEffect(() => {
    if (connected) {
      syncFromDrive().catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
