import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DayRecord, MealLog } from '../types';
import { v4 as uuid } from 'uuid';
import { useDayHistoryStore } from './dayHistoryStore';

function todayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function defaultMeals(): MealLog[] {
  return [
    { meal: 'breakfast', logged: false, loggedTime: null, note: '', properBreak: false },
    { meal: 'lunch', logged: false, loggedTime: null, note: '', properBreak: false },
    { meal: 'dinner', logged: false, loggedTime: null, note: '', properBreak: false },
  ];
}

function defaultDayRecord(date: string): DayRecord {
  return {
    id: uuid(),
    date,
    medicationTaken: false,
    medicationTime: null,
    medicationMorningTaken: false,
    medicationMorningTime: null,
    medicationArvoTaken: false,
    medicationArvoTime: null,
    meals: defaultMeals(),
    lunchBreakTaken: false,
    lunchBreakTime: null,
    gymToday: false,
    gymTime: null,
    aloneTimeToday: false,
    aloneTimeStart: null,
    symptoms: [],
    brainFog: null,
    workingMemoryImpaired: false,
    focusQuality: null,
    sleepHours: null,
    sleepQuality: null,
    thatWasntMe: false,
    thatWasntMeNote: '',
    moodAverage: null,
    dominantZone: null,
    created_at: new Date().toISOString(),
    updated_at: '', // empty so any remote record with real data always wins the sync merge
  };
}

interface DayStore {
  dayRecord: DayRecord;
  ensureToday: () => void;
  setMedicationTaken: (taken: boolean) => void;
  setMedicationTime: (iso: string) => void;
  setMedicationMorningTaken: (taken: boolean) => void;
  setMedicationMorningTime: (iso: string) => void;
  setMedicationArvoTaken: (taken: boolean) => void;
  setMedicationArvoTime: (iso: string) => void;
  updateMeal: (meal: 'breakfast' | 'lunch' | 'dinner', patch: Partial<MealLog>) => void;
  setMealTime: (meal: 'breakfast' | 'lunch' | 'dinner', iso: string) => void;
  setLunchBreakTaken: (taken: boolean) => void;
  setGymToday: (v: boolean) => void;
  setGymTime: (iso: string) => void;
  setAloneTimeToday: (v: boolean) => void;
  setAloneTimeStart: (iso: string) => void;
  toggleSymptom: (s: string) => void;
  setBrainFog: (v: number | null) => void;
  setWorkingMemoryImpaired: (v: boolean) => void;
  setFocusQuality: (v: number | null) => void;
  setSleepHours: (v: number | null) => void;
  setSleepQuality: (v: number | null) => void;
  setThatWasntMe: (v: boolean) => void;
  setThatWasntMeNote: (note: string) => void;
}

