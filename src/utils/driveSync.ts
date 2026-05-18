import { useDriveStore } from '../store/driveStore';
import { useHistoryStore } from '../store/historyStore';
import { useDayStore } from '../store/dayStore';
import { useDayHistoryStore } from '../store/dayHistoryStore';
import { useCycleStore } from '../store/cycleStore';
import { useSettingsStore } from '../store/settingsStore';
import type { Session, DayRecord, CycleEntry } from '../types';

// ─── GIS types ────────────────────────────────────────────────────────────────

interface GisTokenResponse {
  access_token: string;
  expires_in: number;
  error?: string;
}

interface GisTokenClient {
  requestAccessToken(options?: { prompt?: string }): void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(config: {
            client_id: string;
            scope: string;
            callback: (r: GisTokenResponse) => void;
            error_callback?: (e: { type: string }) => void;
          }): GisTokenClient;
        };
      };
    };
  }
}

// ─── constants ────────────────────────────────────────────────────────────────

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
const SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const FILE_NAME = 'selene-data.json';
const DRIVE_BASE = 'https://www.googleapis.com/drive/v3';
const UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';

// ─── sync payload shape ───────────────────────────────────────────────────────

interface SyncSettings {
  expectedCycleLength: number;
  expectedPeriodLength: number;
  morningRoutineTime: string;
  lunchNudgeTime: string;
  bedtimeRoutineTime: string;
  weekdayMedicationTracking: boolean;
  updated_at?: string;
}

interface SyncPayload {
  version: number;
  syncedAt: string;
  sessions: Session[];
  dayRecord: DayRecord;
  dayHistory: DayRecord[];
  cycles: CycleEntry[];
  settings: SyncSettings;
}

// ─── GIS token client singleton ───────────────────────────────────────────────

let tokenClient: GisTokenClient | null = null;
let pendingResolve: ((token: string) => void) | null = null;
let pendingReject: ((e: Error) => void) | null = null;

function initTokenClient(): GisTokenClient {
  if (tokenClient) return tokenClient;
  if (!window.google?.accounts?.oauth2) throw new Error('GIS not ready');

  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPE,
    callback: (resp) => {
      if (resp.error) {
        pendingReject?.(new Error(resp.error));
      } else {
        useDriveStore.getState().setToken(resp.access_token, resp.expires_in);
        pendingResolve?.(resp.access_token);
      }
      pendingResolve = null;
      pendingReject = null;
    },
    error_callback: (err) => {
      pendingReject?.(new Error(err.type));
      pendingResolve = null;
      pendingReject = null;
    },
  });
  return tokenClient;
}

async function waitForGIS(timeoutMs = 8000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!window.google?.accounts?.oauth2) {
    if (Date.now() > deadline) throw new Error('Google Identity Services failed to load');
    await new Promise((r) => setTimeout(r, 100));
  }
}

async function requestToken(prompt: '' | 'consent' = ''): Promise<string> {
  await waitForGIS();
  return new Promise<string>((resolve, reject) => {
    pendingResolve = resolve;
    pendingReject = reject;
    initTokenClient().requestAccessToken({ prompt });
  });
}

async function getValidToken(): Promise<string> {
  const { accessToken, tokenExpiry } = useDriveStore.getState();
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) return accessToken;
  // Token missing or expired — silent refresh (no consent prompt if previously granted)
  return requestToken('');
}

// ─── Drive API fetch helpers ──────────────────────────────────────────────────

async function driveRequest(base: string, path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getValidToken();
  const headers = {
    Authorization: `Bearer ${token}`,
    ...(options.headers as Record<string, string> | undefined),
  };

  let res = await fetch(base + path, { ...options, headers });

  if (res.status === 401) {
    // Force fresh token and retry once
    useDriveStore.getState().clearToken();
    const fresh = await requestToken('');
    res = await fetch(base + path, {
      ...options,
      headers: { ...headers, Authorization: `Bearer ${fresh}` },
    });
  }

  return res;
}

