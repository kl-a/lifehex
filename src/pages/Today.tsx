import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PadlockIcon } from '../components/PadlockIcon';
import { SyncBadge } from '../components/SyncBadge';
import { PeriodStrip } from '../components/PeriodStrip';
import { RadarChart } from '../components/RadarChart';
import { MoodSlider } from '../components/MoodSlider';
import { RegulationBadge } from '../components/RegulationBadge';
import { DailyChecklist } from '../components/DailyChecklist';
import { PhysicalSymptoms } from '../components/PhysicalSymptoms';
import { NewsTicker } from '../components/NewsTicker';
import { DIMENSIONS, DEFAULT_DIMENSIONS, MOOD_EMOJI, ENERGY_EMOJI, REGULATION_EMOJI } from '../data/constants';
import { useSessionStore } from '../store/sessionStore';
import { useHistoryStore } from '../store/historyStore';
import { useDayStore } from '../store/dayStore';
import { calculateZone, getZoneReasons } from '../utils/regulationScore';
import type { Dimension, DimensionScores, PhaseInfo, Session } from '../types';
import { isoDate } from '../utils/cyclePredictor';
import { v4 as uuid } from 'uuid';

interface Props {
  phaseInfo: PhaseInfo;
  periodLen: number;
  goCycle: () => void;
}

interface DimPanelProps {
  dim: Dimension;
  dimensions: DimensionScores;
  onClose: () => void;
}

