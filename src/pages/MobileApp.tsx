import { useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { v4 as uuid } from 'uuid';
import { PadlockIcon } from '../components/PadlockIcon';
import { useSessionStore } from '../store/sessionStore';
import { useHistoryStore } from '../store/historyStore';
import { useDayStore } from '../store/dayStore';
import { useCycleStore } from '../store/cycleStore';
import { useSettingsStore } from '../store/settingsStore';
import { DIMENSIONS, DEFAULT_DIMENSIONS, MOOD_EMOJI, ENERGY_EMOJI, REGULATION_EMOJI } from '../data/constants';
import { calculateZone, getZoneReasons } from '../utils/regulationScore';
import { getCyclePhase, isoDate } from '../utils/cyclePredictor';
import type { DimensionScores, Session } from '../types';

type Zone = 'green' | 'amber' | 'red';

// ─── constants ────────────────────────────────────────────────────────────────

const ZONE_STYLE: Record<Zone, { dot: string; border: string; bg: string; label: string }> = {
  green: { dot: '#b5ead7', border: '#6aab90', bg: 'rgba(181,234,215,0.15)', label: 'GREEN' },
  amber: { dot: '#ffeaa7', border: '#c9a84c', bg: 'rgba(255,234,167,0.15)', label: 'AMBER' },
  red:   { dot: '#f7cac9', border: '#c98a88', bg: 'rgba(247,202,201,0.15)', label: 'RED'   },
};

const SYMPTOMS = ['fatigue', 'bloating', 'breast tenderness', 'headache', 'nausea', 'cramps'];

// Compact abbreviations matching spec "H8 M5 Re8 F7 W8 C3 Rs7 N8"
const ABBREV: Record<string, string> = {
  HEALTH: 'H', MENTAL: 'M', RELATE: 'Re', FAMILY: 'F',
  WORK: 'W', CREATE: 'C', REST: 'Rs', NOURISH: 'N',
};

// ─── horizontal slider ────────────────────────────────────────────────────────

interface SliderProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled: boolean;
  emojiForValue: (v: number) => string;
  color: string;
}

