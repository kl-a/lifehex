import { create } from 'zustand';
import type { DimensionScores } from '../types';
import { DEFAULT_DIMENSIONS } from '../data/constants';

interface SessionStore {
  locked: boolean;
  dimensions: DimensionScores;
  mood: number;
  energy: number;
  regulation: number;
  lastSavedISO: string | null;
  unlock: (prefillDimensions: DimensionScores, prefillMood: number, prefillEnergy: number, prefillRegulation: number) => void;
  lock: () => void;
  setDimension: (key: keyof DimensionScores, value: number) => void;
  setMood: (v: number) => void;
  setEnergy: (v: number) => void;
  setRegulation: (v: number) => void;
}

export const useSessionStore = create<SessionStore>()((set) => ({
  locked: true,
  dimensions: { ...DEFAULT_DIMENSIONS },
  mood: 5,
  energy: 5,
  regulation: 5,
  lastSavedISO: null,

  unlock: (prefillDimensions, prefillMood, prefillEnergy, prefillRegulation) =>
    set({
      locked: false,
      dimensions: { ...prefillDimensions },
      mood: prefillMood,
      energy: prefillEnergy,
      regulation: prefillRegulation,
    }),

  lock: () => set({ locked: true }),

  setDimension: (key, value) =>
    set((state) => ({ dimensions: { ...state.dimensions, [key]: value } })),

  setMood: (v) => set({ mood: v }),
  setEnergy: (v) => set({ energy: v }),
  setRegulation: (v) => set({ regulation: v }),
}));