function DimPanel({ dim, dimensions, onClose }: DimPanelProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-star-gold">{dim.short}</div>
          <div className="text-lg font-bold text-cloud-white mt-0.5">{dim.label}</div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-cloud-white">{dimensions[dim.key]}</div>
            <div className="text-[9px] text-muted-purple uppercase tracking-widest">/ 10</div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-purple hover:text-cloud-white transition-colors text-xl leading-none"
          >×</button>
        </div>
      </div>

      <p className="text-sm text-muted-purple leading-relaxed">{dim.desc}</p>

      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-mint-green mb-2">Adds ↑</div>
        <div className="flex flex-wrap gap-1.5">
          {dim.adds.map((a) => (
            <span key={a} className="text-[11px] font-body text-mint-green/80 bg-mint-green/10 border border-mint-green/20 rounded px-2 py-0.5">{a}</span>
          ))}
        </div>
      </div>

      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-blush-pink mb-2">Detracts ↓</div>
        <div className="flex flex-wrap gap-1.5">
          {dim.detracts.map((d) => (
            <span key={d} className="text-[11px] font-body text-blush-pink/80 bg-blush-pink/10 border border-blush-pink/20 rounded px-2 py-0.5">{d}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// State timeline — mood, energy, regulation as 3 lines
const TL_H = 80;
const TL_PAD = { l: 4, r: 4, t: 6, b: 6 };
const TL_PLOT_H = TL_H - TL_PAD.t - TL_PAD.b;
const TL_START_H = 8; const TL_END_H = 24;
const TL_Y_LABEL_W = 14;
const TL_Y_MARKS = [10, 5, 1];
const TL_X_HOURS = [8, 12, 16, 20, 24];

function tlY(v: number) { return TL_PAD.t + ((10 - v) / 9) * TL_PLOT_H; }
function tlFmtH(h: number) { const a = h % 24; if (a === 0) return '12am'; if (a === 12) return '12pm'; return a < 12 ? `${a}am` : `${a - 12}pm`; }
function makePath(pts: { x: number; y: number }[]) {
  return pts.length > 1 ? 'M ' + pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ') : null;
}

const TL_SERIES = [
  { key: 'mood' as const,              color: '#ffe066', label: 'Mood'   },
  { key: 'energy' as const,            color: '#b5ead7', label: 'Energy' },
  { key: 'emotionalRegulation' as const, color: '#c9b8f0', label: 'Reg'  },
];

function StateTimeline({ sessions }: { sessions: Session[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [svgW, setSvgW] = useState(400);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const ro = new ResizeObserver((entries) => setSvgW(entries[0].contentRect.width));
    ro.observe(svgRef.current);
    return () => ro.disconnect();
  }, []);

  const plotW = svgW - TL_PAD.l - TL_PAD.r;
  function pxX(iso: string) {
    const t = new Date(iso); const h = t.getHours() + t.getMinutes() / 60;
    return TL_PAD.l + Math.max(0, Math.min(1, (h - TL_START_H) / (TL_END_H - TL_START_H))) * plotW;
  }
  function pxXh(h: number) { return TL_PAD.l + ((h - TL_START_H) / (TL_END_H - TL_START_H)) * plotW; }

  const pts = sessions.map((s) => ({
    x: pxX(s.timestamp),
    mood: s.mood, energy: s.energy, reg: s.emotionalRegulation,
    time: new Date(s.timestamp).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true }),
  }));

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!pts.length || !svgRef.current) return;
    const r = svgRef.current.getBoundingClientRect();
    const sx = (e.clientX - r.left) * (svgW / r.width);
    let near = 0, d = Infinity;
    pts.forEach((p, i) => { const dd = Math.abs(p.x - sx); if (dd < d) { d = dd; near = i; } });
    setHoverIdx(near);
  }

  return (
    <div className="w-full">
      <div className="flex" style={{ gap: 4 }}>
        <div className="relative flex-shrink-0" style={{ width: TL_Y_LABEL_W, height: TL_H }}>
          {TL_Y_MARKS.map((m) => (
            <span key={m} style={{ position: 'absolute', right: 2, top: `${(tlY(m) / TL_H) * 100}%`, transform: 'translateY(-50%)', fontSize: 8, fontWeight: 700, fontFamily: 'Nunito, sans-serif', color: m === 5 ? 'rgba(155,137,196,0.85)' : 'rgba(155,137,196,0.4)' }}>{m}</span>
          ))}
        </div>
        {sessions.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-[11px] font-body text-muted-purple/50">No sessions today</div>
        ) : (
          <div style={{ flex: 1, height: TL_H, position: 'relative' }}>
            <svg ref={svgRef} viewBox={`0 0 ${svgW} ${TL_H}`} style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}
              onMouseMove={onMove} onMouseLeave={() => setHoverIdx(null)}>
              {TL_Y_MARKS.map((m) => { const y = tlY(m); return <line key={m} x1={TL_PAD.l} y1={y} x2={svgW - TL_PAD.r} y2={y} stroke="#9b89c4" strokeOpacity={m === 5 ? 0.4 : 0.15} strokeWidth={m === 5 ? 1 : 0.5} strokeDasharray={m === 5 ? '4,3' : '2,4'} />; })}
              {TL_X_HOURS.slice(1, -1).map((h) => { const x = pxXh(h); return <line key={h} x1={x} y1={TL_PAD.t} x2={x} y2={TL_H - TL_PAD.b} stroke="#9b89c4" strokeOpacity={0.12} strokeWidth={0.5} />; })}
              {TL_SERIES.map(({ key, color }) => {
                const linePts = pts.map(p => ({ x: p.x, y: tlY(key === 'mood' ? p.mood : key === 'energy' ? p.energy : p.reg) }));
                const path = makePath(linePts);
                return (
                  <g key={key}>
                    {path && <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" strokeOpacity={0.85} />}
                    {linePts.map((lp, i) => (
                      <circle key={i} cx={lp.x} cy={lp.y} r={3} fill={color} stroke="#16213e" strokeWidth="1"
                        style={hoverIdx === i ? { filter: `drop-shadow(0 0 4px ${color})` } : undefined} />
                    ))}
                  </g>
                );
              })}
              {hoverIdx !== null && <line x1={pts[hoverIdx].x} y1={TL_PAD.t} x2={pts[hoverIdx].x} y2={TL_H - TL_PAD.b} stroke="#ffe066" strokeOpacity={0.4} strokeWidth={0.8} strokeDasharray="2,2" />}
              {hoverIdx !== null && (() => {
                const p = pts[hoverIdx];
                return (
                  <foreignObject x={Math.min(p.x, svgW - 120)} y={-30} width={120} height={28} style={{ overflow: 'visible' }}>
                    <div style={{ background: '#16213e', border: '1px solid rgba(155,137,196,0.5)', borderRadius: 4, padding: '2px 6px', fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap', display: 'flex', gap: 6 }}>
                      <span style={{ color: '#9b89c4' }}>{p.time}</span>
                      <span style={{ color: '#ffe066' }}>😊{p.mood}</span>
                      <span style={{ color: '#b5ead7' }}>⚡{p.energy}</span>
                      <span style={{ color: '#c9b8f0' }}>🧘{p.reg}</span>
                    </div>
                  </foreignObject>
                );
              })()}
            </svg>
          </div>
        )}
      </div>
      {/* X-axis labels */}
      <div className="relative mt-1" style={{ marginLeft: TL_Y_LABEL_W + 4, height: 28 }}>
        {TL_X_HOURS.map((h, i) => {
          const pct = ((h - TL_START_H) / (TL_END_H - TL_START_H)) * 100;
          const tr = i === 0 ? 'none' : i === TL_X_HOURS.length - 1 ? 'translateX(-100%)' : 'translateX(-50%)';
          return <span key={h} style={{ position: 'absolute', left: `${pct}%`, top: 0, writingMode: 'vertical-lr', transform: tr, fontSize: 9, fontWeight: 600, fontFamily: 'Nunito, sans-serif', color: 'rgba(155,137,196,0.6)' }}>{tlFmtH(h)}</span>;
        })}
      </div>
      {/* Legend */}
      <div className="flex gap-3 mt-1" style={{ marginLeft: TL_Y_LABEL_W + 4 }}>
        {TL_SERIES.map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
            <span className="text-[9px] font-body" style={{ color }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Today({ phaseInfo, periodLen, goCycle }: Props) {
  const { locked, dimensions, mood, energy, regulation, lastSavedISO, note, unlock, lock, setDimension, setMood, setEnergy, setRegulation, setNote } = useSessionStore();
  const { sessions, addSession, removeSession, updateSession } = useHistoryStore();
  const { dayRecord } = useDayStore();
  const [activeDimKey, setActiveDimKey] = useState<keyof DimensionScores | null>(null);
  const [hoveredDimKey, setHoveredDimKey] = useState<keyof DimensionScores | null>(null);
  const [confirmedZone, setConfirmedZone] = useState<'green' | 'amber' | 'red'>('green');
  const [hasManualOverride, setHasManualOverride] = useState(false);
  const [editingTimeId, setEditingTimeId] = useState<string | null>(null);
  const [editingTimeValue, setEditingTimeValue] = useState('');
  const [clockNow, setClockNow] = useState(new Date());
  useEffect(() => {
    const tick = setInterval(() => setClockNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  const now = clockNow;
  const dateLabel = now.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })
    + ' · '
    + now.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false });
  const lastSavedLabel = lastSavedISO
    ? new Date(lastSavedISO).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false })
    : null;

  // Use local date (not UTC) so sessions filter correctly for AEST and other non-UTC zones
  const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const localDateOf = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const todaySessions = sessions.filter((s) => localDateOf(s.timestamp) === localToday);
  const activeDim = activeDimKey ? DIMENSIONS.find((d) => d.key === activeDimKey) ?? null : null;
  const hoveredDim = hoveredDimKey ? DIMENSIONS.find((d) => d.key === hoveredDimKey) ?? null : null;

  const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
  const mealsLogged = dayRecord.meals.filter((m) => m.logged).length;
  const latestByTime = (arr: Session[]) => arr.length ? [...arr].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0] : undefined;
  const lastSession = latestByTime(todaySessions) ?? latestByTime(sessions);

  // Display values — derive from last session when locked so the badge always recalculates from real data
  const displayDimensions: DimensionScores = locked && lastSession
    ? { ...DEFAULT_DIMENSIONS, ...lastSession.dimensions }
    : dimensions;
  const displayMood = locked && lastSession ? lastSession.mood : mood;
  const displayEnergy = locked && lastSession ? lastSession.energy : energy;
  const displayRegulation = locked && lastSession ? lastSession.emotionalRegulation : regulation;

  // Always calculate zone from displayed values so the badge reflects current state even when locked
  const zoneInputs = { mood: displayMood, energy: displayEnergy, regulation: displayRegulation, isLutealPhase: phaseInfo.phase === 'luteal', medicationTaken: dayRecord.medicationTaken, isWeekday, symptomCount: dayRecord.symptoms.length, thatWasntMeToday: dayRecord.thatWasntMe, sleepQuality: dayRecord.sleepQuality, mealsLogged, gymToday: dayRecord.gymToday };
  const systemZone = calculateZone(zoneInputs);
  const displayZone = systemZone;
  const zoneReasons = getZoneReasons(zoneInputs);

  function handleAxisTap(key: keyof DimensionScores) {
    setActiveDimKey((prev) => (prev === key ? null : key));
  }

  function openTimeEdit(s: Session) {
    const d = new Date(s.timestamp);
    setEditingTimeValue(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
    setEditingTimeId(s.id);
  }

  function saveTimeEdit(id: string) {
    const [h, m] = editingTimeValue.split(':').map(Number);
    const sess = sessions.find((s) => s.id === id);
    if (sess && !isNaN(h) && !isNaN(m)) {
      const d = new Date(sess.timestamp);
      d.setHours(h, m, 0, 0);
      updateSession(id, { timestamp: d.toISOString() });
    }
    setEditingTimeId(null);
  }

  function handleToggleLock() {
    if (locked) {
      const last = sessions[sessions.length - 1];
      // Merge last session dimensions over defaults — guards against old-format sessions
      // stored in localStorage that may have missing or renamed keys from before v3
      const safeDims: DimensionScores = {
        ...dimensions,
        ...(last?.dimensions ?? {}),
        // Ensure all 8 v3 keys exist; any missing ones fall back to current store value
        healthBody: (last?.dimensions as any)?.healthBody ?? dimensions.healthBody,
        mentalWellbeing: (last?.dimensions as any)?.mentalWellbeing ?? dimensions.mentalWellbeing,
        relationships: (last?.dimensions as any)?.relationships ?? dimensions.relationships,
        family: (last?.dimensions as any)?.family ?? dimensions.family,
        workCareer: (last?.dimensions as any)?.workCareer ?? dimensions.workCareer,
        creativeArt: (last?.dimensions as any)?.creativeArt ?? dimensions.creativeArt,
        restRecovery: (last?.dimensions as any)?.restRecovery ?? dimensions.restRecovery,
        nourishment: (last?.dimensions as any)?.nourishment ?? dimensions.nourishment,
      };
      unlock(safeDims, last?.mood ?? mood, last?.energy ?? energy, last?.emotionalRegulation ?? regulation);
      setHasManualOverride(false);
    } else {
      const finalZone = hasManualOverride ? confirmedZone : systemZone;
      const newSession: Session = {
        id: uuid(),
        timestamp: new Date().toISOString(),
        dimensions: { ...dimensions },
        mood, energy, emotionalRegulation: regulation,
        systemZone, confirmedZone: finalZone,
        zoneOverride: hasManualOverride && confirmedZone !== systemZone ? {
          sessionId: '', date: isoDate(now),
          systemSuggested: systemZone, userConfirmed: confirmedZone,
          inputsSnapshot: { mood, energy, regulation, isLutealPhase: phaseInfo.phase === 'luteal', medicationTaken: dayRecord.medicationTaken, isWeekday, symptomCount: dayRecord.symptoms.length, thatWasntMeToday: dayRecord.thatWasntMe, sleepQuality: dayRecord.sleepQuality, mealsLogged, gymToday: dayRecord.gymToday },
        } : null,
        note: note.trim() || undefined,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      };
      addSession(newSession);
      useSessionStore.setState({ lastSavedISO: newSession.timestamp });
      lock();
    }
  }

  // ── Layout: viewport-height constrained, 3-column main grid ──
  return (
    // calc: App has pt-6 (24px) + pb-20 (80px) = 104px taken from viewport
    <div className="flex flex-col gap-2" style={{ height: 'calc(100dvh - 104px)' }}>

      {/* ── Top compact section ── */}
      <div className="flex-shrink-0 flex flex-col gap-2">
        {/* Header row */}
        <div className="grid items-center" style={{ gridTemplateColumns: '1fr auto 1fr' }}>
          <div>
            <h1 className="text-2xl font-bold text-cloud-white tracking-tight leading-tight">Today</h1>
            <p className="text-xs text-muted-purple">{dateLabel}</p>
          </div>
          <button
            onClick={handleToggleLock}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all font-semibold text-xs ${
              locked
                ? 'border-muted-purple/40 text-muted-purple hover:border-muted-purple/70'
                : 'border-mint-shadow/50 text-mint-green bg-mint-green/5'
            }`}
          >
            <PadlockIcon locked={locked} size={12} />
            <span>{locked ? 'Locked' : 'Open — tap to save'}</span>
            {lastSavedLabel && <span className="text-[10px] text-muted-purple">· {lastSavedLabel}</span>}
          </button>
          <div className="flex justify-end items-center gap-2">
            <SyncBadge />
          </div>
        </div>

        <NewsTicker dimensions={dimensions} />

        {/* Period strip + zone badge row */}
        <div className="flex gap-2 items-stretch">
          <div className="flex-1 min-w-0">
            <PeriodStrip phaseInfo={phaseInfo} periodLen={periodLen} onTap={goCycle} />
          </div>
          <div className="flex-shrink-0 w-52">
            <RegulationBadge zone={displayZone} reasons={zoneReasons} onOverride={(z) => { setConfirmedZone(z); setHasManualOverride(true); }} />
          </div>
        </div>
      </div>

      {/* ── Main 3-column grid ── */}
      <div
        className="flex-1 min-h-0 grid gap-3"
        style={{ gridTemplateColumns: '1fr 190px 1fr', gridTemplateRows: '1fr', alignItems: 'stretch' }}
      >
        {/* LEFT: Wheel of Life */}
        <div className="card-indigo flex flex-col overflow-hidden relative">
          <div className="flex justify-between items-center mb-2 flex-shrink-0">
            <span className="text-[11px] font-bold uppercase tracking-widest text-star-gold">Wheel of Life</span>
            <span className="text-[10px] text-muted-purple">tap to {locked ? 'inspect' : 'adjust'}</span>
          </div>
          {/* Chart + legend side by side */}
          <div className="flex-1 overflow-hidden flex gap-3 min-w-0">
            {/* Vertical legend list */}
            <div className="flex flex-col justify-center gap-1 flex-shrink-0">
              {DIMENSIONS.map((d) => {
                const val = displayDimensions[d.key];
                const sorted = [...DIMENSIONS].sort((a, b) => displayDimensions[a.key] - displayDimensions[b.key]);
                const allEqual = sorted[0] && sorted[7] && displayDimensions[sorted[0].key] === displayDimensions[sorted[7].key];
                const low2 = allEqual ? [] : sorted.slice(0, 2).map(x => x.key);
                const high2 = allEqual ? [] : sorted.slice(-2).map(x => x.key);
                const isLow = low2.includes(d.key);
                const isHigh = high2.includes(d.key);
                return (
                  <div key={d.key} className="flex items-center gap-1 px-1 rounded" style={{
                    border: isLow ? '1px solid #c98a88' : isHigh ? '1px solid #6aab90' : '1px solid transparent',
                  }}>
                    <span className="text-[10px] w-14 text-right" style={{ color: isLow ? '#f7cac9' : isHigh ? '#b5ead7' : 'rgba(155,137,196,0.7)' }}>{d.short}</span>
                    <span className="text-[11px] font-bold" style={{ color: isLow ? '#f7cac9' : isHigh ? '#b5ead7' : '#fdfcff' }}>{val}</span>
                  </div>
                );
              })}
            </div>
            {/* Radar */}
            <div className="flex-1 min-h-0 min-w-0 relative" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RadarChart
                values={displayDimensions}
                locked={locked}
                onAxisTap={handleAxisTap}
                onAxisHover={setHoveredDimKey}
                onChange={locked ? undefined : setDimension}
                activeKey={activeDimKey}
              />
              {/* Floating tooltip card — overlays chart, label-hover only */}
              {hoveredDim && (
                <div
                  className="absolute left-0 right-0 bottom-0 z-10 pointer-events-none rounded-lg px-3 py-2"
                  style={{ background: 'rgba(22,33,62,0.97)', border: '1px solid rgba(155,137,196,0.4)', boxShadow: '0 4px 14px rgba(0,0,0,0.45)' }}
                >
                  <span className="font-bold text-[10px] text-star-gold">{hoveredDim.label} — </span>
                  <span className="text-[10px] text-muted-purple">{hoveredDim.desc}</span>
                </div>
              )}
            </div>
          </div>
          {/* State timeline — below radar, separated by divider */}
          <div className="flex-shrink-0 mt-2 pt-2 border-t border-muted-purple/20">
            <div className="text-[9px] font-bold uppercase tracking-widest text-muted-purple mb-1">State Today</div>
            <StateTimeline sessions={[...todaySessions].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())} />
          </div>
        </div>

        {/* MIDDLE: Mood / Energy / Regulation vertical sliders */}
        <div className="card-indigo flex flex-col overflow-hidden">
          <div className="flex-shrink-0 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-star-gold">State</span>
            {locked && <p className="text-[9px] text-muted-purple/60 mt-0.5">Unlock to adjust</p>}
          </div>
          <div className="flex-1 overflow-hidden flex gap-3 justify-around min-h-0">
            <MoodSlider
              label="Mood"
              value={displayMood}
              onChange={setMood}
              disabled={locked}
              emojiForValue={MOOD_EMOJI}
              vertical
              tooltip="Your overall emotional tone right now — from depleted (1) to elated (10)."
            />
            <MoodSlider
              label="Energy"
              value={displayEnergy}
              onChange={setEnergy}
              disabled={locked}
              emojiForValue={ENERGY_EMOJI}
              vertical
              tooltip="Physical and mental fuel available — from completely drained (1) to fully charged (10)."
            />
            <MoodSlider
              label="Reg"
              value={displayRegulation}
              onChange={setRegulation}
              disabled={locked}
              emojiForValue={REGULATION_EMOJI}
              vertical
              tooltip="Emotional regulation — how grounded and in control you feel, from dysregulated (1) to centered (10)."
            />
          </div>
          {/* Session note */}
          {!locked && (
            <div className="flex-shrink-0 mt-2 pt-2 border-t border-muted-purple/20">
              <div className="text-[9px] font-bold uppercase tracking-widest text-muted-purple mb-1">Session note</div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional note for this session…"
                rows={2}
                className="w-full bg-night-sky border border-muted-purple/20 rounded px-2 py-1.5 font-body text-[12px] text-cloud-white placeholder:text-muted-purple/30 outline-none focus:border-muted-purple/50 resize-none"
                style={{ scrollbarWidth: 'thin' }}
              />
            </div>
          )}
        </div>

        {/* RIGHT: Checklist + sessions + symptoms */}
        <div className="overflow-y-auto flex flex-col gap-2 pr-1" style={{ scrollbarWidth: 'thin' }}>
          <DailyChecklist isLuteal={phaseInfo.phase === 'luteal'} />

          <div className="card-indigo">
            <div className="text-[9px] font-bold uppercase tracking-widest text-star-gold mb-2">
              Sessions {todaySessions.length > 0 ? `(${todaySessions.length})` : ''}
            </div>
            {todaySessions.length === 0 ? (
              <div className="font-body text-[12px] text-muted-purple/50">No sessions yet — lock a state to save one.</div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {[...todaySessions].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).map((s) => {
                  const t = new Date(s.timestamp).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true });
                  const displayedZone = s.zoneOverride ? s.confirmedZone : s.systemZone;
                  const zc = { green: '#b5ead7', amber: '#ffeaa7', red: '#f7cac9' }[displayedZone];
                  const zLabel = { green: 'GREEN', amber: 'AMBER', red: 'RED' }[displayedZone];
                  const isEditingTime = editingTimeId === s.id;
                  return (
                    <div key={s.id} className="flex flex-col gap-0.5 px-3 py-2 rounded border border-muted-purple/20" style={{ background: 'rgba(155,137,196,0.08)' }}>
                      <div className="flex items-center gap-2">
                      {isEditingTime ? (
                        <input
                          type="time"
                          value={editingTimeValue}
                          onChange={(e) => setEditingTimeValue(e.target.value)}
                          onBlur={() => saveTimeEdit(s.id)}
                          onKeyDown={(e) => { if (e.key === 'Enter') saveTimeEdit(s.id); if (e.key === 'Escape') setEditingTimeId(null); }}
                          autoFocus
                          className="flex-shrink-0 bg-night-sky border border-muted-purple/50 rounded px-1 py-0.5 text-[12px] text-cloud-white outline-none focus:border-muted-purple"
                          style={{ colorScheme: 'dark', width: 90 }}
                        />
                      ) : (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="font-body font-bold text-[13px] text-cloud-white">{t}</span>
                          <button
                            onClick={() => openTimeEdit(s)}
                            className="text-muted-purple/50 hover:text-star-gold transition-colors leading-none"
                            title="Edit time"
                            style={{ fontSize: 13, lineHeight: 1, padding: '0 2px', cursor: 'pointer' }}
                          >🕐</button>
                        </div>
                      )}
                      <span className="font-body font-bold text-[12px] flex-shrink-0" style={{ color: '#ffe066' }}>{MOOD_EMOJI(s.mood)} {s.mood}</span>
                      <span className="font-body font-bold text-[12px] flex-shrink-0" style={{ color: '#b5ead7' }}>⚡ {s.energy}</span>
                      <span className="font-body font-bold text-[12px] flex-shrink-0" style={{ color: '#c9b8f0' }}>🧘 {s.emotionalRegulation}</span>
                      <div className="flex items-center gap-1 ml-auto flex-shrink-0">
                        {s.zoneOverride && <span className="text-[10px] text-muted-purple">↺</span>}
                        <span className="w-2 h-2 rounded-full" style={{ background: zc }} />
                        <span className="font-bold text-[9px]" style={{ color: zc }}>{zLabel}</span>
                      </div>
                      <button
                        onClick={() => removeSession(s.id)}
                        className="text-muted-purple/40 hover:text-blush-pink transition-colors text-sm flex-shrink-0"
                        title="Delete"
                      >×</button>
                      </div>
                      {s.note && (
                        <p className="font-body text-[11px] italic pl-20" style={{ color: 'rgba(155,137,196,0.7)' }}>{s.note}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <PhysicalSymptoms />
        </div>
      </div>

      {/* Dimension bottom sheet */}
      <AnimatePresence>
        {activeDim && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 flex items-end justify-center"
            style={{ background: 'rgba(26,26,46,0.85)', backdropFilter: 'blur(4px)' }}
            onClick={() => setActiveDimKey(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0, bottom: 0.2 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 80 || info.velocity.y > 400) setActiveDimKey(null);
              }}
              className="card-indigo w-full max-w-2xl flex flex-col h-[78vh]"
              style={{ borderTop: '2px solid #9b89c4', borderRadius: '8px 8px 0 0' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag handle */}
              <div className="flex justify-center pb-3 flex-shrink-0" style={{ cursor: 'grab' }}>
                <div className="w-10 h-1 rounded-full bg-muted-purple/50" />
              </div>
              {/* Scrollable content */}
              <div className="flex-1 min-h-0 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                <DimPanel dim={activeDim} dimensions={displayDimensions} onClose={() => setActiveDimKey(null)} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
