import { useState } from 'react';
import { MoonIcon } from '../components/MoonIcon';
import { PageHeader } from '../components/PageHeader';
import { useCycleStore } from '../store/cycleStore';
import { useSettingsStore } from '../store/settingsStore';
import { useHistoryStore } from '../store/historyStore';
import { useDayHistoryStore } from '../store/dayHistoryStore';
import { useDayStore } from '../store/dayStore';
import { getCyclePhase, isoDate, fmtDate, PHASE_COLORS } from '../utils/cyclePredictor';
import { v4 as uuid } from 'uuid';

// ─── helpers ────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  return Math.floor((new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()) / 86400000);
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return isoDate(d);
}

function fmtFull(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'long' });
}

// ─── sub-components ─────────────────────────────────────────────────────────

function SettingSlider({ label, min, max, value, onChange, unit }: { label: string; min: number; max: number; value: number; onChange: (n: number) => void; unit: string }) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="font-body text-[13px] font-semibold text-cloud-white">{label}</span>
        <span className="font-bold text-[9px] text-butter">{value} {unit}</span>
      </div>
      <input type="range" min={min} max={max} step="1" className="pixslider w-full" value={value} onChange={(e) => onChange(parseInt(e.target.value, 10))} />
    </div>
  );
}

function DateInput({ value, onChange, max }: { value: string; onChange: (v: string) => void; max?: string }) {
  return (
    <input type="date" value={value} max={max} onChange={(e) => onChange(e.target.value)}
      className="w-full bg-night-sky border border-muted-purple/40 rounded px-3 py-2 text-sm text-cloud-white focus:outline-none focus:border-muted-purple/80 transition-colors"
      style={{ colorScheme: 'dark' }} />
  );
}

function PhasePillBar({ cycleLen, periodLen, actualDays }: { cycleLen: number; periodLen: number; actualDays: number | null }) {
  const len = actualDays ?? cycleLen;
  const capped = Math.min(len, cycleLen);
  const ovDay = Math.floor(cycleLen / 2) - 1;
  const lutDay = Math.floor(cycleLen / 2) + 1;
  const segs = [
    { color: '#f7cac9', pct: (Math.min(periodLen, capped) / cycleLen) * 100 },
    { color: '#b5ead7', pct: (Math.max(0, Math.min(ovDay - periodLen, capped - periodLen)) / cycleLen) * 100 },
    { color: '#ffeaa7', pct: (Math.max(0, Math.min(2, capped - ovDay)) / cycleLen) * 100 },
    { color: '#c9b8f0', pct: (Math.max(0, capped - lutDay) / cycleLen) * 100 },
  ];
  return (
    <div className="flex rounded overflow-hidden" style={{ height: 6, width: '100%' }}>
      {segs.map((s, i) => s.pct > 0 && <div key={i} style={{ width: `${s.pct}%`, background: s.color }} />)}
    </div>
  );
}

// ─── 28-day pattern card ────────────────────────────────────────────────────

