import { create } from 'zustand';
import type { DimensionScores } from '../types';
import { DEFAULT_DIMENSIONS } from '../data/constants';

interface SessionStore {
  locked: boolean;
  dimensions: DimensionScores;
  mood: number;
  tags: string[];
  lastSavedISO: string | null;
  unlock: (prefillDimensions: DimensionScores, prefillMood: number) => void;
  lock: () => void;
  setDimension: (key: keyof DimensionScores, value: number) => void;
  setMood: (v: number) => void;
  toggleTag: (id: string) => void;
}

export const useSessionStore = create<SessionStore>()((set) => ({
  locked: true,
  dimensions: { ...DEFAULT_DIMENSIONS },
  mood: 5,
  tags: [],
  lastSavedISO: null,

  unlock: (prefillDimensions, prefillMood) =>
    set({ locked: false, dimensions: { ...prefillDimensions }, mood: prefillMood, tags: [] }),

  lock: () => set({ locked: true }),

  setDimension: (key, value) =>
    set((state) => ({ dimensions: { ...state.dimensions, [key]: value } })),

  setMood: (v) => set({ mood: v }),

  toggleTag: (id) =>
    set((state) => ({
      tags: state.tags.includes(id)
        ? state.tags.filter((t) => t !== id)
        : [...state.tags, id],
    })),
}));