const driveApi = (path: string, options?: RequestInit) =>
  driveRequest(DRIVE_BASE, path, options);

const driveUpload = (path: string, options?: RequestInit) =>
  driveRequest(UPLOAD_BASE, path, options);

// ─── file operations ──────────────────────────────────────────────────────────

async function findExistingFileId(): Promise<string | null> {
  const res = await driveApi(
    `/files?spaces=appDataFolder&q=name%3D"${FILE_NAME}"&fields=files(id)&pageSize=1`
  );
  if (!res.ok) return null;
  const data = await res.json();
  const id: string | null = data.files?.[0]?.id ?? null;
  if (id) useDriveStore.getState().setFileId(id);
  return id;
}

async function readFileContent(fileId: string): Promise<string> {
  const res = await driveApi(`/files/${fileId}?alt=media`);
  if (!res.ok) throw new Error(`Drive read failed: ${res.status}`);
  return res.text();
}

async function createDriveFile(content: string): Promise<string> {
  const boundary = 'selene_' + Math.random().toString(36).slice(2);
  const metadata = JSON.stringify({ name: FILE_NAME, parents: ['appDataFolder'] });
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    metadata,
    `--${boundary}`,
    'Content-Type: application/json',
    '',
    content,
    `--${boundary}--`,
  ].join('\r\n');

  const res = await driveUpload('/files?uploadType=multipart&fields=id', {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.status.toString());
    throw new Error(`Drive create failed: ${text}`);
  }
  const { id } = await res.json();
  useDriveStore.getState().setFileId(id);
  return id as string;
}

async function updateDriveFile(fileId: string, content: string): Promise<void> {
  const res = await driveUpload(`/files/${fileId}?uploadType=media`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: content,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.status.toString());
    throw new Error(`Drive update failed: ${text}`);
  }
}

// ─── payload helpers ──────────────────────────────────────────────────────────

function buildPayload(): SyncPayload {
  const { sessions } = useHistoryStore.getState();
  const { dayRecord } = useDayStore.getState();
  const { dayRecords: dayHistory } = useDayHistoryStore.getState();
  const { cycles } = useCycleStore.getState();
  const {
    expectedCycleLength,
    expectedPeriodLength,
    morningRoutineTime,
    lunchNudgeTime,
    bedtimeRoutineTime,
    weekdayMedicationTracking,
  } = useSettingsStore.getState();

  return {
    version: 3,
    syncedAt: new Date().toISOString(),
    sessions,
    dayRecord,
    dayHistory,
    cycles,
    settings: {
      expectedCycleLength,
      expectedPeriodLength,
      morningRoutineTime,
      lunchNudgeTime,
      bedtimeRoutineTime,
      weekdayMedicationTracking,
    },
  };
}

// Merge: Drive items load first, local wins if newer or not on Drive (additive both ways)
function mergeById<T extends { id: string; updated_at?: string; created_at?: string }>(
  local: T[], remote: T[]
): T[] {
  const map = new Map<string, T>();
  for (const item of remote) map.set(item.id, item);
  for (const item of local) {
    const existing = map.get(item.id);
    const localTs = item.updated_at ?? item.created_at ?? '';
    const remoteTs = existing ? (existing.updated_at ?? existing.created_at ?? '') : '';
    if (!existing || localTs > remoteTs) map.set(item.id, item);
  }
  return Array.from(map.values());
}

function mergeByDate<T extends { date: string; updated_at?: string; created_at?: string }>(
  local: T[], remote: T[]
): T[] {
  const map = new Map<string, T>();
  for (const item of remote) map.set(item.date, item);
  for (const item of local) {
    const existing = map.get(item.date);
    const localTs = item.updated_at ?? item.created_at ?? '';
    const remoteTs = existing ? (existing.updated_at ?? existing.created_at ?? '') : '';
    if (!existing || localTs > remoteTs) map.set(item.date, item);
  }
  return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
}

