import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';

interface DriveState {
  connected: boolean;
  accessToken: string | null;
  tokenExpiry: number | null; // ms epoch
  fileId: string | null;
  lastSyncedAt: string | null;
  syncStatus: SyncStatus;
  syncError: string | null;
  setConnected: (v: boolean) => void;
  setToken: (token: string, expiresIn: number) => void;
  clearToken: () => void;
  setFileId: (id: string | null) => void;
  setLastSyncedAt: (iso: string) => void;
  setSyncStatus: (s: SyncStatus, error?: string) => void;
  disconnect: () => void;
}

export const useDriveStore = create<DriveState>()(
  persist(
    (set) => ({
      connected: false,
      accessToken: null,
      tokenExpiry: null,
      fileId: null,
      lastSyncedAt: null,
      syncStatus: 'idle',
      syncError: null,
      setConnected: (v) => set({ connected: v }),
      setToken: (token, expiresIn) =>
        set({ accessToken: token, tokenExpiry: Date.now() + (expiresIn - 60) * 1000 }),
      clearToken: () => set({ accessToken: null, tokenExpiry: null }),
      setFileId: (id) => set({ fileId: id }),
      setLastSyncedAt: (iso) => set({ lastSyncedAt: iso }),
      setSyncStatus: (syncStatus, error) => set({ syncStatus, syncError: error ?? null }),
      disconnect: () =>
        set({
          connected: false,
          accessToken: null,
          tokenExpiry: null,
          fileId: null,
          lastSyncedAt: null,
          syncStatus: 'idle',
          syncError: null,
        }),
    }),
    { name: 'lifehex_drive' }
  )
);
