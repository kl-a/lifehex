import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Settings } from '../types';

interface SettingsStore extends Settings {
  setExpectedCycleLength: (n: number) => void;
  setExpectedPeriodLength: (n: number) => void;
  setDriveConnected: (v: boolean) => void;
  setLastSyncedAt: (iso: string | null) => void;
  setMorningRoutineTime: (t: string) => void;
  setLunchNudgeTime: (t: string) => void;
  setBedtimeRoutineTime: (t: string) => void;
  setWeekdayMedicationTracking: (v: boolean) => void;
}

const touch = () => ({ updated_at: new Date().toISOString() });

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      expectedCycleLength: 28,
      expectedPeriodLength: 5,
      morningRoutineTime: '09:00',
      lunchNudgeTime: '12:00',
      bedtimeRoutineTime: '22:00',
      weekdayMedicationTracking: true,
      driveConnected: false,
      lastSyncedAt: null,
      updated_at: new Date().toISOString(),
      moodAlertThreshold: 5,
      googleCalendarConnected: false,
      setExpectedCycleLength: (n) => set({ expectedCycleLength: n, ...touch() }),
      setExpectedPeriodLength: (n) => set({ expectedPeriodLength: n, ...touch() }),
      setDriveConnected: (v) => set({ driveConnected: v, ...touch() }),
      setLastSyncedAt: (iso) => set({ lastSyncedAt: iso }),
      setMorningRoutineTime: (t) => set({ morningRoutineTime: t, ...touch() }),
      setLunchNudgeTime: (t) => set({ lunchNudgeTime: t, ...touch() }),
      setBedtimeRoutineTime: (t) => set({ bedtimeRoutineTime: t, ...touch() }),
      setWeekdayMedicationTracking: (v) => set({ weekdayMedicationTracking: v, ...touch() }),
    }),
    { name: 'lifehex_settings' }
  )
);