function applyPayload(remote: SyncPayload): void {
  const { sessions } = useHistoryStore.getState();
  const { dayRecord } = useDayStore.getState();
  const { dayRecords: dayHistory } = useDayHistoryStore.getState();
  const { cycles } = useCycleStore.getState();
  const localSettings = useSettingsStore.getState();

  useHistoryStore.setState({ sessions: mergeById(sessions, remote.sessions ?? []) });

  useDayHistoryStore.setState({
    dayRecords: mergeByDate(dayHistory, remote.dayHistory ?? []),
  });

  if (remote.dayRecord?.date === dayRecord.date) {
    const remoteTs = remote.dayRecord.updated_at ?? remote.dayRecord.created_at ?? '';
    const localTs = dayRecord.updated_at ?? dayRecord.created_at ?? '';
    if (remoteTs > localTs) useDayStore.setState({ dayRecord: remote.dayRecord });
  }

  useCycleStore.setState({
    cycles: mergeById(cycles, remote.cycles ?? []).sort((a, b) =>
      b.cycleStartDate.localeCompare(a.cycleStartDate)
    ),
  });

  // Settings: last-write-wins using updated_at
  if (remote.settings) {
    const localTs = localSettings.updated_at ?? '';
    const remoteTs = remote.settings.updated_at ?? '';
    if (remoteTs > localTs) useSettingsStore.setState(remote.settings);
  }
}

// ─── public API ───────────────────────────────────────────────────────────────

export async function connectAndSync(): Promise<void> {
  await requestToken('consent');
  useDriveStore.getState().setConnected(true);
  await syncFromDrive();
  await syncToDrive();
}

export async function syncToDrive(): Promise<void> {
  const store = useDriveStore.getState();
  if (!store.connected) return;

  store.setSyncStatus('syncing');
  try {
    const payload = JSON.stringify(buildPayload(), null, 2);
    let { fileId } = store;

    if (fileId) {
      try {
        await updateDriveFile(fileId, payload);
      } catch {
        // File might have been deleted; try to find or create
        fileId = null;
        useDriveStore.getState().setFileId(null);
      }
    }

    if (!fileId) {
      const existingId = await findExistingFileId();
      if (existingId) {
        await updateDriveFile(existingId, payload);
      } else {
        await createDriveFile(payload);
      }
    }

    const iso = new Date().toISOString();
    useDriveStore.getState().setLastSyncedAt(iso);
    useSettingsStore.getState().setLastSyncedAt(iso);
    useDriveStore.getState().setSyncStatus('success');
  } catch (err) {
    useDriveStore.getState().setSyncStatus('error', err instanceof Error ? err.message : 'Sync failed');
    throw err;
  }
}

export async function syncFromDrive(): Promise<void> {
  const store = useDriveStore.getState();
  if (!store.connected) return;

  store.setSyncStatus('syncing');
  try {
    const fileId = store.fileId ?? (await findExistingFileId());

    if (!fileId) {
      // No remote data yet — first use from this device
      useDriveStore.getState().setSyncStatus('idle');
      return;
    }

    const content = await readFileContent(fileId);
    const remote: SyncPayload = JSON.parse(content);
    applyPayload(remote);

    const iso = new Date().toISOString();
    useDriveStore.getState().setLastSyncedAt(iso);
    useSettingsStore.getState().setLastSyncedAt(iso);
    useDriveStore.getState().setSyncStatus('success');
  } catch (err) {
    useDriveStore.getState().setSyncStatus('error', err instanceof Error ? err.message : 'Sync failed');
    throw err;
  }
}

export async function disconnectDrive(): Promise<void> {
  const { accessToken } = useDriveStore.getState();
  if (accessToken) {
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, { method: 'POST' });
    } catch {
      // Ignore — token may already be expired
    }
  }
  tokenClient = null; // Reset singleton so next connect re-initialises
  useDriveStore.getState().disconnect();
}