function HorizontalSlider({ label, value, onChange, disabled, emojiForValue, color }: SliderProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const pct = ((value - 1) / 9) * 100;

  function updateFromX(clientX: number) {
    if (disabled || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const v = Math.round((x / rect.width) * 9) + 1;
    onChange(Math.max(1, Math.min(10, v)));
  }

  return (
    <div
      ref={rowRef}
      style={{ padding: '12px 16px', minHeight: 72, touchAction: 'pan-y', userSelect: 'none', opacity: disabled ? 0.45 : 1 }}
      onPointerDown={(e) => {
        if (disabled) return;
        dragging.current = true;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        updateFromX(e.clientX);
      }}
      onPointerMove={(e) => { if (dragging.current) updateFromX(e.clientX); }}
      onPointerUp={() => { dragging.current = false; }}
      onPointerCancel={() => { dragging.current = false; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: '#fdfcff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
        <span style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 16, color }}>{value}</span>
      </div>

      <div style={{ position: 'relative', height: 40 }}>
        {/* Emoji thumb above the track */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: `${pct}%`,
          transform: 'translateX(-50%)',
          fontSize: 22,
          lineHeight: 1,
          pointerEvents: 'none',
          userSelect: 'none',
        }}>
          {emojiForValue(value)}
        </div>

        {/* Track at bottom of the 40px area */}
        <div
          ref={trackRef}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 4, height: 6, borderRadius: 3, background: '#16213e', border: '1px solid #9b89c4', overflow: 'hidden' }}
        >
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${pct}%`,
            background: color,
            opacity: disabled ? 0.2 : 0.4,
            filter: disabled ? 'grayscale(80%)' : 'none',
          }} />
        </div>
      </div>
    </div>
  );
}

// ─── dimension slider (compact, for wheel of life) ────────────────────────────

function DimSlider({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled: boolean }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const pct = ((value - 1) / 9) * 100;

  function updateFromX(clientX: number) {
    if (disabled || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const v = Math.round((x / rect.width) * 9) + 1;
    onChange(Math.max(1, Math.min(10, v)));
  }

  return (
    <div
      ref={outerRef}
      style={{ position: 'relative', height: 14, touchAction: 'pan-y' }}
      onPointerDown={(e) => {
        if (disabled) return;
        dragging.current = true;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        updateFromX(e.clientX);
      }}
      onPointerMove={(e) => { if (dragging.current) updateFromX(e.clientX); }}
      onPointerUp={() => { dragging.current = false; }}
      onPointerCancel={() => { dragging.current = false; }}
    >
      <div
        ref={trackRef}
        style={{ position: 'absolute', left: 0, right: 0, top: 4, height: 6, borderRadius: 3, background: '#1a1a2e', border: '1px solid rgba(155,137,196,0.4)', overflow: 'hidden' }}
      >
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: '#c9b8f0', opacity: 0.45 }} />
      </div>
      {/* Dot indicator centered on track */}
      <div style={{
        position: 'absolute',
        top: 1,
        left: `${pct}%`,
        transform: 'translateX(-50%)',
        width: 12,
        height: 12,
        borderRadius: '50%',
        background: '#c9b8f0',
        border: '2px solid #16213e',
        pointerEvents: 'none',
      }} />
    </div>
  );
}

// ─── zone badge ───────────────────────────────────────────────────────────────

function ZoneBadge({ zone, reasons, onTap }: { zone: Zone; reasons: string[]; onTap: () => void }) {
  const s = ZONE_STYLE[zone];
  return (
    <button
      onClick={onTap}
      style={{
        background: s.bg, border: `1.5px solid ${s.border}`, borderRadius: 6,
        padding: '6px 10px', display: 'flex', flexDirection: 'column',
        alignItems: 'flex-start', gap: 3, cursor: 'pointer', minWidth: 80,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot, display: 'inline-block', flexShrink: 0 }} />
        <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: s.dot }}>{s.label}</span>
      </div>
      {zone !== 'green' && reasons.length > 0 && (
        <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 10, color: '#9b89c4', lineHeight: 1.2 }}>
          {reasons.slice(0, 2).join(' · ')}
        </span>
      )}
    </button>
  );
}

// ─── status bar ───────────────────────────────────────────────────────────────

interface StatusBarProps {
  phaseInfo: ReturnType<typeof getCyclePhase>;
  periodLen: number;
  hasCycle: boolean;
  zone: Zone;
  zoneReasons: string[];
  onZoneTap: () => void;
}

function StatusBar({ phaseInfo, periodLen, hasCycle, zone, zoneReasons, onZoneTap }: StatusBarProps) {
  const daysUntilPeriod = phaseInfo.totalLen - phaseInfo.cyclePos;
  const inPeriod = phaseInfo.phase === 'menstrual' && phaseInfo.cyclePos <= periodLen;
  const inLuteal = phaseInfo.phase === 'luteal';
  const warningClose = !inPeriod && daysUntilPeriod <= 12;

  let barBg = '#16213e';
  let barBorder = 'transparent';
  if (inLuteal) { barBg = 'rgba(255,234,167,0.08)'; barBorder = '#c9a84c'; }
  if (inPeriod || warningClose) { barBg = 'rgba(247,202,201,0.08)'; barBorder = '#c98a88'; }

  type CycleDisplay = { icon: string; text: string; color: string; font: string; size: number };
  let cd: CycleDisplay;

  if (!hasCycle) {
    cd = { icon: '🌙', text: 'Set up cycle →', color: '#9b89c4', font: 'Nunito, sans-serif', size: 13 };
  } else if (inPeriod) {
    cd = { icon: '🔴', text: `Period day ${phaseInfo.cyclePos}`, color: '#f7cac9', font: "'Press Start 2P', monospace", size: 10 };
  } else if (warningClose) {
    cd = { icon: '⚠️', text: `${daysUntilPeriod}d to period`, color: '#f7cac9', font: "'Press Start 2P', monospace", size: 10 };
  } else if (inLuteal) {
    cd = { icon: '🌙', text: `Luteal · ${daysUntilPeriod}d to period`, color: '#ffeaa7', font: "'Press Start 2P', monospace", size: 10 };
  } else {
    cd = { icon: '🌙', text: `${daysUntilPeriod}d to period`, color: '#c9b8f0', font: 'Nunito, sans-serif', size: 13 };
  }

  return (
    <div style={{
      background: barBg,
      borderBottom: `2px solid ${barBorder === 'transparent' ? 'transparent' : barBorder}`,
      padding: '10px 16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 16, flexShrink: 0 }}>{cd.icon}</span>
        <span style={{ fontFamily: cd.font, fontSize: cd.size, color: cd.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {cd.text}
        </span>
      </div>
      <ZoneBadge zone={zone} reasons={zoneReasons} onTap={onZoneTap} />
    </div>
  );
}

// ─── lock toggle row ──────────────────────────────────────────────────────────

function LockToggleRow({ locked, lastSavedISO, onToggle }: { locked: boolean; lastSavedISO: string | null; onToggle: () => void }) {
  const timeLabel = lastSavedISO
    ? new Date(lastSavedISO).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false })
    : null;

  return (
    <button
      onClick={onToggle}
      style={{
        width: '100%', padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        background: 'transparent', border: 'none', cursor: 'pointer',
        borderBottom: '1px solid rgba(155,137,196,0.1)',
      }}
    >
      <PadlockIcon locked={locked} size={16} />
      {locked ? (
        <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 12, color: '#9b89c4' }}>
          Locked{timeLabel ? ` · ${timeLabel}` : ''}
        </span>
      ) : (
        <motion.span
          animate={{ opacity: [1, 0.6, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ fontFamily: 'Nunito, sans-serif', fontSize: 12, color: '#b5ead7', fontWeight: 700 }}
        >
          Unlocked — adjusting
        </motion.span>
      )}
    </button>
  );
}

// ─── checklist grid ───────────────────────────────────────────────────────────

function ChecklistGrid() {
  const { dayRecord, setMedicationTaken, updateMeal, setGymToday, setAloneTimeToday } = useDayStore();
  const [mealSheet, setMealSheet] = useState<'breakfast' | 'lunch' | 'dinner' | null>(null);
  const [mealNote, setMealNote] = useState('');

  const isWeekday = new Date().getDay() >= 1 && new Date().getDay() <= 5;

  function handleMealTap(meal: 'breakfast' | 'lunch' | 'dinner') {
    const m = dayRecord.meals.find(x => x.meal === meal)!;
    if (!m.logged) {
      updateMeal(meal, { logged: true });
    } else {
      setMealNote(m.note);
      setMealSheet(meal);
    }
  }

  function saveMealSheet() {
    if (!mealSheet) return;
    updateMeal(mealSheet, { note: mealNote });
    setMealSheet(null);
  }

  const meal = (id: 'breakfast' | 'lunch' | 'dinner') => dayRecord.meals.find(m => m.meal === id)!;

  const cellBase: React.CSSProperties = {
    height: 64, padding: '0 12px', borderRadius: 4,
    display: 'flex', alignItems: 'center', gap: 8,
    cursor: 'pointer', userSelect: 'none', transition: 'background 0.1s, border-color 0.1s',
  };
  const cell = (checked: boolean): React.CSSProperties => ({
    ...cellBase,
    background: checked ? 'rgba(181,234,215,0.15)' : '#16213e',
    border: `1px solid ${checked ? '#6aab90' : 'rgba(155,137,196,0.25)'}`,
  });
  const labelStyle = (checked: boolean): React.CSSProperties => ({
    fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 13,
    color: checked ? '#b5ead7' : '#fdfcff', flex: 1,
  });

  return (
    <>
      <div style={{ padding: '16px 16px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>

        {/* Medication */}
        {!isWeekday ? (
          <div style={{ ...cellBase, background: '#16213e', border: '1px solid rgba(155,137,196,0.15)', opacity: 0.45, cursor: 'default' }}>
            <span style={{ fontSize: 18 }}>💊</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 13, color: '#9b89c4' }}>Medication</div>
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#7a6fa0' }}>REST DAY</div>
            </div>
          </div>
        ) : (
          <div style={cell(dayRecord.medicationTaken)} onClick={() => setMedicationTaken(!dayRecord.medicationTaken)}>
            <span style={{ fontSize: 18 }}>💊</span>
            <span style={labelStyle(dayRecord.medicationTaken)}>Medication</span>
            {dayRecord.medicationTaken && <span style={{ color: '#b5ead7', fontWeight: 700 }}>✓</span>}
          </div>
        )}

        {/* Breakfast */}
        <div style={cell(meal('breakfast').logged)} onClick={() => handleMealTap('breakfast')}>
          <span style={{ fontSize: 18 }}>🍳</span>
          <span style={labelStyle(meal('breakfast').logged)}>Breakfast</span>
          {meal('breakfast').logged && <span style={{ color: '#b5ead7', fontWeight: 700 }}>✓</span>}
        </div>

        {/* Lunch */}
        <div style={cell(meal('lunch').logged)} onClick={() => handleMealTap('lunch')}>
          <span style={{ fontSize: 18 }}>🍱</span>
          <span style={labelStyle(meal('lunch').logged)}>Lunch</span>
          {meal('lunch').logged && <span style={{ color: '#b5ead7', fontWeight: 700 }}>✓</span>}
        </div>

        {/* Dinner */}
        <div style={cell(meal('dinner').logged)} onClick={() => handleMealTap('dinner')}>
          <span style={{ fontSize: 18 }}>🍽️</span>
          <span style={labelStyle(meal('dinner').logged)}>Dinner</span>
          {meal('dinner').logged && <span style={{ color: '#b5ead7', fontWeight: 700 }}>✓</span>}
        </div>

        {/* Gym */}
        <div style={cell(dayRecord.gymToday)} onClick={() => setGymToday(!dayRecord.gymToday)}>
          <span style={{ fontSize: 18 }}>🏋️</span>
          <span style={labelStyle(dayRecord.gymToday)}>Gym</span>
          {dayRecord.gymToday && <span style={{ color: '#b5ead7', fontWeight: 700 }}>✓</span>}
        </div>

        {/* Alone time */}
        <div style={cell(dayRecord.aloneTimeToday)} onClick={() => setAloneTimeToday(!dayRecord.aloneTimeToday)}>
          <span style={{ fontSize: 18 }}>🔇</span>
          <span style={labelStyle(dayRecord.aloneTimeToday)}>Alone time</span>
          {dayRecord.aloneTimeToday && <span style={{ color: '#b5ead7', fontWeight: 700 }}>✓</span>}
        </div>
      </div>

      {/* Meal detail bottom sheet */}
      <AnimatePresence>
        {mealSheet && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(26,26,46,0.85)', zIndex: 60 }}
            onClick={() => setMealSheet(null)}
          >
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              style={{
                position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
                width: '100%', maxWidth: 480, background: '#16213e',
                borderTop: '2px solid #9b89c4', borderRadius: '8px 8px 0 0',
                padding: '20px 16px 40px',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(155,137,196,0.4)' }} />
              </div>
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: '#ffe066', marginBottom: 16, textTransform: 'capitalize' }}>{mealSheet}</div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 14, color: '#fdfcff' }}>Proper break?</span>
                <button
                  onClick={() => updateMeal(mealSheet, { properBreak: !meal(mealSheet).properBreak })}
                  style={{
                    padding: '6px 16px', borderRadius: 4, cursor: 'pointer',
                    fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 700,
                    background: meal(mealSheet).properBreak ? 'rgba(181,234,215,0.2)' : '#16213e',
                    border: `1px solid ${meal(mealSheet).properBreak ? '#6aab90' : 'rgba(155,137,196,0.4)'}`,
                    color: meal(mealSheet).properBreak ? '#b5ead7' : '#9b89c4',
                  }}
                >
                  {meal(mealSheet).properBreak ? '✓ Yes' : 'No'}
                </button>
              </div>

              <input
                type="text"
                value={mealNote}
                onChange={e => setMealNote(e.target.value)}
                placeholder="Note (optional)"
                style={{
                  width: '100%', background: '#1a1a2e', borderRadius: 4, outline: 'none',
                  border: '1px solid rgba(155,137,196,0.3)', padding: '10px 12px',
                  color: '#fdfcff', fontFamily: 'Nunito, sans-serif', fontSize: 14, boxSizing: 'border-box',
                }}
              />
              <button
                onClick={saveMealSheet}
                style={{
                  marginTop: 16, width: '100%', padding: 12, cursor: 'pointer',
                  background: 'rgba(181,234,215,0.2)', border: '1px solid #6aab90', borderRadius: 4,
                  color: '#b5ead7', fontFamily: "'Press Start 2P', monospace", fontSize: 10,
                }}
              >
                DONE
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── physical symptoms section ────────────────────────────────────────────────

function SymptomsSection() {
  const { dayRecord, toggleSymptom, setThatWasntMe, setThatWasntMeNote, setBrainFog, setWorkingMemoryImpaired } = useDayStore();
  const [open, setOpen] = useState(false);
  const [noteSheetOpen, setNoteSheetOpen] = useState(false);
  const [noteText, setNoteText] = useState(dayRecord.thatWasntMeNote);

  const summary = dayRecord.symptoms.length > 0
    ? dayRecord.symptoms.slice(0, 3).join(' · ')
    : 'optional';

  const chipStyle = (active: boolean): React.CSSProperties => ({
    height: 36, padding: '0 12px', borderRadius: 4, cursor: 'pointer',
    border: `1px solid ${active ? '#c98a88' : '#9b89c4'}`,
    background: active ? 'rgba(247,202,201,0.2)' : 'transparent',
    color: active ? '#f7cac9' : '#9b89c4',
    fontFamily: 'Nunito, sans-serif', fontSize: 13, userSelect: 'none',
    display: 'flex', alignItems: 'center',
  });

  return (
    <div style={{ borderTop: '1px solid rgba(155,137,196,0.1)' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', padding: '14px 16px', display: 'flex', alignItems: 'center',
          gap: 10, background: 'transparent', border: 'none', cursor: 'pointer',
        }}
      >
        <span style={{
          fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#fdfcff',
          display: 'inline-block', transition: 'transform 0.15s',
          transform: open ? 'rotate(90deg)' : 'none',
        }}>▶</span>
        <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: '#fdfcff' }}>
          PHYSICAL SYMPTOMS
        </span>
        {!open && (
          <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 11, color: '#9b89c4', marginLeft: 4 }}>
            {summary}
          </span>
        )}
      </button>

      {open && (
        <div style={{ padding: '0 16px 16px' }}>
          {/* Symptom chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {SYMPTOMS.map(s => (
              <button key={s} style={chipStyle(dayRecord.symptoms.includes(s))} onClick={() => toggleSymptom(s)}>
                {s}
              </button>
            ))}
          </div>

          {/* "That wasn't me" */}
          <div style={{
            background: '#16213e', border: '1px solid rgba(155,137,196,0.2)',
            borderRadius: 6, padding: 12, marginBottom: 12,
          }}>
            <div style={{ fontFamily: 'Nunito, sans-serif', fontSize: 13, color: '#fdfcff', marginBottom: 10 }}>
              😶 "That wasn't me" today
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setThatWasntMe(false)}
                style={{
                  flex: 1, padding: 8, borderRadius: 4, cursor: 'pointer',
                  fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 700,
                  background: !dayRecord.thatWasntMe ? 'rgba(155,137,196,0.15)' : 'transparent',
                  border: `1px solid ${!dayRecord.thatWasntMe ? '#9b89c4' : 'rgba(155,137,196,0.3)'}`,
                  color: !dayRecord.thatWasntMe ? '#fdfcff' : '#7a6fa0',
                }}
              >No</button>
              <button
                onClick={() => { setThatWasntMe(true); setNoteSheetOpen(true); }}
                style={{
                  flex: 1, padding: 8, borderRadius: 4, cursor: 'pointer',
                  fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 700,
                  background: dayRecord.thatWasntMe ? 'rgba(247,202,201,0.15)' : 'transparent',
                  border: `1px solid ${dayRecord.thatWasntMe ? '#c98a88' : 'rgba(155,137,196,0.3)'}`,
                  color: dayRecord.thatWasntMe ? '#f7cac9' : '#7a6fa0',
                }}
              >Yes + note</button>
            </div>
            {dayRecord.thatWasntMe && dayRecord.thatWasntMeNote && (
              <div style={{ marginTop: 8, fontFamily: 'Nunito, sans-serif', fontSize: 11, color: '#9b89c4', fontStyle: 'italic' }}>
                "{dayRecord.thatWasntMeNote}"
              </div>
            )}
          </div>

          {/* Brain fog + working memory */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 13, color: '#9b89c4' }}>Brain fog</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {([1, 2, 3] as const).map((v, i) => {
                  const labels = ['Low', 'Med', 'High'];
                  const active = dayRecord.brainFog === v;
                  return (
                    <button key={v} onClick={() => setBrainFog(active ? null : v)} style={{
                      padding: '4px 10px', borderRadius: 3, cursor: 'pointer', fontWeight: 700,
                      fontFamily: 'Nunito, sans-serif', fontSize: 11,
                      background: active ? 'rgba(201,184,240,0.2)' : 'transparent',
                      border: `1px solid ${active ? '#c9b8f0' : 'rgba(155,137,196,0.3)'}`,
                      color: active ? '#c9b8f0' : '#7a6fa0',
                    }}>{labels[i]}</button>
                  );
                })}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 13, color: '#9b89c4' }}>Working memory</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {(['Fine', 'Struggling'] as const).map(label => {
                  const val = label === 'Struggling';
                  const active = dayRecord.workingMemoryImpaired === val;
                  return (
                    <button key={label} onClick={() => setWorkingMemoryImpaired(val)} style={{
                      padding: '4px 10px', borderRadius: 3, cursor: 'pointer', fontWeight: 700,
                      fontFamily: 'Nunito, sans-serif', fontSize: 11,
                      background: active ? 'rgba(201,184,240,0.2)' : 'transparent',
                      border: `1px solid ${active ? '#c9b8f0' : 'rgba(155,137,196,0.3)'}`,
                      color: active ? '#c9b8f0' : '#7a6fa0',
                    }}>{label}</button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* "That wasn't me" note bottom sheet */}
      <AnimatePresence>
        {noteSheetOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(26,26,46,0.85)', zIndex: 60 }}
            onClick={() => setNoteSheetOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              style={{
                position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
                width: '100%', maxWidth: 480, background: '#16213e',
                borderTop: '2px solid #c98a88', borderRadius: '8px 8px 0 0',
                padding: '20px 16px 40px',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(155,137,196,0.4)' }} />
              </div>
              <div style={{ fontFamily: 'Nunito, sans-serif', fontSize: 14, color: '#f7cac9', marginBottom: 12 }}>
                😶 What happened today?
              </div>
              <input
                type="text"
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Brief note..."
                autoFocus
                style={{
                  width: '100%', background: '#1a1a2e', borderRadius: 4, outline: 'none',
                  border: '1px solid rgba(155,137,196,0.3)', padding: '10px 12px',
                  color: '#fdfcff', fontFamily: 'Nunito, sans-serif', fontSize: 14, boxSizing: 'border-box',
                }}
              />
              <button
                onClick={() => { setThatWasntMeNote(noteText); setNoteSheetOpen(false); }}
                style={{
                  marginTop: 16, width: '100%', padding: 12, cursor: 'pointer',
                  background: 'rgba(247,202,201,0.2)', border: '1px solid #c98a88', borderRadius: 4,
                  color: '#f7cac9', fontFamily: "'Press Start 2P', monospace", fontSize: 10,
                }}
              >
                SAVE NOTE
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── wheel of life section ────────────────────────────────────────────────────

function WheelOfLifeSection({
  disabled,
  dimensions,
  onChange,
}: {
  disabled: boolean;
  dimensions: DimensionScores;
  onChange: (key: keyof DimensionScores, v: number) => void;
}) {
  const [open, setOpen] = useState(false);

  const summary = DIMENSIONS.map(d => {
    const abbr = ABBREV[d.short] ?? d.short[0];
    return `${abbr}${dimensions[d.key]}`;
  }).join(' ');

  return (
    <div style={{ borderTop: '1px solid rgba(155,137,196,0.1)' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', padding: '14px 16px', display: 'flex', alignItems: 'center',
          gap: 10, background: 'transparent', border: 'none', cursor: 'pointer',
        }}
      >
        <span style={{
          fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#fdfcff',
          display: 'inline-block', transition: 'transform 0.15s',
          transform: open ? 'rotate(90deg)' : 'none',
        }}>▶</span>
        <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: '#fdfcff', whiteSpace: 'nowrap' }}>
          WHEEL OF LIFE
        </span>
        {!open && (
          <span style={{
            fontFamily: 'Nunito, sans-serif', fontSize: 11, color: '#9b89c4',
            marginLeft: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
          }}>
            {summary}
          </span>
        )}
      </button>

      {open && (
        <div style={{ padding: '0 16px 16px' }}>
          {disabled && (
            <div style={{ fontFamily: 'Nunito, sans-serif', fontSize: 11, color: '#7a6fa0', marginBottom: 12 }}>
              Unlock to adjust
            </div>
          )}
          {DIMENSIONS.map(d => (
            <div key={d.key} style={{ marginBottom: 18, opacity: disabled ? 0.55 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#9b89c4', textTransform: 'uppercase' }}>
                  {d.short}
                </span>
                <span style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: 14, color: '#c9b8f0' }}>
                  {dimensions[d.key]}
                </span>
              </div>
              <DimSlider value={dimensions[d.key]} onChange={v => onChange(d.key, v)} disabled={disabled} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── zone override sheet ──────────────────────────────────────────────────────

function ZoneOverrideSheet({ current, onSelect, onClose }: { current: Zone; onSelect: (z: Zone) => void; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(26,26,46,0.85)', zIndex: 60 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        style={{
          position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 480, background: '#16213e',
          borderTop: '2px solid #9b89c4', borderRadius: '8px 8px 0 0',
          padding: '20px 16px 40px',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(155,137,196,0.4)' }} />
        </div>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: '#9b89c4', marginBottom: 16 }}>
          OVERRIDE ZONE
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['green', 'amber', 'red'] as Zone[]).map(z => {
            const s = ZONE_STYLE[z];
            return (
              <button
                key={z}
                onClick={() => { onSelect(z); onClose(); }}
                style={{
                  flex: 1, padding: '16px 0', borderRadius: 4, cursor: 'pointer',
                  background: s.bg, border: `2px solid ${s.border}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  opacity: z === current ? 1 : 0.6,
                }}
              >
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
                <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: s.dot }}>{s.label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── fixed lock button ────────────────────────────────────────────────────────

function FixedLockButton({ locked, onToggle }: { locked: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480, height: 56,
        paddingBottom: 'env(safe-area-inset-bottom)',
        border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        fontFamily: "'Press Start 2P', monospace", fontSize: 10, letterSpacing: '0.05em',
        zIndex: 40,
        ...(locked ? {
          background: 'rgba(155,137,196,0.25)',
          borderTop: '2px solid #7a6fa0',
          color: '#c9b8f0',
        } : {
          background: 'rgba(181,234,215,0.25)',
          borderTop: '2px solid #6aab90',
          color: '#b5ead7',
        }),
      }}
    >
      <PadlockIcon locked={locked} size={16} />
      {locked ? 'UNLOCK TO ADJUST' : 'LOCK & SAVE'}
    </button>
  );
}

