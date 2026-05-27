import { useEffect, useRef } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { useDriveStore } from '../store/driveStore';
import { useDayStore } from '../store/dayStore';
import { syncToDrive, syncFromDrive } from '../utils/driveSync';

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const DAY_SYNC_DELAY_MS = 5000; // debounce checklist/day changes

export function useDriveSync() {
  const connected = useDriveStore((s) => s.connected);
  const locked = useSessionStore((s) => s.locked);
  const dayUpdatedAt = useDayStore((s) => s.dayRecord.updated_at);
  const prevLockedRef = useRef(locked);
  const prevDayUpdatedAtRef = useRef(dayUpdatedAt);
  const sessionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      sessionTimerRef.current = setTimeout(() => {
        syncToDrive().catch(console.error);
      }, 3000);
    }
    prevLockedRef.current = locked;

    return () => {
      if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    };
  }, [locked, connected]);

  // Push to Drive 5 seconds after any checklist/day record change
  useEffect(() => {
    if (!connected) return;
    if (dayUpdatedAt && dayUpdatedAt !== prevDayUpdatedAtRef.current) {
      if (dayTimerRef.current) clearTimeout(dayTimerRef.current);
      dayTimerRef.current = setTimeout(() => {
        syncToDrive().catch(console.error);
      }, DAY_SYNC_DELAY_MS);
    }
    prevDayUpdatedAtRef.current = dayUpdatedAt;

    return () => {
      if (dayTimerRef.current) clearTimeout(dayTimerRef.current);
    };
  }, [dayUpdatedAt, connected]);
}
