import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Session } from '../types';

interface Tombstone { id: string; deletedAt: string }

interface HistoryStore {
  sessions: Session[];
  deletedSessionIds: Tombstone[];
  addSession: (session: Session) => void;
  removeSession: (id: string) => void;
  updateSession: (id: string, patch: Partial<Pick<Session, 'mood' | 'energy' | 'emotionalRegulation' | 'confirmedZone' | 'timestamp'>>) => void;
  clearSessions: () => void;
  importSessions: (sessions: Session[], deletedIds?: Tombstone[]) => void;
}

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set) => ({
      sessions: [],
      deletedSessionIds: [],
      addSession: (session) =>
        set((state) => ({ sessions: [...state.sessions, session] })),
      removeSession: (id) =>
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
          deletedSessionIds: [...state.deletedSessionIds, { id, deletedAt: new Date().toISOString() }],
        })),
      updateSession: (id, patch) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, ...patch, updated_at: new Date().toISOString() } : s
          ),
        })),
      clearSessions: () => set({ sessions: [] }),
      importSessions: (sessions, deletedIds = []) => set({ sessions, deletedSessionIds: deletedIds }),
    }),
    { name: 'selene_sessions' }
  )
);
