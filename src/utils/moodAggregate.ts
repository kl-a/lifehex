import type { Session } from '../types';
import { isoDate } from './cyclePredictor';

export function aggregateByDate(sessions: Session[]): Map<string, number> {
  const byDate = new Map<string, number[]>();
  for (const s of sessions) {
    const k = s.timestamp.slice(0, 10);
    const arr = byDate.get(k) ?? [];
    arr.push(s.mood);
    byDate.set(k, arr);
  }
  const result = new Map<string, number>();
  for (const [k, moods] of byDate) {
    result.set(k, moods.reduce((a, b) => a + b, 0) / moods.length);
  }
  return result;
}

export function sessionsInRange(sessions: Session[], days: number): Session[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return sessions
    .filter((s) => new Date(s.timestamp) >= cutoff)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export function streakDays(sessions: Session[]): number {
  const dates = new Set(sessions.map((s) => s.timestamp.slice(0, 10)));
  const todayStr = isoDate(new Date());
  const start = dates.has(todayStr) ? 0 : 1;
  let streak = 0;
  for (let i = start; i < 120; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (dates.has(isoDate(d))) streak++;
    else break;
  }
  return streak;
}

export function exportJSON(
  sessions: Session[],
  cycles: unknown[],
  settings: unknown
): void {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    sessions,
    cycles,
    settings,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lifehex-${isoDate(new Date())}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
