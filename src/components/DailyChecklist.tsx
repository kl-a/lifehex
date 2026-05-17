import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useDayStore } from '../store/dayStore';

function fmtTime(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function isWeekday(): boolean {
  const d = new Date().getDay();
  return d >= 1 && d <= 5;
}

interface CheckRowProps {
  checked: boolean;
  label: string;
  time?: string | null;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  disabledLabel?: string;
  children?: React.ReactNode;
}

function CheckRow({ checked, label, time, onChange, disabled, disabledLabel, children }: CheckRowProps) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = !!children;

  return (
    <div>
      <div className="flex items-center gap-3 py-1.5">
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

        <button
          className="flex-1 text-left flex items-center gap-2"
          onClick={() => hasChildren && setExpanded((v) => !v)}
          disabled={disabled}
        >
          <span className="font-body text-[13px]" style={{ color: disabled ? 'rgba(155,137,196,0.4)' : checked ? '#fdfcff' : '#9b89c4' }}>
            {label}
          </span>
          {disabled && disabledLabel && (
            <span className="font-bold text-[9px] text-muted-purple/50 uppercase tracking-widest">{disabledLabel}</span>
          )}
          {checked && time && (
            <span className="font-body text-[11px] text-mint-green/70">✓ {time}</span>
          )}
        </button>

        {hasChildren && !disabled && (
          <button onClick={() => setExpanded((v) => !v)} className="text-muted-purple/50 text-[11px]">
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
            <div className="ml-8 pb-2 flex flex-col gap-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DailyChecklist() {
  const {
    dayRecord,
    setMedicationTaken,
    updateMeal,
    setLunchBreakTaken,
    setGymToday,
    setAloneTimeToday,
  } = useDayStore();

  const weekday = isWeekday();

  const mealsLogged = dayRecord.meals.filter((m) => m.logged).length;

  return (
    <div className="card-indigo">
      <div className="text-[11px] font-bold uppercase tracking-widest text-star-gold mb-3">Daily Checklist</div>

      <div className="divide-y divide-muted-purple/10">
        {/* Medication */}
        <CheckRow
          checked={dayRecord.medicationTaken}
          label="Medication taken"
          time={fmtTime(dayRecord.medicationTime)}
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
            time={fmtTime(meal.loggedTime)}
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
          time={fmtTime(dayRecord.gymTime)}
          onChange={setGymToday}
        />

        {/* Alone time */}
        <CheckRow
          checked={dayRecord.aloneTimeToday}
          label="Alone time today"
          time={fmtTime(dayRecord.aloneTimeStart)}
          onChange={setAloneTimeToday}
        />
      </div>

      {/* Summary row */}
      <div className="mt-3 flex gap-3 flex-wrap">
        <span className="font-body text-[11px] text-muted-purple">
          Meals: <span className="text-cloud-white font-bold">{mealsLogged}/3</span>
        </span>
        {dayRecord.gymToday && (
          <span className="font-body text-[11px] text-mint-green">💪 Gym done</span>
        )}
        {dayRecord.aloneTimeToday && (
          <span className="font-body text-[11px] text-mint-green">🔇 Alone time logged</span>
        )}
      </div>
    </div>
  );
}