export const useDayStore = create<DayStore>()(
  persist(
    (set, get) => ({
      dayRecord: defaultDayRecord(todayDate()),

      ensureToday: () => {
        const today = todayDate();
        const current = get().dayRecord;
        if (current.date !== today) {
          // Archive the outgoing day before resetting
          useDayHistoryStore.getState().archiveDay(current);
          set({ dayRecord: defaultDayRecord(today) });
        }
      },

      setMedicationTaken: (taken) =>
        set((s) => ({
          dayRecord: {
            ...s.dayRecord,
            medicationTaken: taken,
            medicationTime: taken ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          },
        })),

      setMedicationTime: (iso) =>
        set((s) => ({
          dayRecord: { ...s.dayRecord, medicationTime: iso, updated_at: new Date().toISOString() },
        })),

      setMedicationMorningTaken: (taken) =>
        set((s) => ({
          dayRecord: {
            ...s.dayRecord,
            medicationMorningTaken: taken,
            medicationMorningTime: taken ? new Date().toISOString() : null,
            medicationTaken: taken || s.dayRecord.medicationArvoTaken,
            updated_at: new Date().toISOString(),
          },
        })),

      setMedicationMorningTime: (iso) =>
        set((s) => ({
          dayRecord: { ...s.dayRecord, medicationMorningTime: iso, updated_at: new Date().toISOString() },
        })),

      setMedicationArvoTaken: (taken) =>
        set((s) => ({
          dayRecord: {
            ...s.dayRecord,
            medicationArvoTaken: taken,
            medicationArvoTime: taken ? new Date().toISOString() : null,
            medicationTaken: s.dayRecord.medicationMorningTaken || taken,
            updated_at: new Date().toISOString(),
          },
        })),

      setMedicationArvoTime: (iso) =>
        set((s) => ({
          dayRecord: { ...s.dayRecord, medicationArvoTime: iso, updated_at: new Date().toISOString() },
        })),

      updateMeal: (meal, patch) =>
        set((s) => ({
          dayRecord: {
            ...s.dayRecord,
            meals: s.dayRecord.meals.map((m) =>
              m.meal === meal
                ? {
                    ...m,
                    ...patch,
                    loggedTime: patch.logged && !m.logged ? new Date().toISOString() : m.loggedTime,
                  }
                : m
            ),
            updated_at: new Date().toISOString(),
          },
        })),

      setMealTime: (meal, iso) =>
        set((s) => ({
          dayRecord: {
            ...s.dayRecord,
            meals: s.dayRecord.meals.map((m) =>
              m.meal === meal ? { ...m, loggedTime: iso } : m
            ),
            updated_at: new Date().toISOString(),
          },
        })),

      setLunchBreakTaken: (taken) =>
        set((s) => ({
          dayRecord: {
            ...s.dayRecord,
            lunchBreakTaken: taken,
            lunchBreakTime: taken ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          },
        })),

      setGymToday: (v) =>
        set((s) => ({
          dayRecord: {
            ...s.dayRecord,
            gymToday: v,
            gymTime: v ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          },
        })),

      setGymTime: (iso) =>
        set((s) => ({
          dayRecord: { ...s.dayRecord, gymTime: iso, updated_at: new Date().toISOString() },
        })),

      setAloneTimeToday: (v) =>
        set((s) => ({
          dayRecord: {
            ...s.dayRecord,
            aloneTimeToday: v,
            aloneTimeStart: v ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          },
        })),

      setAloneTimeStart: (iso) =>
        set((s) => ({
          dayRecord: { ...s.dayRecord, aloneTimeStart: iso, updated_at: new Date().toISOString() },
        })),

      toggleSymptom: (symptom) =>
        set((s) => ({
          dayRecord: {
            ...s.dayRecord,
            symptoms: s.dayRecord.symptoms.includes(symptom)
              ? s.dayRecord.symptoms.filter((x) => x !== symptom)
              : [...s.dayRecord.symptoms, symptom],
            updated_at: new Date().toISOString(),
          },
        })),

      setBrainFog: (v) =>
        set((s) => ({ dayRecord: { ...s.dayRecord, brainFog: v, updated_at: new Date().toISOString() } })),

      setWorkingMemoryImpaired: (v) =>
        set((s) => ({ dayRecord: { ...s.dayRecord, workingMemoryImpaired: v, updated_at: new Date().toISOString() } })),

      setFocusQuality: (v) =>
        set((s) => ({ dayRecord: { ...s.dayRecord, focusQuality: v, updated_at: new Date().toISOString() } })),

      setSleepHours: (v) =>
        set((s) => ({ dayRecord: { ...s.dayRecord, sleepHours: v, updated_at: new Date().toISOString() } })),

      setSleepQuality: (v) =>
        set((s) => ({ dayRecord: { ...s.dayRecord, sleepQuality: v, updated_at: new Date().toISOString() } })),

      setThatWasntMe: (v) =>
        set((s) => ({ dayRecord: { ...s.dayRecord, thatWasntMe: v, updated_at: new Date().toISOString() } })),

      setThatWasntMeNote: (note) =>
        set((s) => ({ dayRecord: { ...s.dayRecord, thatWasntMeNote: note, updated_at: new Date().toISOString() } })),
    }),
    { name: 'selene_day' }
  )
);
