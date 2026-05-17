import type { CyclePhase, PhaseInfo } from '../types';

export const PHASE_COLORS: Record<CyclePhase, { bg: string; shadow: string; label: string }> = {
  menstrual:  { bg: '#f7cac9', shadow: '#c98a88', label: 'Menstrual'  },
  follicular: { bg: '#b5ead7', shadow: '#6aab90', label: 'Follicular' },
  ovulation:  { bg: '#ffeaa7', shadow: '#c9a84c', label: 'Ovulation'  },
  luteal:     { bg: '#c9b8f0', shadow: '#7a6fa0', label: 'Luteal'     },
};

export function getCyclePhase(
  startISO: string,
  cycleLen: number,
  periodLen: number,
  today: Date
): PhaseInfo {
  const start = new Date(startISO + 'T00:00:00');
  const day = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const cyclePos = ((day % cycleLen) + cycleLen) % cycleLen + 1;

  let phase: CyclePhase = 'luteal';
  if (cyclePos <= periodLen) phase = 'menstrual';
  else if (cyclePos < cycleLen / 2 - 1) phase = 'follicular';
  else if (cyclePos <= cycleLen / 2 + 1) phase = 'ovulation';

  return { phase, cyclePos, totalLen: cycleLen };
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function fmtDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
  });
}
