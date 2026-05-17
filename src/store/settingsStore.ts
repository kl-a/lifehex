import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Settings } from '../types';

interface SettingsStore extends Settings {
  setExpectedCycleLength: (n: number) => void;
  setExpectedPeriodLength: (n: number) => void;
  setDriveConnected: (v: boolean) => void;
  setLastSyncedAt: (iso: string | null) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      expectedCycleLength: 28,
      expectedPeriodLength: 5,
      driveConnected: false,
      lastSyncedAt: null,
      setExpectedCycleLength: (n) => set({ expectedCycleLength: n }),
      setExpectedPeriodLength: (n) => set({ expectedPeriodLength: n }),
      setDriveConnected: (v) => set({ driveConnected: v }),
      setLastSyncedAt: (iso) => set({ lastSyncedAt: iso }),
    }),
    { name: 'lifehex_settings' }
  )
);
