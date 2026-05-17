import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CycleEntry } from '../types';

interface CycleStore {
  cycles: CycleEntry[];
  logStart: (entry: CycleEntry) => void;
  logEnd: (id: string, endDate: string) => void;
  updateCycle: (id: string, patch: Partial<Pick<CycleEntry, 'cycleStartDate' | 'cycleEndDate'>>) => void;
  removeCycle: (id: string) => void;
  addCycleEntry: (entry: CycleEntry) => void;
  importCycles: (cycles: CycleEntry[]) => void;
}

const sortDesc = (arr: CycleEntry[]) =>
  [...arr].sort((a, b) => b.cycleStartDate.localeCompare(a.cycleStartDate));

export const useCycleStore = create<CycleStore>()(
  persist(
    (set) => ({
      cycles: [],
      logStart: (entry) =>
        set((state) => ({ cycles: sortDesc([entry, ...state.cycles]) })),
      logEnd: (id, endDate) =>
        set((state) => ({
          cycles: state.cycles.map((c) =>
            c.id === id ? { ...c, cycleEndDate: endDate, updated_at: new Date().toISOString() } : c
          ),
        })),
      updateCycle: (id, patch) =>
        set((state) => ({
          cycles: sortDesc(
            state.cycles.map((c) =>
              c.id === id ? { ...c, ...patch, updated_at: new Date().toISOString() } : c
            )
          ),
        })),
      removeCycle: (id) =>
        set((state) => ({ cycles: state.cycles.filter((c) => c.id !== id) })),
      addCycleEntry: (entry) =>
        set((state) => ({ cycles: sortDesc([...state.cycles, entry]) })),
      importCycles: (cycles) => set({ cycles }),
    }),
    { name: 'lifehex_cycles' }
  )
);
