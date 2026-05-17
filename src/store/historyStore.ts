import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Session } from '../types';

interface HistoryStore {
  sessions: Session[];
  addSession: (session: Session) => void;
  removeSession: (id: string) => void;
  updateSession: (id: string, patch: Partial<Pick<Session, 'mood' | 'tags'>>) => void;
  clearSessions: () => void;
  importSessions: (sessions: Session[]) => void;
}

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set) => ({
      sessions: [],
      addSession: (session) =>
        set((state) => ({ sessions: [...state.sessions, session] })),
      removeSession: (id) =>
        set((state) => ({ sessions: state.sessions.filter((s) => s.id !== id) })),
      updateSession: (id, patch) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, ...patch, updated_at: new Date().toISOString() } : s
          ),
        })),
      clearSessions: () => set({ sessions: [] }),
      importSessions: (sessions) => set({ sessions }),
    }),
    { name: 'lifehex_sessions' }
  )
);
