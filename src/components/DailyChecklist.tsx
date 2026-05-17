import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useDayStore } from '../store/dayStore';
import { useSettingsStore } from '../store/settingsStore';

type RoutineType = 'morning' | 'lunch' | 'bedtime';

function fmtTime(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function isoToHHMM(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function hhmmToISO(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

function isWeekday(): boolean {
  const d = new Date().getDay();
  return d >= 1 && d <= 5;
}

// ── Routines ──────────────────────────────────────────────────────────────────

const ROUTINES: Record<RoutineType, { emoji: string; title: string; items: string[] }> = {
  morning: {
    emoji: '✨',
    title: 'Morning Routine',
    items: [
      "Don't touch your phone yet",
      'Clean up / make bed',
      'Morning journal',
      'Eat breakfast',
      'Sit at a window for 5 minutes',
      'Say hello to parents / John',
      'Take meds',
      'Start your day',
    ],
  },
  lunch: {
    emoji: '🍱',
    title: 'Lunch Break',
    items: ['Step away from your desk', 'Close the laptop'],
  },
  bedtime: {
    emoji: '🌙',
    title: 'Wind Down',
    items: ['Screens away', 'Say goodnight to everyone', 'Brush teeth', 'Read book or manga', 'Lights out'],
  },
};

interface RoutineCardProps {
  type: RoutineType;
  isLuteal: boolean;
  autoShowTime: string;
  onAutoShowTimeChange: (t: string) => void;
  onLunchBreak: () => void;
  onClose: () => void;
}

function RoutineCard({ type, isLuteal, autoShowTime, onAutoShowTimeChange, onLunchBreak, onClose }: RoutineCardProps) {
  const cfg = ROUTINES[type];
  const [done, setDone] = useState<Set<number>>(new Set());
  const [showClock, setShowClock] = useState(false);

  const toggle = (i: number) =>
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <div className="mb-3 rounded-lg p-3" style={{ background: 'rgba(22,33,62,0.6)', border: '1px solid rgba(155,137,196,0.25)' }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-base leading-none">{cfg.emoji}</span>
        <span className="font-bold text-[10px] uppercase tracking-widest text-star-gold flex-1">{cfg.title}</span>

        {/* 3-dot settings */}
        <div className="relative">
          <button
            onClick={() => setShowClock((v) => !v)}
            className="font-bold text-[14px] text-muted-purple/50 hover:text-muted-purple leading-none w-6 h-6 flex items-center justify-center"
            title="Configure auto-show time"
          >
            ···
          </button>
          {showClock && (
            <div
              className="absolute right-0 top-full mt-1 z-30 rounded-lg p-2.5 flex items-center gap-2"
              style={{ width: 196, background: '#16213e', border: '1px solid rgba(155,137,196,0.4)', boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }}
            >
              <span className="font-body text-[10px] text-muted-purple whitespace-nowrap">Auto-show at</span>
              <input
                type="time"
                value={autoShowTime}
                onChange={(e) => onAutoShowTimeChange(e.target.value)}
                className="flex-1 bg-night-sky border border-muted-purple/30 rounded px-2 py-0.5 font-body text-[11px] text-cloud-white outline-none focus:border-muted-purple/60"
              />
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="text-muted-purple/40 hover:text-cloud-white transition-colors text-sm leading-none ml-0.5"
        >
          ✕
        </button>
      </div>

      {isLuteal && type === 'morning' && (
        <div className="mb-2 text-[10px] font-body" style={{ color: '#ffeaa7' }}>
          🌙 Luteal phase — be extra gentle with yourself today.
        </div>
      )}

      <div className="flex flex-col gap-0.5">
        {cfg.items.map((item, i) => (
          <button key={i} onClick={() => toggle(i)} className="flex items-center gap-2.5 py-1 text-left w-full">
            <span
              className="flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors"
              style={{
                borderColor: done.has(i) ? '#6aab90' : 'rgba(155,137,196,0.4)',
                background: done.has(i) ? '#b5ead7' : 'transparent',
              }}
            >
              {done.has(i) && (
                <svg width="8" height="6" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4l3 3 5-6" stroke="#16213e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span
              className="font-body text-[12px]"
              style={{ color: done.has(i) ? 'rgba(155,137,196,0.45)' : '#9b89c4', textDecoration: done.has(i) ? 'line-through' : 'none' }}
            >
              {item}
            </span>
          </button>
        ))}

        {type === 'lunch' && (
          <button
            onClick={() => { onLunchBreak(); onClose(); }}
            className="btn-mint mt-2 text-[11px] w-full justify-center"
          >
            I'm on my break
          </button>
        )}
      </div>
    </div>
  );
}

// ── CheckRow ──────────────────────────────────────────────────────────────────

interface CheckRowProps {
  checked: boolean;
  label: string;
  timeIso?: string | null;
  onTimeChange?: (iso: string) => void;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  disabledLabel?: string;
  children?: React.ReactNode;
}

function CheckRow({ checked, label, timeIso, onTimeChange, onChange, disabled, disabledLabel, children }: CheckRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [editingTime, setEditingTime] = useState(false);
  const hasChildren = !!children;

  return (
    <div>
      <div className="flex items-center gap-3 py-1.5">
        {/* Checkbox */}
        <button
          onClick={() => !disabled && onChange(!checked)}
          disabled={disabled}
          className="flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all"
          style={{
            borderColor: disabled ? 'rgba(155,137,196,0.2)' : checked ? '#6aab90' : '#9b89c4',
            background: disabled ? 'transparent' : checked ? '#b5ead7' : 'transparent',
            opacity: disabled ? 0.4 : 1,
          }}
        >
          {checked && !disabled && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4l3 3 5-6" stroke="#16213e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {/* Label */}
        <button
          className="flex-1 text-left min-w-0"
          onClick={() => hasChildren && !disabled && setExpanded((v) => !v)}
          disabled={disabled}
        >
          <span
            className="font-body text-[13px]"
            style={{ color: disabled ? 'rgba(155,137,196,0.4)' : checked ? '#fdfcff' : '#9b89c4' }}
          >
            {label}
          </span>
          {disabled && disabledLabel && (
            <span className="ml-2 font-bold text-[9px] text-muted-purple/50 uppercase tracking-widest">{disabledLabel}</span>
          )}
        </button>

        {/* Time display + inline editor */}
        {checked && timeIso && (
          <span className="flex items-center gap-1 flex-shrink-0">
            {editingTime ? (
              <input
                type="time"
                defaultValue={isoToHHMM(timeIso)}
                autoFocus
                className="bg-night-sky border border-muted-purple/30 rounded px-1.5 font-body text-[11px] text-mint-green outline-none"
                style={{ width: 76 }}
                onBlur={(e) => {
                  if (e.target.value && onTimeChange) onTimeChange(hhmmToISO(e.target.value));
                  setEditingTime(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (onTimeChange) onTimeChange(hhmmToISO((e.target as HTMLInputElement).value));
                    setEditingTime(false);
                  }
                  if (e.key === 'Escape') setEditingTime(false);
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                <span className="font-body text-[11px] text-mint-green/70">✓ {fmtTime(timeIso)}</span>
                {onTimeChange && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingTime(true); }}
                    className="text-muted-purple/35 hover:text-muted-purple transition-colors text-[10px] leading-none"
                    title="Edit time"
                  >
                    ✏
                  </button>
                )}
              </>
            )}
          </span>
        )}

        {hasChildren && !disabled && (
          <button onClick={() => setExpanded((v) => !v)} className="text-muted-purple/50 text-[11px] flex-shrink-0">
            {expanded ? '▲' : '▼'}
          </button>
        )}
      </div>

      <AnimatePresence>
        {expanded && children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="ml-8 pb-2 flex flex-col gap-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── DailyChecklist ────────────────────────────────────────────────────────────

export function DailyChecklist({ isLuteal = false }: { isLuteal?: boolean }) {
  const [openRoutine, setOpenRoutine] = useState<RoutineType | null>(null);
  const {
    dayRecord,
    setMedicationTaken, setMedicationTime,
    updateMeal, setMealTime,
    setLunchBreakTaken,
    setGymToday, setGymTime,
    setAloneTimeToday, setAloneTimeStart,
  } = useDayStore();
  const {
    morningRoutineTime, lunchNudgeTime, bedtimeRoutineTime,
    setMorningRoutineTime, setLunchNudgeTime, setBedtimeRoutineTime,
  } = useSettingsStore();

  const weekday = isWeekday();
  const mealsLogged = dayRecord.meals.filter((m) => m.logged).length;

  function toggleRoutine(type: RoutineType) {
    setOpenRoutine((prev) => (prev === type ? null : type));
  }

  const routineTime = (t: RoutineType) =>
    t === 'morning' ? morningRoutineTime : t === 'lunch' ? lunchNudgeTime : bedtimeRoutineTime;
  const routineTimeSetter = (t: RoutineType) =>
    t === 'morning' ? setMorningRoutineTime : t === 'lunch' ? setLunchNudgeTime : setBedtimeRoutineTime;

  return (
    <div className="card-indigo">
      {/* Header with routine emoji triggers */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[11px] font-bold uppercase tracking-widest text-star-gold flex-1">Daily Checklist</span>
        {(['morning', 'lunch', 'bedtime'] as RoutineType[]).map((t) => (
          <button
            key={t}
            onClick={() => toggleRoutine(t)}
            title={ROUTINES[t].title}
            className="text-base leading-none transition-opacity"
            style={{ opacity: openRoutine === t ? 1 : 0.45 }}
          >
            {ROUTINES[t].emoji}
          </button>
        ))}
      </div>

      {/* Inline routine card */}
      <AnimatePresence>
        {openRoutine && (
          <motion.div
            key={openRoutine}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <RoutineCard
              type={openRoutine}
              isLuteal={isLuteal}
              autoShowTime={routineTime(openRoutine)}
              onAutoShowTimeChange={routineTimeSetter(openRoutine)}
              onLunchBreak={() => setLunchBreakTaken(true)}
              onClose={() => setOpenRoutine(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="divide-y divide-muted-purple/10">
        {/* Medication */}
        <CheckRow
          checked={dayRecord.medicationTaken}
          label="Medication taken"
          timeIso={dayRecord.medicationTime}
          onTimeChange={setMedicationTime}
          onChange={setMedicationTaken}
          disabled={!weekday}
          disabledLabel="rest day"
        />

        {/* Meals */}
        {dayRecord.meals.map((meal) => (
          <CheckRow
            key={meal.meal}
            checked={meal.logged}
            label={meal.meal.charAt(0).toUpperCase() + meal.meal.slice(1)}
            timeIso={meal.loggedTime}
            onTimeChange={(iso) => setMealTime(meal.meal, iso)}
            onChange={(v) => updateMeal(meal.meal, { logged: v })}
          >
            <input
              type="text"
              placeholder="What did you have? (optional)"
              value={meal.note}
              onChange={(e) => updateMeal(meal.meal, { note: e.target.value })}
              className="w-full bg-night-sky border border-muted-purple/20 rounded px-3 py-1.5 font-body text-[12px] text-cloud-white placeholder:text-muted-purple/40 outline-none focus:border-muted-purple/50"
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={meal.properBreak}
                onChange={(e) => updateMeal(meal.meal, { properBreak: e.target.checked })}
                className="w-3.5 h-3.5 accent-mint-green"
              />
              <span className="font-body text-[11px] text-muted-purple">proper break — not at desk</span>
            </label>
            {meal.meal === 'lunch' && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dayRecord.lunchBreakTaken}
                  onChange={(e) => setLunchBreakTaken(e.target.checked)}
                  className="w-3.5 h-3.5 accent-mint-green"
                />
                <span className="font-body text-[11px] text-muted-purple">stepped away from desk</span>
              </label>
            )}
          </CheckRow>
        ))}

        {/* Gym */}
        <CheckRow
          checked={dayRecord.gymToday}
          label="Gym today"
          timeIso={dayRecord.gymTime}
          onTimeChange={setGymTime}
          onChange={setGymToday}
        />

        {/* Alone time */}
        <CheckRow
          checked={dayRecord.aloneTimeToday}
          label="Alone time today"
          timeIso={dayRecord.aloneTimeStart}
          onTimeChange={setAloneTimeStart}
          onChange={setAloneTimeToday}
        />
      </div>

      {/* Summary */}
      <div className="mt-3 flex gap-3 flex-wrap">
        <span className="font-body text-[11px] text-muted-purple">
          Meals: <span className="text-cloud-white font-bold">{mealsLogged}/3</span>
        </span>
        {dayRecord.gymToday && <span className="font-body text-[11px] text-mint-green">💪 Gym done</span>}
        {dayRecord.aloneTimeToday && <span className="font-body text-[11px] text-mint-green">🔇 Alone time logged</span>}
      </div>
    </div>
  );
}
