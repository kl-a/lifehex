import React, { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceArea,
  Radar, RadarChart, PolarGrid, PolarAngleAxis,
} from 'recharts';
import { useHistoryStore } from '../store/historyStore';
import { useDayHistoryStore } from '../store/dayHistoryStore';
import { useDayStore } from '../store/dayStore';
import { useCycleStore } from '../store/cycleStore';
import { useSettingsStore } from '../store/settingsStore';
import { DIMENSIONS, MOOD_EMOJI, REGULATION_EMOJI } from '../data/constants';
import { sessionsInRange } from '../utils/moodAggregate';
import { getCyclePhase, isoDate, PHASE_COLORS } from '../utils/cyclePredictor';
import type { DimensionScores, Session, DayRecord, CycleEntry } from '../types';

// ─── helpers ────────────────────────────────────────────────────────────────

function cutoffDate(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function avgArr(arr: (number | null | undefined)[]): number | null {
  const nums = arr.filter((v): v is number => typeof v === 'number' && !isNaN(v));
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
}

function avgDims(sessions: Session[]): DimensionScores {
  const out = {} as DimensionScores;
  for (const d of DIMENSIONS) {
    const vals = sessions.map(s => s.dimensions[d.key]);
    out[d.key] = vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : 5;
  }
  return out;
}

function daysBetween(a: string, b: string): number {
  return Math.floor((new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()) / 86400000);
}

function localIsoDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDaysToIso(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return isoDate(d);
}

function sessionZone(s: Session): 'green' | 'amber' | 'red' {
  if (s.confirmedZone === 'green' || s.confirmedZone === 'amber' || s.confirmedZone === 'red') return s.confirmedZone;
  if (s.systemZone === 'green' || s.systemZone === 'amber' || s.systemZone === 'red') return s.systemZone;
  return s.mood >= 7 ? 'green' : s.mood >= 4 ? 'amber' : 'red';
}

function dominantZone(sessions: Session[]): 'green' | 'amber' | 'red' | null {
  if (!sessions.length) return null;
  const priority = { red: 2, amber: 1, green: 0 } as const;
  return sessions.reduce((best, s) => {
    const z = sessionZone(s);
    return priority[z] > priority[best] ? z : best;
  }, 'green' as 'green' | 'amber' | 'red');
}

function zoneColor(zone: 'green' | 'amber' | 'red' | null): string {
  if (zone === 'green') return '#b5ead7';
  if (zone === 'amber') return '#ffeaa7';
  if (zone === 'red') return '#f7cac9';
  return '#16213e';
}

function isLutealForDate(dateStr: string, cycles: CycleEntry[], cycleLen: number): boolean {
  const today = isoDate(new Date());
  for (const cycle of cycles) {
    const start = cycle.cycleStartDate;
    const cycleFullEnd = addDaysToIso(start, (cycle.cycleLength || cycleLen) - 1);
    const end = cycleFullEnd < today ? cycleFullEnd : today;
    if (dateStr >= start && dateStr <= end) {
      const dayNum = daysBetween(start, dateStr) + 1;
      return dayNum >= 17;
    }
  }
  // Fall back: use modular arithmetic against most recent cycle start
  if (cycles.length > 0) {
    const dayNum = daysBetween(cycles[0].cycleStartDate, dateStr) + 1;
    const cycleDay = ((dayNum - 1 + cycleLen) % cycleLen) + 1;
    return cycleDay >= 17;
  }
  return false;
}

function zoneStreakFromSessions(sessions: Session[]): { count: number; zone: 'green' | 'amber' | 'red' | null } {
  const dateZoneMap = new Map<string, 'green' | 'amber' | 'red'>();
  const priority = { red: 2, amber: 1, green: 0 } as const;
  for (const s of sessions) {
    const d = s.timestamp.slice(0, 10);
    const existing = dateZoneMap.get(d);
    const z = sessionZone(s);
    if (!existing || priority[z] > priority[existing]) {
      dateZoneMap.set(d, z);
    }
  }
  const todayStr = isoDate(new Date());
  const todayZone = dateZoneMap.get(todayStr) ?? null;
  if (!todayZone) return { count: 0, zone: null };
  let count = 0;
  for (let i = 0; i < 120; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const z = dateZoneMap.get(isoDate(d));
    if (z === todayZone) count++;
    else break;
  }
  return { count, zone: todayZone };
}

// ─── correlation card ────────────────────────────────────────────────────────

function CorrelationCard({
  emoji, label,
  aLabel, bLabel,
  aAvg, bAvg,
  aCount, bCount,
  metric,
  headerRight,
}: {
  emoji: string; label: string;
  aLabel: string; bLabel: string;
  aAvg: number | null; bAvg: number | null;
  aCount: number; bCount: number;
  metric: string;
  headerRight?: React.ReactNode;
}) {
  const minData = 3;
  const enough = aCount >= minData && bCount >= minData;
  const delta = aAvg !== null && bAvg !== null ? aAvg - bAvg : null;
  const arrowColor = delta !== null
    ? (delta > 0.5 ? '#b5ead7' : delta < -0.5 ? '#f7cac9' : '#9b89c4')
    : '#9b89c4';
  const arrow = delta !== null
    ? (delta > 0.5 ? '↑' : delta < -0.5 ? '↓' : '→')
    : '→';

  return (
    <div className="rounded p-3 flex flex-col gap-2" style={{ background: '#16213e', border: '1px solid rgba(155,137,196,0.25)' }}>
      <div className="flex items-center justify-between">
        <div className="font-bold text-[8px] text-muted-purple uppercase tracking-widest">{emoji} {label}</div>
        {headerRight}
      </div>
      <div className="font-body text-[9px] text-muted-purple/60 uppercase tracking-wider">{metric}</div>
      {!enough ? (
        <div className="font-body text-[12px] text-muted-purple">More data needed</div>
      ) : (
        <>
          <div className="flex items-end gap-2">
            <div>
              <div className="font-body text-[10px] text-muted-purple">{aLabel}</div>
              <div className="font-bold text-[18px] text-cloud-white">{aAvg!.toFixed(1)}</div>
            </div>
            <span className="font-bold text-[14px] mb-1" style={{ color: arrowColor }}>{arrow}</span>
            <div>
              <div className="font-body text-[10px] text-muted-purple">{bLabel}</div>
              <div className="font-bold text-[18px] text-cloud-white">{bAvg!.toFixed(1)}</div>
            </div>
          </div>
          {delta !== null && Math.abs(delta) > 0.5 && (
            <div className="font-body text-[10px]" style={{ color: arrowColor }}>
              {delta > 0 ? '+' : ''}{delta.toFixed(1)} difference
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── zone dot strip ──────────────────────────────────────────────────────────

function ZoneDotStrip({ range, sessions, cycles, cycleLen }: {
  range: number;
  sessions: Session[];
  cycles: CycleEntry[];
  cycleLen: number;
}) {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const dates: string[] = [];
  for (let i = range - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    dates.push(isoDate(d));
  }

  const sessionsByDate = new Map<string, Session[]>();
  for (const s of sessions) {
    const d = localIsoDate(s.timestamp);
    const arr = sessionsByDate.get(d) ?? [];
    arr.push(s);
    sessionsByDate.set(d, arr);
  }

  const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="pt-3 mt-3" style={{ borderTop: '1px solid rgba(155,137,196,0.2)' }}>
      <div className="font-bold text-[8px] text-muted-purple uppercase tracking-widest mb-2">Zone per day</div>
      <div className="flex items-end" style={{ gap: 1 }}>
        {dates.map((date, idx) => {
          const daySessions = sessionsByDate.get(date) ?? [];
          const avg = daySessions.length ? daySessions.reduce((a, s) => a + s.mood, 0) / daySessions.length : null;
          const isLuteal = isLutealForDate(date, cycles, cycleLen);
          const dayOfWeek = new Date(date + 'T00:00:00').getDay();
          const isMonday = dayOfWeek === 1;

          let barColor = 'rgba(22,33,62,0.9)';
          let barBorder = 'rgba(155,137,196,0.2)';
          if (avg !== null) {
            if (avg >= 7) { barColor = '#b5ead7'; barBorder = '#6aab90'; }
            else if (avg >= 4) { barColor = '#ffeaa7'; barBorder = '#c9a84c'; }
            else { barColor = '#f7cac9'; barBorder = '#c98a88'; }
          }

          return (
            <React.Fragment key={date}>
              {isMonday && idx > 0 && (
                <div style={{ width: 6, flexShrink: 0, alignSelf: 'stretch', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 2, height: '100%', background: 'rgba(155,137,196,0.5)', borderRadius: 1 }} />
                </div>
              )}
              <div
                className="flex flex-col items-center flex-1"
                style={{ minWidth: 0, gap: 2, cursor: 'default' }}
                onMouseEnter={() => setHoveredDate(date)}
                onMouseLeave={() => setHoveredDate(null)}
              >
                <div
                  className="w-full rounded-sm"
                  style={{
                    height: 14,
                    background: barColor,
                    border: `1px solid ${barBorder}`,
                    boxShadow: isLuteal && avg !== null ? `0 0 0 1px #c9a84c` : 'none',
                    opacity: avg !== null ? 1 : 0.4,
                  }}
                />
                <span style={{ fontSize: 8, color: 'rgba(155,137,196,0.7)', lineHeight: 1, fontWeight: 600 }}>
                  {DAY_LABELS[dayOfWeek]}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
      <div className="font-body text-[10px] text-muted-purple mt-1" style={{ height: 14 }}>
        {hoveredDate && (() => {
          const daySessions = sessionsByDate.get(hoveredDate) ?? [];
          const avg = daySessions.length ? daySessions.reduce((a, s) => a + s.mood, 0) / daySessions.length : null;
          const zoneLabel = avg === null ? 'no data' : avg >= 7 ? 'green' : avg >= 4 ? 'amber' : 'red';
          const fmt = new Date(hoveredDate + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
          return <span>{fmt} · {zoneLabel}{avg !== null ? ` · avg mood ${avg.toFixed(1)} · ${daySessions.length} session${daySessions.length !== 1 ? 's' : ''}` : ''}</span>;
        })()}
      </div>
    </div>
  );
}

// ─── cycle pattern strip ─────────────────────────────────────────────────────

function CyclePatternStrip({ cyclePos }: { cyclePos: number }) {
  const { sessions } = useHistoryStore();
  const { dayRecords } = useDayHistoryStore();
  const { dayRecord } = useDayStore();
  const { cycles } = useCycleStore();
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const moodsByDay = new Map<number, number[]>();
  const flagsByDay = new Set<number>();

  for (const cycle of cycles) {
    const start = cycle.cycleStartDate;
    // Use full cycle window (cycleLength days), not period end date
    const cycleFullEnd = addDaysToIso(start, (cycle.cycleLength || 28) - 1);
    const today = isoDate(new Date());
    const end = cycleFullEnd < today ? cycleFullEnd : today;
    for (const s of sessions) {
      const sessionDate = localIsoDate(s.timestamp);
      if (sessionDate >= start && sessionDate <= end) {
        const cd = daysBetween(start, sessionDate) + 1;
        if (cd >= 1 && cd <= 28) {
          const arr = moodsByDay.get(cd) ?? [];
          arr.push(s.mood);
          moodsByDay.set(cd, arr);
        }
      }
    }
    const allDayRecords = [dayRecord, ...dayRecords];
    for (const dr of allDayRecords) {
      if (dr.thatWasntMe && dr.date >= start && dr.date <= end) {
        const cd = daysBetween(start, dr.date) + 1;
        if (cd >= 1 && cd <= 28) flagsByDay.add(cd);
      }
    }
  }

  const avgMood = (day: number): number | null => {
    const arr = moodsByDay.get(day);
    if (!arr || !arr.length) return null;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  };

  function moodFill(avg: number | null): string {
    if (avg === null) return 'transparent';
    if (avg >= 7) return 'rgba(181,234,215,0.7)';
    if (avg >= 4) return 'rgba(255,234,167,0.7)';
    return 'rgba(247,202,201,0.7)';
  }
  function moodBorder(avg: number | null): string {
    if (avg === null) return '1px dashed rgba(155,137,196,0.3)';
    if (avg >= 7) return '1px solid #6aab90';
    if (avg >= 4) return '1px solid #c9a84c';
    return '1px solid #c98a88';
  }

  const PHASE_LABELS = [
    { label: 'M', from: 1, to: 5, color: '#f7cac9' },
    { label: 'F', from: 6, to: 13, color: '#b5ead7' },
    { label: 'O', from: 14, to: 15, color: '#ffeaa7' },
    { label: 'L', from: 16, to: 28, color: '#c9b8f0' },
  ];

  return (
    <div className="card-indigo flex-shrink-0 flex flex-col gap-2">
      <div>
        <div className="font-bold text-[9px] uppercase tracking-widest text-star-gold">Your Cycle Pattern</div>
        <div className="font-body text-[11px] text-muted-purple mt-0.5">
          Average across all logged cycles · {cycles.length} cycle{cycles.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4">
        {[
          { color: 'rgba(181,234,215,0.7)', border: '#6aab90', label: 'Avg mood ≥ 7' },
          { color: 'rgba(255,234,167,0.7)', border: '#c9a84c', label: '4–6.9' },
          { color: 'rgba(247,202,201,0.7)', border: '#c98a88', label: '< 4' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: l.color, border: `1px solid ${l.border}` }} />
            <span className="font-body text-[10px] text-muted-purple">{l.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ border: '2px solid #ffe066' }} />
          <span className="font-body text-[10px] text-muted-purple">Today</span>
        </div>
      </div>

      {/* Phase labels */}
      <div className="relative" style={{ height: 16 }}>
        {PHASE_LABELS.map(p => {
          const leftPct = ((p.from - 1) / 28) * 100;
          const widthPct = ((p.to - p.from + 1) / 28) * 100;
          return (
            <div key={p.label} className="absolute flex items-center justify-center font-bold text-[8px]"
              style={{ left: `${leftPct}%`, width: `${widthPct}%`, color: p.color, top: 0, bottom: 0 }}>
              {p.label}
            </div>
          );
        })}
      </div>

      {/* 28-day mood blocks */}
      <div className="flex gap-0.5">
        {Array.from({ length: 28 }, (_, i) => {
          const day = i + 1;
          const avg = avgMood(day);
          const isToday = day === cyclePos;
          return (
            <div key={day} className="flex-1 flex flex-col items-center gap-0.5"
              onMouseEnter={() => setHoveredDay(day)} onMouseLeave={() => setHoveredDay(null)}>
              <div className="w-full rounded-sm" style={{
                height: 24,
                background: moodFill(avg),
                border: isToday ? '2px solid #ffe066' : moodBorder(avg),
                boxShadow: isToday ? '0 0 6px rgba(255,224,102,0.5)' : 'none',
              }} />
              {day % 7 === 1 || day === 28
                ? <span className="font-bold text-[6px]" style={{ color: 'rgba(155,137,196,0.5)' }}>{day}</span>
                : <span style={{ height: 9 }} />}
            </div>
          );
        })}
      </div>

      {/* "That wasn't me" strip */}
      <div>
        <div className="font-body text-[10px] text-muted-purple mb-1">that wasn't me</div>
        <div className="flex gap-0.5">
          {Array.from({ length: 28 }, (_, i) => {
            const day = i + 1;
            return (
              <div key={day} className="flex-1 rounded-sm" style={{
                height: 14,
                background: flagsByDay.has(day) ? 'rgba(247,202,201,0.6)' : 'transparent',
                border: flagsByDay.has(day) ? '1px solid #c98a88' : '1px solid rgba(155,137,196,0.12)',
              }} />
            );
          })}
        </div>
      </div>

      {/* Hover tooltip — fixed height */}
      <div className="font-body text-[11px] text-center" style={{ height: 16 }}>
        {hoveredDay !== null && (() => {
          const avg = avgMood(hoveredDay);
          const count = moodsByDay.get(hoveredDay)?.length ?? 0;
          const flags = flagsByDay.has(hoveredDay) ? 1 : 0;
          return (
            <span className="text-muted-purple">
              Day {hoveredDay} · {avg !== null ? `Avg mood ${avg.toFixed(1)}` : 'No data'} · {count} session{count !== 1 ? 's' : ''}{flags ? ' · 1 flag' : ''}
            </span>
          );
        })()}
      </div>
    </div>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

export function Dashboard() {
  const { sessions } = useHistoryStore();
  const { dayRecords } = useDayHistoryStore();
  const { dayRecord } = useDayStore();
  const { cycles } = useCycleStore();
  const { expectedCycleLength: cycleLen, expectedPeriodLength: periodLen } = useSettingsStore();
  const [range, setRange] = useState(30);
  const [drivingMetric, setDrivingMetric] = useState<'mood' | 'energy' | 'regulation'>('mood');
  const [medMetric, setMedMetric] = useState<'dex' | 'ssri'>('dex');

  // ── window data ──
  const cutoff = cutoffDate(range);
  const prevCutoff = cutoffDate(range * 2);
  const cutoffStr = isoDate(cutoff);

  const inRange = sessionsInRange(sessions, range);
  const prevInRange = sessions.filter(s => {
    const d = new Date(s.timestamp);
    return d >= prevCutoff && d < cutoff;
  });

  const allDayRecords: DayRecord[] = [dayRecord, ...dayRecords];
  const dayRecordsInRange = allDayRecords.filter(dr => dr.date >= cutoffStr);

  // ── aggregate stats ──
  const moodAvg = avgArr(inRange.map(s => s.mood));
  const regAvg = avgArr(inRange.map(s => s.emotionalRegulation));
  const daysLogged = new Set(inRange.map(s => localIsoDate(s.timestamp))).size;

  // ── cycle ──
  const cycleStartISO = cycles.length ? cycles[0].cycleStartDate : isoDate(new Date());
  const phaseInfo = getCyclePhase(cycleStartISO, cycleLen, periodLen, new Date());
  const daysUntilLuteal = 17 - phaseInfo.cyclePos;
  const lutealDay = phaseInfo.cyclePos >= 17 ? phaseInfo.cyclePos - 16 : 0;
  const daysUntilPeriod = phaseInfo.totalLen - phaseInfo.cyclePos;

  // ── zone streak ──
  const zoneStreak = zoneStreakFromSessions(sessions);
  const streakZoneColor = zoneColor(zoneStreak.zone);

  // ── synthesis sentence ──
  function synthesize(): { text: string; color: string } {
    if (cycles.length > 0 && phaseInfo.phase === 'luteal') {
      let text = `🌙 Luteal phase — day ${lutealDay} of ~${daysUntilPeriod + lutealDay}.`;
      if (regAvg !== null && regAvg < 6) text += ' Your regulation has been lower than usual. Be gentle.';
      return { text, color: '#ffeaa7' };
    }
    if (cycles.length > 0 && daysUntilLuteal > 0 && daysUntilLuteal <= 5) {
      return { text: `🌙 Luteal phase in ${daysUntilLuteal} day${daysUntilLuteal === 1 ? '' : 's'}. Worth protecting your schedule this week.`, color: '#ffeaa7' };
    }
    if (zoneStreak.zone === 'green' && zoneStreak.count >= 5) {
      return { text: `✨ ${zoneStreak.count} green days in a row. ${PHASE_COLORS[phaseInfo.phase].label} phase — this is often your strongest window.`, color: '#b5ead7' };
    }
    // Count harder days in range
    const sessionsByDate7 = new Map<string, Session[]>();
    const w7 = sessionsInRange(sessions, 7);
    for (const s of w7) {
      const d = s.timestamp.slice(0, 10);
      const arr = sessionsByDate7.get(d) ?? []; arr.push(s); sessionsByDate7.set(d, arr);
    }
    const hardDays = [...sessionsByDate7.values()].filter(ss => dominantZone(ss) !== 'green').length;
    if (hardDays >= 3) {
      return { text: `⚠️ ${hardDays} harder days this week.${phaseInfo.phase === 'luteal' ? ' This matches your luteal phase pattern.' : ''}`, color: '#f7cac9' };
    }
    if (regAvg !== null && regAvg < 5) {
      return { text: `🔴 Your regulation average has been below 5 for the last ${range} days. Consider booking something restorative.`, color: '#f7cac9' };
    }
    return {
      text: `📊 ${inRange.length} session${inRange.length !== 1 ? 's' : ''} logged over ${range} days · ${daysLogged} day${daysLogged !== 1 ? 's' : ''} tracked · Avg mood ${moodAvg?.toFixed(1) ?? '—'} · Avg regulation ${regAvg?.toFixed(1) ?? '—'}`,
      color: '#9b89c4',
    };
  }
  const synthesis = synthesize();

  // ── stat pills ──
  const phaseColor = PHASE_COLORS[phaseInfo.phase].bg;
  let cyclePositionText = '—';
  if (cycles.length > 0) {
    if (phaseInfo.phase === 'luteal') {
      cyclePositionText = `🌙 Luteal day ${lutealDay}`;
    } else {
      cyclePositionText = `${PHASE_COLORS[phaseInfo.phase].label} · ${daysUntilLuteal}d to luteal`;
    }
  }

  // ── feeling chart data (aggregated per day to avoid duplicate x-axis labels) ──
  const sessionsByLocalDate = new Map<string, Session[]>();
  for (const s of inRange) {
    const d = new Date(s.timestamp);
    const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const arr = sessionsByLocalDate.get(localDate) ?? [];
    arr.push(s);
    sessionsByLocalDate.set(localDate, arr);
  }
  const feelingData = Array.from(sessionsByLocalDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateStr, daySessions]) => ({
      date: new Date(dateStr + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
      mood: +((avgArr(daySessions.map(s => s.mood)) ?? 0).toFixed(1)),
      energy: +((avgArr(daySessions.map(s => s.energy)) ?? 0).toFixed(1)),
      reg: +((avgArr(daySessions.map(s => s.emotionalRegulation)) ?? 0).toFixed(1)),
    }));

  // Reference areas for feeling chart
  const lutealBands: { x1: string; x2: string }[] = [];
  const menstruationBands: { x1: string; x2: string }[] = [];
  for (const cycle of cycles) {
    const lutealStartDate = addDaysToIso(cycle.cycleStartDate, 16);
    const lutealEndDate = addDaysToIso(cycle.cycleStartDate, (cycle.cycleLength || cycleLen) - 1);
    if (lutealEndDate >= cutoffStr) {
      const x1 = new Date(lutealStartDate + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
      // x2 = one day past end so Recharts extends the band to include the last day's full column
      const x2 = new Date(addDaysToIso(lutealEndDate, 1) + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
      lutealBands.push({ x1, x2 });
    }
    // Use the logged period end date if available; fall back to periodLength estimate
    const periodEndDate = cycle.cycleEndDate || addDaysToIso(cycle.cycleStartDate, (cycle.periodLength || periodLen) - 1);
    if (periodEndDate >= cutoffStr) {
      const x1 = new Date(cycle.cycleStartDate + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
      const x2 = new Date(addDaysToIso(periodEndDate, 1) + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
      menstruationBands.push({ x1, x2 });
    }
  }

  // ── balance drift radar ──
  const currentAvg = avgDims(inRange);
  const prevAvg = avgDims(prevInRange);
  const radarData = DIMENSIONS.map(d => ({
    subject: d.short,
    current: +currentAvg[d.key].toFixed(1),
    previous: +prevAvg[d.key].toFixed(1),
  }));

  const drifts = DIMENSIONS.map(d => ({
    short: d.short,
    delta: currentAvg[d.key] - prevAvg[d.key],
  })).sort((a, b) => b.delta - a.delta);
  const hasMeaningfulDrift = drifts.some(d => Math.abs(d.delta) > 0.3) && prevInRange.length > 0;
  const positiveDrifts = drifts.filter(d => d.delta > 0.3).slice(0, 3);
  const negativeDrifts = [...drifts].reverse().filter(d => d.delta < -0.3).slice(0, 3);

  // ── correlation data ──
  const sessionsByDate = new Map<string, Session[]>();
  for (const s of inRange) {
    const d = localIsoDate(s.timestamp);
    const arr = sessionsByDate.get(d) ?? []; arr.push(s); sessionsByDate.set(d, arr);
  }
  // All sessions by date — used for cycle phase only, so we don't miss luteal windows outside the selected range
  const allSessionsByDate = new Map<string, Session[]>();
  for (const s of sessions) {
    const d = localIsoDate(s.timestamp);
    const arr = allSessionsByDate.get(d) ?? []; arr.push(s); allSessionsByDate.set(d, arr);
  }
  const dayRecordByDate = new Map<string, DayRecord>();
  for (const dr of dayRecordsInRange) dayRecordByDate.set(dr.date, dr);

  // Per-day triple: mood / energy / regulation — nullable so old sessions missing reg still count
  interface DayStat { mood: number | null; energy: number | null; reg: number | null }
  const pick = (stat: DayStat): number | null =>
    drivingMetric === 'mood' ? stat.mood : drivingMetric === 'energy' ? stat.energy : stat.reg;
  // Returns non-null values for the selected metric — used for both avg and count
  const pickVals = (days: DayStat[]) =>
    days.map(pick).filter((v): v is number => v !== null);

  function dayStats(daySessions: Session[]): DayStat | null {
    const m = avgArr(daySessions.map(s => s.mood));
    const e = avgArr(daySessions.map(s => s.energy));
    const r = avgArr(daySessions.map(s => s.emotionalRegulation));
    if (m === null && e === null && r === null) return null;  // No data at all
    return { mood: m, energy: e, reg: r };
  }

  // Medication vs no medication — DEX is weekdays only; SSRI includes all days
  const medDays: DayStat[] = [], noMedDays: DayStat[] = [];
  for (const [date, daySessions] of sessionsByDate) {
    const dr = dayRecordByDate.get(date);
    if (!dr) continue;
    const stat = dayStats(daySessions);
    if (!stat) continue;
    const dow = new Date(date + 'T00:00:00').getDay();
    if (medMetric === 'dex' && (dow === 0 || dow === 6)) continue;
    const taken = medMetric === 'dex' ? dr.medicationTaken : (dr.ssriTaken ?? false);
    if (taken) medDays.push(stat);
    else noMedDays.push(stat);
  }

  // Luteal vs non-luteal — use full session history so data isn't limited to the selected range window
  const lutealDays: DayStat[] = [], nonLutealDays: DayStat[] = [];
  for (const [date, daySessions] of allSessionsByDate) {
    const stat = dayStats(daySessions);
    if (!stat) continue;
    if (isLutealForDate(date, cycles, cycleLen)) lutealDays.push(stat);
    else nonLutealDays.push(stat);
  }

  // Gym vs no gym
  const gymDays: DayStat[] = [], noGymDays: DayStat[] = [];
  for (const [date, daySessions] of sessionsByDate) {
    const dr = dayRecordByDate.get(date);
    if (!dr) continue;
    const stat = dayStats(daySessions);
    if (!stat) continue;
    if (dr.gymToday) gymDays.push(stat);
    else noGymDays.push(stat);
  }

  // 3 meals vs fewer
  const fullMealDays: DayStat[] = [], fewMealDays: DayStat[] = [];
  for (const [date, daySessions] of sessionsByDate) {
    const dr = dayRecordByDate.get(date);
    if (!dr) continue;
    const stat = dayStats(daySessions);
    if (!stat) continue;
    const mealCount = dr.meals.filter(m => m.logged).length;
    if (mealCount >= 3) fullMealDays.push(stat);
    else fewMealDays.push(stat);
  }

  const metricLabel = drivingMetric === 'mood' ? 'vs. mood' : drivingMetric === 'energy' ? 'vs. energy' : 'vs. regulation';

  return (
    <div className="flex flex-col gap-2 overflow-hidden" style={{ height: 'calc(100vh - 104px)' }}>

      <PageHeader
        title="Stats"
        right={
          <div className="flex rounded overflow-hidden" style={{ border: '1px solid rgba(155,137,196,0.4)' }}>
            {([7, 30, 90] as const).map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`font-bold text-[8px] px-3 py-2 transition-colors ${range === r ? 'text-butter' : 'text-muted-purple hover:text-cloud-white'}`}
                style={{ background: range === r ? 'rgba(155,137,196,0.2)' : 'transparent' }}
              >
                {r}d
              </button>
            ))}
          </div>
        }
      />

      {/* Headline card */}
      <div className="card-indigo flex-shrink-0">
        <div className="font-body text-[14px] leading-relaxed mb-2" style={{ color: synthesis.color }}>
          {synthesis.text}
        </div>
        <div className="grid grid-cols-4 gap-2">
          <StatPill emoji={moodAvg !== null ? MOOD_EMOJI(moodAvg) : '😶'} label="Avg Mood" value={moodAvg?.toFixed(1) ?? '—'} color="#ffe066" />
          <StatPill emoji={regAvg !== null ? REGULATION_EMOJI(regAvg) : '😤'} label="Avg Regulation" value={regAvg?.toFixed(1) ?? '—'} color="#c9b8f0" />
          <StatPill
            emoji="🔥"
            label={`${zoneStreak.zone ?? 'No'} streak`}
            value={zoneStreak.count > 0 ? `${zoneStreak.count}d` : '—'}
            color={streakZoneColor}
          />
          <StatPill emoji="🌙" label="Cycle" value={cyclePositionText} color={phaseColor} small />
        </div>
      </div>

      {/* Main two-column area */}
      <div className="flex-1 min-h-0 grid gap-2" style={{ gridTemplateColumns: '2fr 1fr', gridTemplateRows: '1fr', alignItems: 'stretch' }}>

        {/* LEFT: Feeling chart + Cycle pattern */}
        <div className="flex flex-col gap-2 min-h-0">
        <div className="card-indigo flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="font-bold text-[9px] uppercase tracking-widest text-star-gold mb-1">Feeling Chart</div>
          <div className="font-body text-[11px] text-muted-purple mb-3">{range}d · mood / energy / regulation</div>

          {feelingData.length < 2 ? (
            <div className="flex-1 flex items-center justify-center font-body text-[13px] text-muted-purple">
              Log a few sessions to see your trend.
            </div>
          ) : (
            <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={feelingData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid stroke="#7a6fa0" strokeOpacity={0.15} horizontal vertical={false} />
                {menstruationBands.map((b, i) => (
                  <ReferenceArea key={`mens-${i}`} x1={b.x1} x2={b.x2} fill="rgba(247,202,201,0.2)" strokeOpacity={0} />
                ))}
                {lutealBands.map((b, i) => (
                  <ReferenceArea key={`lut-${i}`} x1={b.x1} x2={b.x2} fill="rgba(255,234,167,0.1)" strokeOpacity={0} />
                ))}
                <XAxis dataKey="date" tick={{ fontFamily: 'Nunito', fontSize: 9, fill: '#7a6fa0', angle: -90, textAnchor: 'end', dominantBaseline: 'auto' }} tickLine={false} axisLine={false} interval={0} height={52} />
                <YAxis domain={[1, 10]} tick={{ fontFamily: 'Nunito', fontSize: 10, fill: '#7a6fa0' }} tickLine={false} axisLine={false} ticks={[1, 5, 10]} />
                <Tooltip
                  contentStyle={{ background: '#16213e', border: '1px solid rgba(155,137,196,0.4)', borderRadius: 4, fontFamily: 'Nunito', fontSize: 12 }}
                  labelStyle={{ color: '#9b89c4', fontSize: 11 }}
                />
                <Line type="monotone" dataKey="mood" name="Mood" stroke="#ffe066" strokeWidth={2.5} dot={{ fill: '#ffe066', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: '#ffe066' }} />
                <Line type="monotone" dataKey="energy" name="Energy" stroke="#b5ead7" strokeWidth={1.5} dot={{ fill: '#b5ead7', r: 2, strokeWidth: 0 }} activeDot={{ r: 5 }} strokeDasharray="4 2" />
                <Line type="monotone" dataKey="reg" name="Regulation" stroke="#c9b8f0" strokeWidth={1.5} dot={{ fill: '#c9b8f0', r: 2, strokeWidth: 0 }} activeDot={{ r: 5 }} strokeDasharray="2 3" />
              </LineChart>
            </ResponsiveContainer>
            </div>
          )}

          {/* Legend */}
          <div className="flex gap-4 mt-1 flex-shrink-0">
            <LegendLine color="#ffe066" label="Mood" />
            <LegendLine color="#b5ead7" label="Energy" dashed />
            <LegendLine color="#c9b8f0" label="Regulation" dashed />
            {cycles.length > 0 && <div className="flex items-center gap-1.5"><div className="w-4 h-2 rounded" style={{ background: 'rgba(255,234,167,0.25)' }} /><span className="font-body text-[10px] text-muted-purple">Luteal</span></div>}
            {cycles.length > 0 && <div className="flex items-center gap-1.5"><div className="w-4 h-2 rounded" style={{ background: 'rgba(247,202,201,0.45)' }} /><span className="font-body text-[10px] text-muted-purple">Period</span></div>}
          </div>

          {/* Zone dot strip */}
          <ZoneDotStrip range={range} sessions={inRange} cycles={cycles} cycleLen={cycleLen} />
        </div>

        {/* Cycle pattern strip under feeling chart */}
        <CyclePatternStrip cyclePos={phaseInfo.cyclePos} />
        </div>

        {/* RIGHT: Correlation cards + Balance drift radar */}
        <div className="flex flex-col gap-2 min-h-0">

          {/* Correlation cards 2×2 */}
          <div className="card-indigo flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-[9px] uppercase tracking-widest text-star-gold">What's driving it</div>
              <div className="flex gap-1">
                {(['mood', 'energy', 'regulation'] as const).map(m => (
                  <button key={m} onClick={() => setDrivingMetric(m)}
                    className={`font-bold text-[9px] px-2 py-0.5 rounded border transition-colors ${drivingMetric === m ? 'text-star-gold border-star-gold/60 bg-star-gold/10' : 'text-muted-purple border-muted-purple/30 hover:text-cloud-white'}`}>
                    {m === 'mood' ? 'Mood' : m === 'energy' ? 'Energy' : 'Reg'}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <CorrelationCard
                emoji="💊" label="Medication"
                aLabel={medMetric === 'dex' ? 'Medicated' : 'SSRI'}
                bLabel={medMetric === 'dex' ? 'Unmedicated' : 'No SSRI'}
                aAvg={avgArr(pickVals(medDays))} bAvg={avgArr(pickVals(noMedDays))}
                aCount={pickVals(medDays).length} bCount={pickVals(noMedDays).length}
                metric={metricLabel}
                headerRight={
                  <div className="flex gap-1">
                    {(['dex', 'ssri'] as const).map(m => (
                      <button key={m} onClick={() => setMedMetric(m)}
                        className={`font-bold text-[8px] px-1.5 py-0.5 rounded border transition-colors ${medMetric === m ? 'text-star-gold border-star-gold/60 bg-star-gold/10' : 'text-muted-purple border-muted-purple/30 hover:text-cloud-white'}`}>
                        {m === 'dex' ? 'DEX' : 'SSRI'}
                      </button>
                    ))}
                  </div>
                }
              />
              <CorrelationCard emoji="🌙" label="Cycle phase" aLabel="Non-luteal" bLabel="Luteal" aAvg={avgArr(pickVals(nonLutealDays))} bAvg={avgArr(pickVals(lutealDays))} aCount={pickVals(nonLutealDays).length} bCount={pickVals(lutealDays).length} metric={metricLabel} />
              <CorrelationCard emoji="🏋️" label="Movement" aLabel="Gym days" bLabel="Rest days" aAvg={avgArr(pickVals(gymDays))} bAvg={avgArr(pickVals(noGymDays))} aCount={pickVals(gymDays).length} bCount={pickVals(noGymDays).length} metric={metricLabel} />
              <CorrelationCard emoji="🍱" label="Meals" aLabel="3 meals" bLabel="Fewer" aAvg={avgArr(pickVals(fullMealDays))} bAvg={avgArr(pickVals(fewMealDays))} aCount={pickVals(fullMealDays).length} bCount={pickVals(fewMealDays).length} metric={metricLabel} />
            </div>
          </div>

          {/* Balance drift radar */}
          <div className="card-indigo flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="font-bold text-[9px] uppercase tracking-widest text-star-gold mb-1 flex-shrink-0">Balance Drift</div>
            <div className="font-body text-[11px] text-muted-purple mb-1 flex-shrink-0">Last {range}d vs prior {range}d</div>

            {inRange.length === 0 ? (
              <div className="flex-1 flex items-center justify-center font-body text-[12px] text-muted-purple text-center">Keep logging to see how your balance shifts.</div>
            ) : (
              <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="62%">
                  <PolarGrid stroke="#7a6fa0" strokeOpacity={0.25} />
                  <PolarAngleAxis dataKey="subject" tick={{ fontFamily: "'Press Start 2P'", fontSize: 6, fill: '#9b89c4' }} />
                  <Radar dataKey="previous" stroke="#9b89c4" fill="rgba(155,137,196,0.1)" strokeWidth={1.5} name={`Prior ${range}d`} />
                  <Radar dataKey="current" stroke="#ffe066" fill="rgba(255,224,102,0.2)" strokeWidth={2} name={`Last ${range}d`} />
                </RadarChart>
              </ResponsiveContainer>
              </div>
            )}

            <div className="flex gap-4 justify-center mt-1 mb-1 flex-shrink-0">
              <LegendLine color="#ffe066" label={`Last ${range}d`} />
              <LegendLine color="#9b89c4" label={`Prior ${range}d`} dashed />
            </div>

            {/* Drift table */}
            {hasMeaningfulDrift && (
              <div className="flex flex-col gap-1 flex-shrink-0" style={{ borderTop: '1px solid rgba(155,137,196,0.2)', paddingTop: 8 }}>
                {positiveDrifts.map(d => (
                  <div key={d.short} className="flex justify-between items-center">
                    <span className="font-body text-[11px] text-muted-purple">{d.short}</span>
                    <span className="font-bold text-[10px]" style={{ color: '#b5ead7' }}>↑ +{d.delta.toFixed(1)}</span>
                  </div>
                ))}
                {negativeDrifts.map(d => (
                  <div key={d.short} className="flex justify-between items-center">
                    <span className="font-body text-[11px] text-muted-purple">{d.short}</span>
                    <span className="font-bold text-[10px]" style={{ color: '#f7cac9' }}>↓ {d.delta.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

// ─── small components ────────────────────────────────────────────────────────

function StatPill({ emoji, label, value, color, small }: { emoji: string; label: string; value: string; color: string; small?: boolean }) {
  return (
    <div className="rounded flex flex-col gap-1.5 p-3" style={{ background: '#16213e', border: '1px solid rgba(155,137,196,0.25)' }}>
      <div className="font-bold text-[7px] uppercase tracking-widest text-muted-purple">{label}</div>
      <div className={`font-body font-bold ${small ? 'text-[11px]' : 'text-[15px]'} leading-tight`} style={{ color }}>{emoji} {value}</div>
    </div>
  );
}

function LegendLine({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <svg width="16" height="6"><line x1="0" y1="3" x2="16" y2="3" stroke={color} strokeWidth="2" strokeDasharray={dashed ? '4 2' : undefined} /></svg>
      <span className="font-body text-[10px] text-muted-purple">{label}</span>
    </span>
  );
}