// ─── main mobile app ──────────────────────────────────────────────────────────

export function MobileApp() {
  const {
    locked, dimensions, mood, energy, regulation, lastSavedISO,
    unlock, lock, setDimension, setMood, setEnergy, setRegulation,
  } = useSessionStore();
  const { sessions, addSession } = useHistoryStore();
  const { dayRecord } = useDayStore();
  const { cycles } = useCycleStore();
  const { expectedCycleLength: cycleLen, expectedPeriodLength: periodLen, driveConnected } = useSettingsStore();

  const [confirmedZone, setConfirmedZone] = useState<Zone>('green');
  const [zoneSheetOpen, setZoneSheetOpen] = useState(false);
  const [flashing, setFlashing] = useState(false);
  const [driveSkipped, setDriveSkipped] = useState(false);

  const now = useMemo(() => new Date(), []);
  const cycleStartISO = cycles.length ? cycles[0].cycleStartDate : isoDate(now);
  const phaseInfo = useMemo(
    () => getCyclePhase(cycleStartISO, cycleLen, periodLen, now),
    [cycleStartISO, cycleLen, periodLen, now]
  );

  const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
  const mealsLogged = dayRecord.meals.filter(m => m.logged).length;
  const lastSession = sessions[sessions.length - 1];

  // Display values — pre-fill from last session when locked
  const displayDimensions: DimensionScores = locked && lastSession
    ? { ...DEFAULT_DIMENSIONS, ...lastSession.dimensions }
    : dimensions;
  const displayMood = locked && lastSession ? lastSession.mood : mood;
  const displayEnergy = locked && lastSession ? lastSession.energy : energy;
  const displayRegulation = locked && lastSession ? lastSession.emotionalRegulation : regulation;

  const zoneInputs = {
    mood: displayMood, energy: displayEnergy, regulation: displayRegulation,
    isLutealPhase: phaseInfo.phase === 'luteal',
    medicationTaken: dayRecord.medicationTaken,
    isWeekday,
    symptomCount: dayRecord.symptoms.length,
    thatWasntMeToday: dayRecord.thatWasntMe,
    sleepQuality: dayRecord.sleepQuality,
    mealsLogged,
    gymToday: dayRecord.gymToday,
  };
  const systemZone = calculateZone(zoneInputs);
  const zoneReasons = getZoneReasons(zoneInputs);

  function handleToggleLock() {
    if (locked) {
      const last = sessions[sessions.length - 1];
      const safeDims: DimensionScores = { ...DEFAULT_DIMENSIONS, ...(last?.dimensions ?? {}) };
      unlock(safeDims, last?.mood ?? 5, last?.energy ?? 5, last?.emotionalRegulation ?? 5);
    } else {
      const newSession: Session = {
        id: uuid(),
        timestamp: new Date().toISOString(),
        dimensions: { ...dimensions },
        mood, energy, emotionalRegulation: regulation,
        systemZone,
        confirmedZone,
        zoneOverride: confirmedZone !== systemZone ? {
          sessionId: '',
          date: isoDate(now),
          systemSuggested: systemZone,
          userConfirmed: confirmedZone,
          inputsSnapshot: zoneInputs,
        } : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      addSession(newSession);
      useSessionStore.setState({ lastSavedISO: newSession.timestamp });
      lock();
      setFlashing(true);
    }
  }

  const showDriveBanner = !driveConnected && !driveSkipped;

  return (
    <div style={{
      width: '100%', maxWidth: 480, margin: '0 auto',
      minHeight: '100dvh', background: '#1a1a2e',
      display: 'flex', flexDirection: 'column',
      paddingBottom: 72,
    }}>

      {/* Top bar */}
      <div style={{
        padding: '8px 16px', display: 'flex', justifyContent: 'flex-end',
        borderBottom: '1px solid rgba(155,137,196,0.08)',
      }}>
        <Link
          to="/"
          style={{ fontFamily: 'Nunito, sans-serif', fontSize: 11, color: '#9b89c4', textDecoration: 'none' }}
        >
          Open desktop →
        </Link>
      </div>

      {/* Drive connection banner */}
      {showDriveBanner && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(201,184,240,0.08)',
          borderBottom: '1px solid rgba(201,184,240,0.2)',
        }}>
          <div style={{ fontFamily: 'Nunito, sans-serif', fontSize: 13, color: '#c9b8f0', marginBottom: 8 }}>
            Connect Google Drive to sync data
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              style={{
                flex: 1, padding: 8, cursor: 'pointer',
                background: 'rgba(201,184,240,0.2)', border: '1px solid #c9b8f0', borderRadius: 4,
                color: '#c9b8f0', fontFamily: "'Press Start 2P', monospace", fontSize: 8,
              }}
              onClick={() => window.alert('Google Drive sync coming soon — log on desktop to connect.')}
            >Connect</button>
            <button
              style={{
                padding: '8px 16px', cursor: 'pointer',
                background: 'transparent', border: '1px solid rgba(155,137,196,0.3)', borderRadius: 4,
                color: '#7a6fa0', fontFamily: 'Nunito, sans-serif', fontSize: 12,
              }}
              onClick={() => setDriveSkipped(true)}
            >Skip</button>
          </div>
        </div>
      )}

      {/* Status bar */}
      <StatusBar
        phaseInfo={phaseInfo}
        periodLen={periodLen}
        hasCycle={cycles.length > 0}
        zone={systemZone}
        zoneReasons={zoneReasons}
        onZoneTap={() => setZoneSheetOpen(true)}
      />

      {/* Lock toggle row */}
      <LockToggleRow locked={locked} lastSavedISO={lastSavedISO} onToggle={handleToggleLock} />

      {/* Sliders */}
      <div style={{ borderBottom: '1px solid rgba(155,137,196,0.1)' }}>
        <HorizontalSlider
          label="Mood" value={displayMood} onChange={setMood}
          disabled={locked} emojiForValue={MOOD_EMOJI} color="#ffe066"
        />
        <HorizontalSlider
          label="Energy" value={displayEnergy} onChange={setEnergy}
          disabled={locked} emojiForValue={ENERGY_EMOJI} color="#b5ead7"
        />
        <HorizontalSlider
          label="Regulation" value={displayRegulation} onChange={setRegulation}
          disabled={locked} emojiForValue={REGULATION_EMOJI} color="#c9b8f0"
        />
      </div>

      {/* Quick checklist */}
      <div style={{ paddingBottom: 16, borderBottom: '1px solid rgba(155,137,196,0.1)' }}>
        <ChecklistGrid />
      </div>

      {/* Physical symptoms */}
      <SymptomsSection />

      {/* Wheel of life */}
      <WheelOfLifeSection
        disabled={locked}
        dimensions={displayDimensions}
        onChange={(key, v) => setDimension(key, v)}
      />

      <div style={{ flex: 1 }} />

      {/* Fixed lock button */}
      <FixedLockButton locked={locked} onToggle={handleToggleLock} />

      {/* Lock flash overlay */}
      {flashing && (
        <motion.div
          key="flash"
          animate={{ opacity: [0, 0.15, 0] }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          onAnimationComplete={() => setFlashing(false)}
          style={{
            position: 'fixed', inset: 0,
            background: '#b5ead7', pointerEvents: 'none', zIndex: 50,
          }}
        />
      )}

      {/* Zone override sheet */}
      <AnimatePresence>
        {zoneSheetOpen && (
          <ZoneOverrideSheet
            current={systemZone}
            onSelect={setConfirmedZone}
            onClose={() => setZoneSheetOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
