import { useEffect, useRef, useCallback } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { useDriveStore } from '../store/driveStore';
import { useDayStore } from '../store/dayStore';
import { syncToDrive, syncFromDrive } from '../utils/driveSync';

const POLL_INTERVAL_MS = 30 * 1000;
const PUSH_DELAY_DAY_MS = 5000;

export function useDriveSync() {
  const connected = useDriveStore((s) => s.connected);
  const locked = useSessionStore((s) => s.locked);
  const dayUpdatedAt = useDayStore((s) => s.dayRecord.updated_at);

  const prevLockedRef = useRef(locked);
  const prevDayUpdatedAtRef = useRef(dayUpdatedAt);
  const dayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // After any sync that calls applyPayload, the dayRecord.updated_at may change.
  // Updating prevDayUpdatedAtRef prevents that pull-induced change from
  // triggering a push (which would loop and overwrite Drive with stale data).
  const snapPrevDayRef = () => {
    prevDayUpdatedAtRef.current = useDayStore.getState().dayRecord.updated_at;
  };

  // Pull only — used for polling and visibility changes
  const pullOnly = useCallback(async () => {
    await syncFromDrive();
    snapPrevDayRef();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Read-merge-write: pull latest first so we never overwrite concurrent remote changes,
  // then push the merged local state.
  const pushWithMerge = useCallback(async () => {
    await syncFromDrive();
    snapPrevDayRef(); // Don't re-trigger push from the pull
    await syncToDrive();
    snapPrevDayRef(); // Don't re-trigger push from merge side-effects
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pull from Drive on mount
  useEffect(() => {
    if (connected) pullOnly().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push+pull when page becomes visible — ensures sessions saved while backgrounded
  // are flushed to Drive the moment the user returns to the app.
  // (iOS kills network requests for backgrounded PWAs, so the post-lock push often
  // doesn't complete; this catches up on resume.)
  useEffect(() => {
    if (!connected) return;
    function onVisible() {
      if (document.visibilityState === 'visible') pushWithMerge().catch(console.error);
    }
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [connected, pushWithMerge]);

  // Poll every 30 seconds while connected
  useEffect(() => {
    if (!connected) return;
    const id = setInterval(() => pullOnly().catch(console.error), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [connected, pullOnly]);

  // Push immediately after session is locked — locking is a deliberate one-shot action,
  // no need to debounce. Pushing without delay minimises the window in which
  // backgrounding the app can kill the network request before it completes.
  useEffect(() => {
    if (connected && locked && !prevLockedRef.current) {
      pushWithMerge().catch(console.error);
    }
    prevLockedRef.current = locked;
  }, [locked, connected, pushWithMerge]);

  // Push 5 seconds after any user-initiated checklist/day record change.
  // prevDayUpdatedAtRef is kept in sync with every pull, so this only fires
  // when the user (not Drive) is the source of the change.
  useEffect(() => {
    if (!connected) return;
    if (dayUpdatedAt && dayUpdatedAt !== prevDayUpdatedAtRef.current) {
      if (dayTimerRef.current) clearTimeout(dayTimerRef.current);
      dayTimerRef.current = setTimeout(() => {
        pushWithMerge().catch(console.error);
      }, PUSH_DELAY_DAY_MS);
    }
    prevDayUpdatedAtRef.current = dayUpdatedAt;
    return () => { if (dayTimerRef.current) clearTimeout(dayTimerRef.current); };
  }, [dayUpdatedAt, connected, pushWithMerge]);
}
