import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import type { DayRecord, MealLog } from '../types';

function defaultMeals(): MealLog[] {
  return [
    { meal: 'breakfast', logged: false, loggedTime: null, note: '', properBreak: false },
    { meal: 'lunch', logged: false, loggedTime: null, note: '', properBreak: false },
    { meal: 'dinner', logged: false, loggedTime: null, note: '', properBreak: false },
  ];
}

export function createDefaultDayRecord(date: string): DayRecord {
  return {
    id: uuid(), date,
    medicationTaken: false, medicationTime: null,
    medicationMorningTaken: false, medicationMorningTime: null,
    medicationArvoTaken: false, medicationArvoTime: null,
    ssriTaken: false, ssriTime: null,
    meals: defaultMeals(),
    lunchBreakTaken: false, lunchBreakTime: null,
    gymToday: false, gymTime: null,
    aloneTimeToday: false, aloneTimeStart: null,
    symptoms: [], brainFog: null, workingMemoryImpaired: false,
    focusQuality: null, sleepHours: null, sleepQuality: null,
    thatWasntMe: false, thatWasntMeNote: '',
    moodAverage: null, dominantZone: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    fieldUpdatedAt: {},
  };
}

interface DayHistoryStore {
  dayRecords: DayRecord[];
  archiveDay: (record: DayRecord) => void;
  patchDayRecord: (date: string, patch: Partial<DayRecord>) => void;
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

      patchDayRecord: (date, patch) => {
        const existing = get().dayRecords.find((r) => r.date === date);
        const base = existing ?? createDefaultDayRecord(date);
        const updated = { ...base, ...patch, updated_at: new Date().toISOString() };
        const others = get().dayRecords.filter((r) => r.date !== date);
        set({ dayRecords: [updated, ...others].sort((a, b) => b.date.localeCompare(a.date)) });
      },

      importDayRecords: (records) => set({ dayRecords: records }),

      clearDayRecords: () => set({ dayRecords: [] }),
    }),
    { name: 'selene_day_history' }
  )
);
