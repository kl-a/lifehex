import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PadlockIcon } from '../components/PadlockIcon';
import { PeriodStrip } from '../components/PeriodStrip';
import { RadarChart } from '../components/RadarChart';
import { MoodSlider } from '../components/MoodSlider';
import { RegulationBadge } from '../components/RegulationBadge';
import { DailyChecklist } from '../components/DailyChecklist';
import { PhysicalSymptoms } from '../components/PhysicalSymptoms';
import { NewsTicker } from '../components/NewsTicker';
import { DIMENSIONS, MOOD_EMOJI, ENERGY_EMOJI, REGULATION_EMOJI } from '../data/constants';
import { useSessionStore } from '../store/sessionStore';
import { useHistoryStore } from '../store/historyStore';
import { useDayStore } from '../store/dayStore';
import { calculateZone } from '../utils/regulationScore';
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
        <button
          onClick={onClose}
          className="text-muted-purple hover:text-cloud-white transition-colors text-xl leading-none"
        >×</button>
      </div>

      <div className="flex items-center gap-3">
        <p className="text-sm text-muted-purple leading-relaxed flex-1">{dim.desc}</p>
        <div className="text-center flex-shrink-0">
          <div className="text-3xl font-bold text-cloud-white">{dimensions[dim.key]}</div>
          <div className="text-[9px] text-muted-purple uppercase tracking-widest">/ 10</div>
        </div>
      </div>

      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-mint-green mb-2">Adds ↑</div>
        <div className="flex flex-wrap gap-1.5">
          {dim.adds.map((a) => (
            <span key={a} className="text-[11px] font-body text-mint-green/80 bg-mint-green/10 border border-mint-green/20 rounded px-2 py-0.5">
              {a}
            </span>
          ))}
        </div>
      </div>

      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-blush-pink mb-2">Detracts ↓</div>
        <div className="flex flex-wrap gap-1.5">
          {dim.detracts.map((d) => (
            <span key={d} className="text-[11px] font-body text-blush-pink/80 bg-blush-pink/10 border border-blush-pink/20 rounded px-2 py-0.5">
              {d}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// Mood timeline (locked state only)
const TL_W = 400;
const TL_H = 100;
const TL_PAD = { l: 4, r: 4, t: 6, b: 6 };
const TL_PLOT_W = TL_W - TL_PAD.l - TL_PAD.r;
const TL_PLOT_H = TL_H - TL_PAD.t - TL_PAD.b;
const TL_MID_Y = TL_PAD.t + TL_PLOT_H / 2;
const TL_START_H = 8;
const TL_END_H = 26;
const TL_RANGE_MS = (TL_END_H - TL_START_H) * 60 * 60 * 1000;
const TL_BAR_W = 6;
const TL_Y_LABEL_W = 20;
const TL_Y_MARKS = [10, 7, 5, 3, 1];
const TL_X_HOURS = [8, 11, 14, 17, 20, 23, 26];

function tlMoodY(mood: number) {
  return TL_PAD.t + ((10 - mood) / 10) * TL_PLOT_H;
}
function tlXtoSvg(h: number) {
  return TL_PAD.l + ((h - TL_START_H) / (TL_END_H - TL_START_H)) * TL_PLOT_W;
}
function tlFormatHour(h: number) {
  const a = h % 24;
  if (a === 0) return '12am';
  if (a === 12) return '12pm';
  return a < 12 ? `${a}am` : `${a - 12}pm`;
}

function MoodTimeline({ sessions }: { sessions: Session[] }) {
  const [hoverPt, setHoverPt] = useState<{ x: number; y: number; mood: number; time: string } | null>(null);
  const containerRef = { current: null as HTMLDivElement | null };

  const now = new Date();
  const windowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), TL_START_H).getTime();

  const pts = sessions.map((s) => {
    const t = new Date(s.timestamp).getTime();
    const x = TL_PAD.l + Math.max(0, Math.min(1, (t - windowStart) / TL_RANGE_MS)) * TL_PLOT_W;
    const y = tlMoodY(s.mood);
    const time = new Date(s.timestamp).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false });
    return { x, y, mood: s.mood, time };
  });

  const linePath = pts.length > 1
    ? 'M ' + pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')
    : null;

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = containerRef.current;
    if (!el || pts.length === 0) return;
    const rect = el.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * TL_W;
    let nearest = pts[0];
    let minDist = Infinity;
    for (const p of pts) {
      const d = Math.abs(p.x - svgX);
      if (d < minDist) { minDist = d; nearest = p; }
    }
    setHoverPt(nearest);
  }

  return (
    <div className="w-full">
      <div className="flex" style={{ gap: 4 }}>
        <div className="relative flex-shrink-0" style={{ width: TL_Y_LABEL_W, height: TL_H }}>
          {TL_Y_MARKS.map((m) => (
            <span key={m} style={{
              position: 'absolute', right: 2,
              top: `${(tlMoodY(m) / TL_H) * 100}%`,
              transform: 'translateY(-50%)',
              fontSize: 9, fontWeight: 700, fontFamily: 'Nunito, sans-serif',
              color: m === 5 ? 'rgba(155,137,196,0.85)' : 'rgba(155,137,196,0.45)',
            }}>{m}</span>
          ))}
        </div>
        {sessions.length === 0 ? (
          <div className="flex-1 flex items-center text-[10px] text-muted-purple/60">No sessions yet</div>
        ) : (
          <div
            ref={(el) => { containerRef.current = el; }}
            style={{ flex: 1, height: TL_H, position: 'relative' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverPt(null)}
          >
            <svg viewBox={`0 0 ${TL_W} ${TL_H}`} preserveAspectRatio="none"
              style={{ width: '100%', height: '100%', display: 'block' }}>
              {TL_Y_MARKS.map((m) => {
                const y = tlMoodY(m);
                return (
                  <line key={m} x1={TL_PAD.l} y1={y} x2={TL_W - TL_PAD.r} y2={y}
                    stroke="#9b89c4"
                    strokeOpacity={m === 5 ? 0.45 : 0.18}
                    strokeWidth={m === 5 ? 1 : 0.6}
                    strokeDasharray={m === 5 ? '4,3' : '2,4'} />
                );
              })}
              {TL_X_HOURS.slice(1, -1).map((h) => {
                const x = tlXtoSvg(h);
                return (
                  <line key={h} x1={x} y1={TL_PAD.t} x2={x} y2={TL_H - TL_PAD.b}
                    stroke="#9b89c4" strokeOpacity={0.15} strokeWidth={0.6} />
                );
              })}
              {pts.map((p, i) => {
                const above = p.y <= TL_MID_Y;
                return (
                  <rect key={i}
                    x={p.x - TL_BAR_W / 2} y={above ? p.y : TL_MID_Y}
                    width={TL_BAR_W} height={Math.max(2, Math.abs(TL_MID_Y - p.y))}
                    fill={above ? 'rgba(181,234,215,0.55)' : 'rgba(247,202,201,0.55)'}
                    stroke={above ? '#6aab90' : '#c98a88'} strokeWidth="0.5" />
                );
              })}
              {linePath && (
                <path d={linePath} fill="none" stroke="#ffe066" strokeWidth="1.5"
                  strokeLinejoin="round" strokeLinecap="round" />
              )}
              {pts.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="3" fill="#ffe066" stroke="#16213e" strokeWidth="1" />
              ))}
              {hoverPt && (
                <line x1={hoverPt.x} y1={TL_PAD.t} x2={hoverPt.x} y2={TL_H - TL_PAD.b}
                  stroke="#ffe066" strokeOpacity={0.5} strokeWidth={0.8} strokeDasharray="2,2" />
              )}
            </svg>
            {hoverPt && (
              <div style={{
                position: 'absolute', top: -26,
                left: `${(hoverPt.x / TL_W) * 100}%`,
                transform: 'translateX(-50%)',
                pointerEvents: 'none', zIndex: 10,
              }}
                className="bg-deep-indigo border border-muted-purple/50 rounded px-2 py-0.5 text-[9px] font-bold text-star-gold whitespace-nowrap"
              >
                {hoverPt.mood}/10 · {hoverPt.time}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="relative mt-1" style={{ marginLeft: TL_Y_LABEL_W + 4, height: 14 }}>
        {TL_X_HOURS.map((h, i) => {
          const pct = ((h - TL_START_H) / (TL_END_H - TL_START_H)) * 100;
          const isFirst = i === 0;
          const isLast = i === TL_X_HOURS.length - 1;
          return (
            <span key={h} style={{
              position: 'absolute',
              left: `${pct}%`,
              transform: isFirst ? 'none' : isLast ? 'translateX(-100%)' : 'translateX(-50%)',
              fontSize: 10, fontWeight: 600, fontFamily: 'Nunito, sans-serif',
              color: 'rgba(155,137,196,0.6)',
            }}>{tlFormatHour(h)}</span>
          );
        })}
      </div>
    </div>
  );
}

export function Today({ phaseInfo, periodLen, goCycle }: Props) {
  const { locked, dimensions, mood, energy, regulation, lastSavedISO, unlock, lock, setDimension, setMood, setEnergy, setRegulation } = useSessionStore();
  const { sessions, addSession, removeSession } = useHistoryStore();
  const { dayRecord } = useDayStore();
  const [activeDimKey, setActiveDimKey] = useState<keyof DimensionScores | null>(null);
  const [confirmedZone, setConfirmedZone] = useState<'green' | 'amber' | 'red'>('green');

  const now = new Date();
  const dateLabel = now.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' });
  const time = now.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false });
  const lastSavedLabel = lastSavedISO
    ? new Date(lastSavedISO).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false })
    : null;

  const todaySessions = sessions.filter((s) => s.timestamp.slice(0, 10) === isoDate(now));
  const activeDim = activeDimKey ? DIMENSIONS.find((d) => d.key === activeDimKey) ?? null : null;

  // Compute current system zone from inputs
  const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
  const mealsLogged = dayRecord.meals.filter((m) => m.logged).length;
  const systemZone = calculateZone({
    mood,
    energy,
    regulation,
    isLutealPhase: phaseInfo.phase === 'luteal',
    medicationTaken: dayRecord.medicationTaken,
    isWeekday,
    symptomCount: dayRecord.symptoms.length,
    thatWasntMeToday: dayRecord.thatWasntMe,
    sleepQuality: dayRecord.sleepQuality,
    mealsLogged,
    gymToday: dayRecord.gymToday,
  });

  // Most recently saved zone (for locked state display)
  const lastSession = todaySessions[todaySessions.length - 1];
  const displayZone = locked ? (lastSession?.confirmedZone ?? 'green') : systemZone;

  function handleAxisTap(key: keyof DimensionScores) {
    setActiveDimKey((prev) => (prev === key ? null : key));
  }

  function handleToggleLock() {
    if (locked) {
      const last = sessions[sessions.length - 1];
      unlock(
        last?.dimensions ?? dimensions,
        last?.mood ?? mood,
        last?.energy ?? energy,
        last?.emotionalRegulation ?? regulation,
      );
    } else {
      const newSession: Session = {
        id: uuid(),
        timestamp: new Date().toISOString(),
        dimensions: { ...dimensions },
        mood,
        energy,
        emotionalRegulation: regulation,
        systemZone,
        confirmedZone,
        zoneOverride: confirmedZone !== systemZone
          ? {
              sessionId: '',
              date: isoDate(now),
              systemSuggested: systemZone,
              userConfirmed: confirmedZone,
              inputsSnapshot: { mood, energy, regulation, isLutealPhase: phaseInfo.phase === 'luteal', medicationTaken: dayRecord.medicationTaken, isWeekday, symptomCount: dayRecord.symptoms.length, thatWasntMeToday: dayRecord.thatWasntMe, sleepQuality: dayRecord.sleepQuality, mealsLogged, gymToday: dayRecord.gymToday },
            }
          : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      addSession(newSession);
      useSessionStore.setState({ lastSavedISO: newSession.timestamp });
      lock();
    }
  }

  return (
    <div className="flex flex-col gap-3 pb-20">
      {/* Header */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center">
        <div>
          <h1 className="text-3xl font-bold text-cloud-white tracking-tight">Today</h1>
          <p className="text-sm text-muted-purple mt-0.5">{dateLabel}</p>
        </div>
        <button
          onClick={handleToggleLock}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full border transition-all font-semibold text-sm ${
            locked
              ? 'border-muted-purple/40 text-muted-purple hover:border-muted-purple/70'
              : 'border-mint-shadow/50 text-mint-green bg-mint-green/5'
          }`}
        >
          <PadlockIcon locked={locked} size={14} />
          <span>{locked ? 'Locked' : 'Open — tap to save'}</span>
          {lastSavedLabel && (
            <span className="text-[11px] text-muted-purple ml-1">· {lastSavedLabel}</span>
          )}
        </button>
        <div className="flex justify-end text-xl font-bold text-star-gold">{time}</div>
      </div>

      <NewsTicker dimensions={dimensions} />
      <PeriodStrip phaseInfo={phaseInfo} periodLen={periodLen} onTap={goCycle} />

      {/* Regulation zone badge — always visible */}
      <RegulationBadge
        zone={displayZone}
        onOverride={(z) => setConfirmedZone(z)}
      />

      {/* Radar chart card */}
      <div className="card-indigo">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[11px] font-bold uppercase tracking-widest text-star-gold">Wheel of Life</span>
          <span className="text-xs text-muted-purple">tap axis to {locked ? 'inspect' : 'adjust'}</span>
        </div>
        <RadarChart
          values={dimensions}
          locked={locked}
          onAxisTap={handleAxisTap}
          onChange={locked ? undefined : setDimension}
          activeKey={activeDimKey}
        />
        <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-3">
          {DIMENSIONS.map((d) => (
            <span key={d.key} className="text-[10px] text-muted-purple">
              {d.short} <span className="text-cloud-white font-bold">{dimensions[d.key]}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Mood, Energy, Regulation sliders */}
      <div className="card-indigo flex flex-col gap-5" style={{ opacity: locked ? 0.75 : 1 }}>
        <MoodSlider
          label="Mood"
          value={mood}
          onChange={setMood}
          disabled={locked}
          emojiForValue={MOOD_EMOJI}
        />
        <MoodSlider
          label="Energy"
          value={energy}
          onChange={setEnergy}
          disabled={locked}
          emojiForValue={ENERGY_EMOJI}
        />
        <MoodSlider
          label="Regulation"
          sublabel="How well am I handling friction today?"
          value={regulation}
          onChange={setRegulation}
          disabled={locked}
          emojiForValue={REGULATION_EMOJI}
        />
        {locked && (
          <p className="text-[10px] text-muted-purple/60 text-center">Unlock to adjust</p>
        )}
      </div>

      {/* Mood timeline (locked state) */}
      {locked && todaySessions.length > 0 && (
        <div className="card-indigo">
          <div className="text-[11px] font-bold uppercase tracking-widest text-star-gold mb-3">Mood Today</div>
          <MoodTimeline sessions={todaySessions} />
        </div>
      )}

      {/* Today's sessions summary */}
      {todaySessions.length > 0 && (
        <div className="card-indigo">
          <div className="text-[11px] font-bold uppercase tracking-widest text-star-gold mb-3">
            Sessions Today ({todaySessions.length})
          </div>
          <div className="flex flex-col gap-2">
            {todaySessions.map((s) => {
              const t = new Date(s.timestamp).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false });
              const zoneColors = { green: '#b5ead7', amber: '#ffeaa7', red: '#f7cac9' };
              const zc = zoneColors[s.confirmedZone];
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-3 px-3 py-2 rounded border border-muted-purple/15 bg-muted-purple/5"
                >
                  <span className="text-[11px] font-bold text-star-gold w-10 flex-shrink-0">{t}</span>
                  <span className="text-lg leading-none">{MOOD_EMOJI(s.mood)}</span>
                  <span className="text-sm font-bold text-cloud-white">{s.mood}/10</span>
                  <span className="text-[10px] text-muted-purple">E:{s.energy} R:{s.emotionalRegulation}</span>
                  <span className="flex-shrink-0 w-2 h-2 rounded-full ml-auto" style={{ background: zc }} />
                  <button
                    onClick={() => removeSession(s.id)}
                    className="text-muted-purple/40 hover:text-blush-pink transition-colors text-xs px-1"
                    title="Delete session"
                  >✕</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Daily checklist — always interactive */}
      <DailyChecklist />

      {/* Physical symptoms — collapsible */}
      <PhysicalSymptoms />

      {/* Dimension detail overlay */}
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
              className="card-indigo w-full max-w-lg max-h-[60vh] overflow-y-auto rounded-b-none"
              style={{ borderTop: '2px solid #9b89c4', borderRadius: '8px 8px 0 0' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle bar */}
              <div className="flex justify-center mb-4">
                <div className="w-8 h-1 rounded-full bg-muted-purple/50" />
              </div>
              <DimPanel
                dim={activeDim}
                dimensions={dimensions}
                onClose={() => setActiveDimKey(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
