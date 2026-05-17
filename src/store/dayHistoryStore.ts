import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DayRecord } from '../types';

interface DayHistoryStore {
  dayRecords: DayRecord[];
  archiveDay: (record: DayRecord) => void;
  importDayRecords: (records: DayRecord[]) => void;
  clearDayRecords: () => void;
}

export const useDayHistoryStore = create<DayHistoryStore>()(
  persist(
    (set, get) => ({
      dayRecords: [],

      archiveDay: (record) => {
        // Last-write-wins per date — same merge strategy as Drive sync
        const others = get().dayRecords.filter((r) => r.date !== record.date);
        set({
          dayRecords: [record, ...others].sort((a, b) => b.date.localeCompare(a.date)),
        });
      },

      importDayRecords: (records) => set({ dayRecords: records }),

      clearDayRecords: () => set({ dayRecords: [] }),
    }),
    { name: 'lifehex_day_history' }
  )
);