function CyclePatternCard({ cyclePos }: { cyclePos: number }) {
  const { sessions } = useHistoryStore();
  const { dayRecords } = useDayHistoryStore();
  const { dayRecord } = useDayStore();
  const { cycles } = useCycleStore();
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  // Build mood map: cycleDay (1-28) → [mood values]
  const moodsByDay = new Map<number, number[]>();
  const flagsByDay = new Set<number>();

  for (const cycle of cycles) {
    const start = cycle.cycleStartDate;
    const end = cycle.cycleEndDate ?? isoDate(new Date());

    for (const s of sessions) {
      const sessionDate = s.timestamp.slice(0, 10);
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
    if (!arr || arr.length === 0) return null;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  };

  function moodColor(avg: number | null): string {
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

  const hasData = moodsByDay.size > 0;
  const cycleCount = cycles.length;

  return (
    <div className="card-indigo flex flex-col gap-3">
      <div>
        <div className="font-bold text-[9px] uppercase tracking-widest text-star-gold">Your Cycle Pattern</div>
        <div className="font-body text-[11px] text-muted-purple mt-0.5">
          Average across all logged cycles · {cycleCount} cycle{cycleCount !== 1 ? 's' : ''}
        </div>
      </div>

      {!hasData && (
        <div className="font-body text-[11px] text-muted-purple/70 text-center py-2">
          This fills in as you log more sessions. Keep going.
        </div>
      )}

      {/* Phase labels */}
      <div className="relative" style={{ height: 16 }}>
        {PHASE_LABELS.map((p) => {
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
                height: 36,
                background: moodColor(avg),
                border: isToday ? '2px solid #ffe066' : moodBorder(avg),
                boxShadow: isToday ? '0 0 6px rgba(255,224,102,0.5)' : 'none',
              }} />
              {day % 7 === 1 || day === 28 ? (
                <span className="font-bold text-[6px]" style={{ color: 'rgba(155,137,196,0.5)' }}>{day}</span>
              ) : <span style={{ height: 9 }} />}
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

      {/* Hover tooltip — fixed height so it never shifts layout */}
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

export function Cycle() {
  const { cycles, logStart, logEnd, updateCycle, removeCycle, addCycleEntry } = useCycleStore();
  const { expectedCycleLength: cycleLen, expectedPeriodLength: periodLen, setExpectedCycleLength, setExpectedPeriodLength } = useSettingsStore();

  const today = new Date();
  const startISO = cycles.length ? cycles[0].cycleStartDate : isoDate(today);
  const phaseInfo = getCyclePhase(startISO, cycleLen, periodLen, today);
  const periodActive = cycles.length > 0 && !cycles[0].cycleEndDate;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [addingOpen, setAddingOpen] = useState(false);
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Luteal warning logic
  const lutealStartDay = 17;
  const daysUntilLuteal = lutealStartDay - phaseInfo.cyclePos;
  const isInLuteal = phaseInfo.phase === 'luteal';
  const isApproachingLuteal = daysUntilLuteal > 0 && daysUntilLuteal <= 7;
  const lutealDayOfPhase = isInLuteal ? phaseInfo.cyclePos - lutealStartDay + 1 : 0;
  const daysUntilPeriod = phaseInfo.totalLen - phaseInfo.cyclePos;
  const periodExpectedDate = addDays(isoDate(today), daysUntilPeriod);

  // Phase ring geometry
  const size = 240, cx = size / 2, cy = size / 2;
  const R = size / 2 - 14;    // outer radius = 106
  const r = R - 38;            // inner radius = 68  → ring thickness 38
  const midR = (R + r) / 2;   // stroke mid-radius = 87
  const ringW = R - r;        // stroke width = 38
  const gapAngle = 0.028;     // small angular gap between segments
  const total = cycleLen;
  const dayAngle = (d: number) => -Math.PI / 2 + ((d - 1) / total) * 2 * Math.PI;

  const ringArcs = [
    { from: 1,             to: periodLen,      color: '#f7cac9', phase: 'menstrual'  },
    { from: periodLen + 1, to: total / 2 - 1,  color: '#b5ead7', phase: 'follicular' },
    { from: total / 2 - 1, to: total / 2 + 1,  color: '#ffeaa7', phase: 'ovulation'  },
    { from: total / 2 + 1, to: total,           color: '#c9b8f0', phase: 'luteal'     },
  ];

  function arcPath(from: number, to: number): string {
    const a0 = dayAngle(from) + gapAngle;
    const a1 = dayAngle(to + 1) - gapAngle;
    const x0 = cx + Math.cos(a0) * midR, y0 = cy + Math.sin(a0) * midR;
    const x1 = cx + Math.cos(a1) * midR, y1 = cy + Math.sin(a1) * midR;
    const large = (to - from + 1) / total > 0.5 ? 1 : 0;
    return `M ${x0} ${y0} A ${midR} ${midR} 0 ${large} 1 ${x1} ${y1}`;
  }

  const markerAngle = dayAngle(phaseInfo.cyclePos);
  const mx = cx + Math.cos(markerAngle) * midR;
  const my = cy + Math.sin(markerAngle) * midR;

  function handleStart() {
    if (periodActive) return;
    const now = new Date().toISOString();
    logStart({ id: uuid(), cycleStartDate: isoDate(today), cycleEndDate: null, cycleLength: cycleLen, periodLength: periodLen, created_at: now, updated_at: now });
  }

  function handleEnd() {
    if (!periodActive || !cycles[0]) return;
    logEnd(cycles[0].id, isoDate(today));
  }

  function handleAddCycle() {
    if (!newStart) return;
    const now = new Date().toISOString();
    addCycleEntry({ id: uuid(), cycleStartDate: newStart, cycleEndDate: newEnd || null, cycleLength: cycleLen, periodLength: periodLen, created_at: now, updated_at: now });
    setNewStart(''); setNewEnd(''); setAddingOpen(false);
  }

  function handleSaveEdit(id: string) {
    if (!editStart) return;
    updateCycle(id, { cycleStartDate: editStart, cycleEndDate: editEnd || null });
    setEditingId(null);
  }

  return (
    <div className="flex flex-col gap-3 pb-6">
      <PageHeader title="Cycle" />

      <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1.5fr', alignItems: 'start' }}>

        {/* ── LEFT COLUMN ── */}
        <div className="flex flex-col gap-3">

          {/* Phase ring card */}
          <div className="card-indigo flex flex-col items-center gap-3">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} shapeRendering="geometricPrecision" style={{ maxWidth: '100%' }}>
              {/* Dim background track */}
              <circle cx={cx} cy={cy} r={midR} fill="none" stroke="rgba(155,137,196,0.1)" strokeWidth={ringW} />
              {/* Phase arcs — rounded stroke, no borders */}
              {ringArcs.map((a, i) => (
                <path key={i} d={arcPath(a.from, a.to)} fill="none"
                  stroke={a.color} strokeWidth={ringW} strokeLinecap="round"
                  opacity={phaseInfo.phase === a.phase ? 1 : 0.25} />
              ))}
              {/* Current day dot */}
              <circle cx={mx} cy={my} r={6} fill="#ffe066" stroke="#1a1a2e" strokeWidth={1} />
              {/* Center labels */}
              <text x={cx} y={cy - 22} textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="600" fontSize="11" fill="rgba(155,137,196,0.65)" letterSpacing="3">DAY</text>
              <text x={cx} y={cy + 18} textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="800" fontSize="50" fill="#ffeaa7">{phaseInfo.cyclePos}</text>
              <text x={cx} y={cy + 36} textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="600" fontSize="13" fill="rgba(253,252,255,0.55)">OF {total}</text>
            </svg>
            <div className="flex items-center gap-3">
              <MoonIcon phase={phaseInfo.phase} size={26} />
              <div>
                <div className="font-bold text-[13px] uppercase tracking-wide text-cloud-white">{PHASE_COLORS[phaseInfo.phase].label}</div>
                <div className="font-body text-[13px] text-muted-purple mt-1">
                  {phaseInfo.phase === 'menstrual'
                    ? `Day ${phaseInfo.cyclePos} of ~${periodLen} period days`
                    : `Next period in ${daysUntilPeriod} day${daysUntilPeriod === 1 ? '' : 's'}`}
                </div>
              </div>
            </div>
          </div>

          {/* Luteal warning banner */}
          {(isInLuteal || isApproachingLuteal) && (
            <div className="rounded p-3 font-body" style={{ background: 'rgba(255,234,167,0.12)', border: '2px solid #c9a84c' }}>
              {isInLuteal ? (
                <>
                  <div className="font-bold text-[10px] text-butter mb-1">🌙 Luteal phase — day {lutealDayOfPhase} of ~{daysUntilPeriod + lutealDayOfPhase}</div>
                  <div className="text-[11px] text-butter/80">Period expected around {fmtFull(periodExpectedDate)}. Be gentle with yourself this week.</div>
                </>
              ) : (
                <>
                  <div className="font-bold text-[10px] text-butter mb-1">🌙 Luteal phase in {daysUntilLuteal} day{daysUntilLuteal === 1 ? '' : 's'}</div>
                  <div className="text-[11px] text-butter/80">Your harder window typically runs ~{Math.round(daysUntilPeriod - daysUntilLuteal + 1)} days. Period expected around {fmtFull(periodExpectedDate)}.</div>
                </>
              )}
            </div>
          )}

          {/* Log period */}
          <div className="card-indigo">
            <div className="font-bold text-[8px] uppercase tracking-widest text-star-gold mb-3">Log Period</div>
            <div className="flex gap-2">
              <button className={`flex-1 font-bold text-[8px] py-2 px-3 rounded border transition-colors ${periodActive ? 'border-muted-purple/30 text-muted-purple/50 cursor-not-allowed' : 'border-blush-pink/60 text-blush-pink hover:bg-blush-pink/10'}`}
                onClick={handleStart} disabled={periodActive}>
                {periodActive ? 'Currently active' : 'Period started today'}
              </button>
              <button className={`flex-1 font-bold text-[8px] py-2 px-3 rounded border transition-colors ${!periodActive ? 'border-muted-purple/30 text-muted-purple/50 cursor-not-allowed' : 'border-muted-purple/60 text-muted-purple hover:bg-muted-purple/10'}`}
                disabled={!periodActive} onClick={handleEnd}>
                Period ended today
              </button>
            </div>
          </div>

          {/* Cycle settings (collapsible) */}
          <div className="card-indigo">
            <button className="w-full flex justify-between items-center" onClick={() => setSettingsOpen(v => !v)}>
              <span className="font-bold text-[8px] uppercase tracking-widest text-star-gold">Cycle Settings</span>
              <span className="text-muted-purple text-[10px]">{settingsOpen ? '▲' : '▼'}</span>
            </button>
            {settingsOpen && (
              <div className="flex flex-col gap-4 mt-4">
                <SettingSlider label="Cycle length" min={21} max={35} value={cycleLen} onChange={setExpectedCycleLength} unit="days" />
                <SettingSlider label="Period duration" min={3} max={8} value={periodLen} onChange={setExpectedPeriodLength} unit="days" />
                <p className="font-body text-[11px] text-muted-purple leading-relaxed">
                  Predictions rebase from your most recent confirmed start date.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="flex flex-col gap-3">

          {/* Cycle pattern card */}
          <CyclePatternCard cyclePos={phaseInfo.cyclePos} />

          {/* Cycle log card */}
          <div className="card-indigo">
            <div className="flex justify-between items-center mb-3">
              <div className="font-bold text-[9px] uppercase tracking-widest text-star-gold">Cycle History</div>
              <button onClick={() => { setAddingOpen(o => !o); setNewStart(''); setNewEnd(''); }}
                className="font-bold text-[8px] text-muted-purple hover:text-cloud-white border border-muted-purple/40 rounded px-2 py-1 transition-colors">
                {addingOpen ? 'Cancel' : '+ Add past'}
              </button>
            </div>

            {/* Add past cycle form */}
            {addingOpen && (
              <div className="flex flex-col gap-3 mb-3 p-3 rounded border border-muted-purple/20 bg-muted-purple/5">
                <div className="font-bold text-[8px] text-star-gold">Add Past Cycle</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-body text-[11px] text-muted-purple mb-1 block">Start date <span className="text-blush-pink">*</span></label>
                    <DateInput value={newStart} onChange={setNewStart} max={isoDate(today)} />
                  </div>
                  <div>
                    <label className="font-body text-[11px] text-muted-purple mb-1 block">End date <span className="text-muted-purple/50">(optional)</span></label>
                    <DateInput value={newEnd} onChange={setNewEnd} max={isoDate(today)} />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setAddingOpen(false)} className="font-bold text-[8px] border border-muted-purple/40 text-muted-purple rounded px-3 py-1.5 hover:text-cloud-white transition-colors">Cancel</button>
                  <button onClick={handleAddCycle} disabled={!newStart} className="font-bold text-[8px] border border-blush-pink/60 text-blush-pink rounded px-3 py-1.5 hover:bg-blush-pink/10 disabled:opacity-40 transition-colors">Add Cycle</button>
                </div>
              </div>
            )}

            {/* Cycle rows */}
            {cycles.length === 0 ? (
              <div className="font-body text-[12px] text-muted-purple/60 text-center py-4">
                No cycles logged yet. Log a period start to begin.
              </div>
            ) : (
              <div className="flex flex-col gap-2" style={{ maxHeight: 320, overflowY: 'auto', scrollbarWidth: 'thin' }}>
                {cycles.map((c, i) => {
                  const actualDays = c.cycleEndDate ? daysBetween(c.cycleStartDate, c.cycleEndDate) + 1 : null;
                  return (
                    <div key={c.id} className="rounded border border-muted-purple/20 bg-muted-purple/5 p-3">
                      {editingId === c.id ? (
                        <div className="flex flex-col gap-3">
                          <div className="font-bold text-[8px] text-cloud-white">{i === 0 ? 'Current cycle' : `Cycle −${i}`}</div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="font-body text-[11px] text-muted-purple mb-1 block">Start date</label>
                              <DateInput value={editStart} onChange={setEditStart} max={isoDate(today)} />
                            </div>
                            <div>
                              <label className="font-body text-[11px] text-muted-purple mb-1 block">End date</label>
                              <DateInput value={editEnd} onChange={setEditEnd} max={isoDate(today)} />
                              {i === 0 && (
                                <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer">
                                  <input type="checkbox" checked={!editEnd} onChange={(e) => setEditEnd(e.target.checked ? '' : isoDate(today))} className="accent-mint-green" />
                                  <span className="font-body text-[11px] text-muted-purple">Still in progress</span>
                                </label>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => setEditingId(null)} className="font-bold text-[8px] border border-muted-purple/40 text-muted-purple rounded px-3 py-1.5 transition-colors">Cancel</button>
                            <button onClick={() => handleSaveEdit(c.id)} disabled={!editStart} className="font-bold text-[8px] border border-butter/60 text-butter rounded px-3 py-1.5 disabled:opacity-40 transition-colors">Save</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-[8px] text-muted-purple mb-0.5">{i === 0 ? 'Current' : `Cycle −${i}`}</div>
                              <div className="font-body text-[13px] font-bold text-cloud-white">
                                {fmtDate(c.cycleStartDate)}
                                <span className="text-muted-purple mx-1.5">→</span>
                                {c.cycleEndDate ? fmtDate(c.cycleEndDate) : <span className="text-mint-green text-[11px]">in progress</span>}
                                {actualDays && <span className="font-body text-[11px] text-muted-purple ml-2">· {actualDays}d</span>}
                              </div>
                            </div>
                            <button onClick={() => { setEditingId(c.id); setEditStart(c.cycleStartDate); setEditEnd(c.cycleEndDate ?? ''); }}
                              className="font-bold text-[8px] border border-muted-purple/40 text-muted-purple rounded px-2 py-1 hover:text-cloud-white transition-colors">Edit</button>
                            <button onClick={() => removeCycle(c.id)}
                              className="text-muted-purple/40 hover:text-blush-pink transition-colors text-sm px-1">×</button>
                          </div>
                          <PhasePillBar cycleLen={cycleLen} periodLen={periodLen} actualDays={actualDays} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
