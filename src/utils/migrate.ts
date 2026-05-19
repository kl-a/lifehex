// Runs before any Zustand store initializes — no store imports allowed here.
// Merges lifehex_* localStorage keys into selene_* keys, handling the case
// where selene_* was already created empty by a previous bad deployment.

function parseStore(key: string): any | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function writeStore(key: string, value: any): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function mergeById(older: any[], newer: any[]): any[] {
  const map = new Map<string, any>();
  for (const item of [...older, ...newer]) {
    if (!item?.id) continue;
    const existing = map.get(item.id);
    const ts = item.updated_at ?? item.created_at ?? '';
    const ets = existing ? (existing.updated_at ?? existing.created_at ?? '') : '';
    if (!existing || ts >= ets) map.set(item.id, item);
  }
  return Array.from(map.values());
}

function mergeByDate(older: any[], newer: any[]): any[] {
  const map = new Map<string, any>();
  for (const item of [...older, ...newer]) {
    if (!item?.date) continue;
    const existing = map.get(item.date);
    const ts = item.updated_at ?? item.created_at ?? '';
    const ets = existing ? (existing.updated_at ?? existing.created_at ?? '') : '';
    if (!existing || ts >= ets) map.set(item.date, item);
  }
  return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
}

// ── sessions ──────────────────────────────────────────────────────────────────
const oldSess = parseStore('lifehex_sessions');
if (oldSess) {
  const newSess = parseStore('selene_sessions');
  const oldItems: any[] = oldSess.state?.sessions ?? [];
  const newItems: any[] = newSess?.state?.sessions ?? [];
  const merged = mergeById(oldItems, newItems);
  const base = newSess ?? oldSess;
  base.state = { ...base.state, sessions: merged };
  writeStore('selene_sessions', base);
  localStorage.removeItem('lifehex_sessions');
}

// ── day record ────────────────────────────────────────────────────────────────
const oldDay = parseStore('lifehex_day');
if (oldDay) {
  const newDay = parseStore('selene_day');
  const oldR = oldDay.state?.dayRecord;
  const newR = newDay?.state?.dayRecord;
  const oldTs = oldR?.updated_at ?? oldR?.created_at ?? '';
  const newTs = newR?.updated_at ?? newR?.created_at ?? '';
  if (!newDay || oldTs > newTs) {
    const base = newDay ?? oldDay;
    base.state = { ...base.state, dayRecord: oldR };
    writeStore('selene_day', base);
  }
  localStorage.removeItem('lifehex_day');
}

// ── day history ───────────────────────────────────────────────────────────────
const oldHist = parseStore('lifehex_day_history');
if (oldHist) {
  const newHist = parseStore('selene_day_history');
  const oldItems: any[] = oldHist.state?.dayRecords ?? [];
  const newItems: any[] = newHist?.state?.dayRecords ?? [];
  const merged = mergeByDate(oldItems, newItems);
  const base = newHist ?? oldHist;
  base.state = { ...base.state, dayRecords: merged };
  writeStore('selene_day_history', base);
  localStorage.removeItem('lifehex_day_history');
}

// ── cycles ────────────────────────────────────────────────────────────────────
const oldCyc = parseStore('lifehex_cycles');
if (oldCyc) {
  const newCyc = parseStore('selene_cycles');
  const oldItems: any[] = oldCyc.state?.cycles ?? [];
  const newItems: any[] = newCyc?.state?.cycles ?? [];
  const merged = mergeById(oldItems, newItems).sort((a: any, b: any) =>
    (b.cycleStartDate ?? '').localeCompare(a.cycleStartDate ?? '')
  );
  const base = newCyc ?? oldCyc;
  base.state = { ...base.state, cycles: merged };
  writeStore('selene_cycles', base);
  localStorage.removeItem('lifehex_cycles');
}

// ── settings ──────────────────────────────────────────────────────────────────
const oldSet = parseStore('lifehex_settings');
if (oldSet) {
  const newSet = parseStore('selene_settings');
  const oldTs = oldSet.state?.updated_at ?? '';
  const newTs = newSet?.state?.updated_at ?? '';
  if (!newSet || oldTs > newTs) {
    writeStore('selene_settings', oldSet);
  }
  localStorage.removeItem('lifehex_settings');
}

// ── drive state ───────────────────────────────────────────────────────────────
const oldDrive = parseStore('lifehex_drive');
if (oldDrive && !parseStore('selene_drive')) {
  writeStore('selene_drive', oldDrive);
  localStorage.removeItem('lifehex_drive');
}
