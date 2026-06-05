import { useState } from 'react';
import { MoonIcon } from '../components/MoonIcon';
import { PageHeader } from '../components/PageHeader';
import { useHistoryStore } from '../store/historyStore';
import { useDayStore } from '../store/dayStore';
import { useDayHistoryStore, createDefaultDayRecord } from '../store/dayHistoryStore';
import { getCyclePhase, PHASE_COLORS } from '../utils/cyclePredictor';

function localIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
import { MOOD_EMOJI } from '../data/constants';
import type { Session, DayRecord, CyclePhase } from '../types';

interface Props {
  cycleStartISO: string;
  cycleLen: number;
  periodLen: number;
}

export function Calendar({ cycleStartISO, cycleLen, periodLen }: Props) {
  const { sessions } = useHistoryStore();
  const { dayRecord: todayRecord, setMedicationMorningTaken, setMedicationArvoTaken, setSsriTaken, updateMeal, setGymToday, setAloneTimeToday, setThatWasntMe } = useDayStore();
  const { dayRecords: historyRecords, patchDayRecord } = useDayHistoryStore();
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const today = new Date();
  const target = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const monthName = target.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
  const firstDow = (target.getDay() + 6) % 7;
  const daysInMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();

  const byDate: Record<string, Session[]> = {};
  for (const s of sessions) {
    const k = localIso(new Date(s.timestamp));
    (byDate[k] = byDate[k] || []).push(s);
  }

  const cells: Array<{ empty: true } | { date: Date }> = [];
  for (let i = 0; i < firstDow; i++) cells.push({ empty: true });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(target.getFullYear(), target.getMonth(), d) });
  }
  while (cells.length % 7 !== 0) cells.push({ empty: true });

  const monthSessions = sessions.filter((s) => {
    const d = new Date(s.timestamp);
    return d.getMonth() === target.getMonth() && d.getFullYear() === target.getFullYear();
  });
  const monthAvg = monthSessions.length
    ? (monthSessions.reduce((a, b) => a + b.mood, 0) / monthSessions.length).toFixed(1)
    : '—';
  const daysLogged = new Set(monthSessions.map((s) => localIso(new Date(s.timestamp)))).size;

  function getDayRecord(date: string): DayRecord | null {
    if (date === todayRecord.date) return todayRecord;
    return historyRecords.find((r) => r.date === date) ?? null;
  }

  const todayIso = localIso(new Date());

  function patchRecord(date: string, patch: Partial<DayRecord>) {
    if (date === todayIso) {
      // Route individual boolean fields through the live dayStore setters
      if ('medicationMorningTaken' in patch) setMedicationMorningTaken(patch.medicationMorningTaken!);
      if ('medicationArvoTaken'    in patch) setMedicationArvoTaken(patch.medicationArvoTaken!);
      if ('ssriTaken'              in patch) setSsriTaken(patch.ssriTaken!);
      if ('meals'                  in patch) {
        for (const m of patch.meals!) updateMeal(m.meal, { logged: m.logged });
      }
      if ('gymToday'       in patch) setGymToday(patch.gymToday!);
      if ('aloneTimeToday' in patch) setAloneTimeToday(patch.aloneTimeToday!);
      if ('thatWasntMe'    in patch) setThatWasntMe(patch.thatWasntMe!);
    } else {
      patchDayRecord(date, patch);
    }
  }

  function sessionZone(s: Session): 'green' | 'amber' | 'red' {
    if (s.confirmedZone === 'green' || s.confirmedZone === 'amber' || s.confirmedZone === 'red') return s.confirmedZone;
    if (s.systemZone === 'green' || s.systemZone === 'amber' || s.systemZone === 'red') return s.systemZone;
    return s.mood >= 7 ? 'green' : s.mood >= 4 ? 'amber' : 'red';
  }

  function dominantZone(ss: Session[]): 'green' | 'amber' | 'red' | null {
    if (!ss.length) return null;
    const priority = { red: 2, amber: 1, green: 0 } as const;
    return ss.reduce((best, s) => {
      const z = sessionZone(s);
      return priority[z] > priority[best] ? z : best;
    }, 'green' as 'green' | 'amber' | 'red');
  }

  const selectedSessions = selectedDate ? (byDate[selectedDate] ?? []) : [];
  const selectedPhase = selectedDate
    ? getCyclePhase(cycleStartISO, cycleLen, periodLen, new Date(selectedDate + 'T00:00:00')).phase
    : null;
  const selectedDayRecord = selectedDate ? getDayRecord(selectedDate) : null;
  const selectedZone = dominantZone(selectedSessions);
  const isFutureSelected = selectedDate ? new Date(selectedDate + 'T00:00:00') > today : false;

  return (
    <div className="flex flex-col gap-3 pb-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
      <PageHeader title="Calendar" />

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, alignItems: 'start' }}>
        {/* Left column: calendar grid + stats */}
        <div className="flex flex-col gap-3">
          {/* Month navigation */}
          <div className="flex items-center gap-2">
            <button className="btn-ghost px-3 py-2 font-bold text-[10px]" onClick={() => setMonthOffset((o) => o - 1)}>‹</button>
            <span className="font-bold text-[11px] text-cloud-white min-w-[130px] text-center">{monthName}</span>
            <button
              className="btn-ghost px-3 py-2 font-bold text-[10px]"
              disabled={monthOffset >= 0}
              onClick={() => setMonthOffset((o) => o + 1)}
            >›</button>
          </div>

          {/* Day-of-week header */}
          <div className="grid grid-cols-7">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <div key={d} className="text-center font-bold text-xs text-lilac-shadow py-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((c, i) => {
              if ('empty' in c) return <div key={i} style={{ height: 72 }} />;
              const iso = localIso(c.date);
              const ss = byDate[iso] ?? [];
              const avgMood = ss.length ? ss.reduce((a, x) => a + x.mood, 0) / ss.length : null;
              const avgEnergy = ss.length ? ss.reduce((a, x) => a + x.energy, 0) / ss.length : null;
              const avgReg = ss.length ? ss.reduce((a, x) => a + x.emotionalRegulation, 0) / ss.length : null;
              const isToday = iso === localIso(today);
              const isFuture = c.date > today;
              const isSelected = iso === selectedDate;
              const phaseInfo = getCyclePhase(cycleStartISO, cycleLen, periodLen, c.date);
              const dr = getDayRecord(iso);
              const hadThatWasntMe = !isFuture && (dr?.thatWasntMe ?? false);
              const hadGym = !isFuture && (dr?.gymToday ?? false);
              const hadMeds = !isFuture && (dr?.medicationTaken ?? false);

              let bg = '#1a1a2e';
              let border = 'rgba(155,137,196,0.2)';
              if (avgMood !== null) {
                if (avgMood >= 7) { bg = 'rgba(181,234,215,0.25)'; border = '#6aab90'; }
                else if (avgMood >= 4) { bg = 'rgba(255,234,167,0.25)'; border = '#c9a84c'; }
                else { bg = 'rgba(247,202,201,0.25)'; border = '#c98a88'; }
              }

              return (
                <div
                  key={i}
                  onClick={() => !isFuture && setSelectedDate(isSelected ? null : iso)}
                  className="relative rounded p-1.5"
                  style={{
                    height: 72,
                    background: isFuture ? 'rgba(22,21,46,0.5)' : bg,
                    border: `1px solid ${border}`,
                    opacity: isFuture ? 0.5 : 1,
                    outline: isSelected || isToday ? '2px solid #ffe066' : undefined,
                    outlineOffset: isSelected || isToday ? '-2px' : undefined,
                    cursor: isFuture ? 'default' : 'pointer',
                  }}
                >
                  <span className="absolute top-1.5 left-1.5 flex items-center gap-0.5 leading-none">
                    <span className="font-bold text-[11px] text-cloud-white">{c.date.getDate()}</span>
                    {hadThatWasntMe && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#e03b3b' }} />}
                    {hadGym && <span className="text-[9px] leading-none">🏃</span>}
                    {hadMeds && <span className="text-[9px] leading-none">💊</span>}
                  </span>
                  <span className="absolute top-1 right-1"><MoonIcon phase={phaseInfo.phase} size={14} ghost={isFuture} /></span>
                  {avgMood !== null && (
                    <div className="absolute bottom-1.5 inset-x-1.5 flex justify-between items-center">
                      <span style={{ fontSize: 9, color: '#ffe066', fontWeight: 700 }}>{MOOD_EMOJI(Math.round(avgMood))} {avgMood.toFixed(1)}</span>
                      <span style={{ fontSize: 9, color: '#b5ead7', fontWeight: 700 }}>⚡{avgEnergy!.toFixed(1)}</span>
                      <span style={{ fontSize: 9, color: '#c9b8f0', fontWeight: 700 }}>🧘{avgReg!.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="card-indigo grid grid-cols-2 gap-3">
              <Stat label="Avg Mood" value={monthAvg} color="text-butter" />
              <Stat label="Days Logged" value={String(daysLogged)} color="text-mint-green" />
              <Stat label="Sessions" value={String(monthSessions.length)} color="text-blush-pink" />
              <Stat label="Peak Mood" value={monthSessions.length ? String(Math.max(...monthSessions.map((s) => s.mood))) : '—'} color="text-soft-lilac" />
            </div>
            <div className="card-indigo">
              <div className="font-bold text-[8px] text-star-gold mb-3">Moon Phases</div>
              <div className="grid grid-cols-2 gap-2">
                {(['menstrual', 'follicular', 'ovulation', 'luteal'] as CyclePhase[]).map((p) => (
                  <div key={p} className="flex items-center gap-2">
                    <MoonIcon phase={p} size={16} />
                    <span className="font-body text-[11px] text-cloud-white">{PHASE_COLORS[p].label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right column: day detail panel */}
        <div style={{ position: 'sticky', top: 24 }}>
          {!selectedDate ? (
            <div className="card-indigo flex items-center justify-center" style={{ minHeight: 200 }}>
              <p className="font-body text-[13px] text-muted-purple text-center leading-relaxed">← Select a day<br />to see details</p>
            </div>
          ) : (
            <div className="card-indigo flex flex-col gap-3">
              {/* Date + zone */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-[10px] text-cloud-white leading-snug">
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </div>
                  {selectedZone && (
                    <div
                      className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold"
                      style={{
                        background: selectedZone === 'green' ? 'rgba(181,234,215,0.2)' : selectedZone === 'amber' ? 'rgba(255,234,167,0.2)' : 'rgba(247,202,201,0.2)',
                        color: selectedZone === 'green' ? '#b5ead7' : selectedZone === 'amber' ? '#ffeaa7' : '#f7cac9',
                        border: `1px solid ${selectedZone === 'green' ? '#6aab90' : selectedZone === 'amber' ? '#c9a84c' : '#c98a88'}`,
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: selectedZone === 'green' ? '#b5ead7' : selectedZone === 'amber' ? '#ffeaa7' : '#f7cac9' }} />
                      {selectedZone.toUpperCase()}
                    </div>
                  )}
                </div>
                {selectedPhase && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <MoonIcon phase={selectedPhase} size={18} />
                    <span className="font-body text-[11px] text-cloud-white">{PHASE_COLORS[selectedPhase].label}</span>
                  </div>
                )}
              </div>

              {/* Sessions */}
              <div>
                <div className="text-[8px] font-bold uppercase tracking-widest text-star-gold mb-2">
                  Sessions{selectedSessions.length > 0 ? ` (${selectedSessions.length})` : ''}
                </div>
                {selectedSessions.length === 0 ? (
                  <p className="font-body text-[12px] text-lilac-shadow">No sessions logged.</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {selectedSessions.map((s) => {
                      const t = new Date(s.timestamp).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false });
                      const zc = { green: '#b5ead7', amber: '#ffeaa7', red: '#f7cac9' }[sessionZone(s)];
                      return (
                        <div key={s.id} className="flex items-center gap-2 px-2 py-1.5 rounded" style={{ background: 'rgba(155,137,196,0.08)', border: '1px solid rgba(155,137,196,0.2)' }}>
                          <span className="font-body font-bold text-[11px] text-cloud-white flex-shrink-0">{t}</span>
                          <span className="font-body text-[11px] flex-shrink-0" style={{ color: '#ffe066' }}>{MOOD_EMOJI(s.mood)} {s.mood}</span>
                          <span className="font-body text-[11px] flex-shrink-0" style={{ color: '#b5ead7' }}>⚡{s.energy}</span>
                          <span className="font-body text-[11px] flex-shrink-0" style={{ color: '#c9b8f0' }}>🧘{s.emotionalRegulation}</span>
                          <span className="w-1.5 h-1.5 rounded-full ml-auto flex-shrink-0" style={{ background: zc }} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Checklist — editable */}
              {selectedDate && !isFutureSelected && (
                <div>
                  <div className="text-[8px] font-bold uppercase tracking-widest text-star-gold mb-2">Checklist</div>
                  <ChecklistEditor
                    record={selectedDayRecord}
                    date={selectedDate}
                    onPatch={(patch) => patchRecord(selectedDate, patch)}
                  />
                </div>
              )}

              {/* Symptoms */}
              {selectedDayRecord && (
                <div>
                  <div className="text-[8px] font-bold uppercase tracking-widest text-star-gold mb-1">Symptoms</div>
                  <p className="font-body text-[12px] text-muted-purple">
                    {selectedDayRecord.symptoms.length > 0 ? selectedDayRecord.symptoms.join(' · ') : 'None logged'}
                  </p>
                </div>
              )}

              {/* That wasn't me */}
              {selectedDayRecord?.thatWasntMe && (
                <div className="px-2 py-2 rounded" style={{ background: 'rgba(247,202,201,0.1)', border: '1px solid #c98a88' }}>
                  <div className="font-body text-[12px] text-blush-pink">😶 "That wasn't me"</div>
                  {selectedDayRecord.thatWasntMeNote && (
                    <div className="font-body text-[11px] text-muted-purple mt-1">{selectedDayRecord.thatWasntMeNote}</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div className={`font-bold text-[20px] ${color}`}>{value}</div>
      <div className="font-bold text-[6px] text-lilac-shadow mt-1 uppercase tracking-wide">{label}</div>
    </div>
  );
}

function Toggle({ on, label, onToggle }: { on: boolean; label: string; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-colors"
      style={{
        background: on ? 'rgba(181,234,215,0.15)' : 'rgba(155,137,196,0.08)',
        border: `1px solid ${on ? '#6aab90' : 'rgba(155,137,196,0.25)'}`,
        color: on ? '#b5ead7' : 'rgba(155,137,196,0.6)',
      }}
    >
      <span>{label}</span>
      <span style={{ fontSize: 9 }}>{on ? '✓' : '✗'}</span>
    </button>
  );
}

function ChecklistEditor({ record, date, onPatch }: {
  record: DayRecord | null;
  date: string;
  onPatch: (patch: Partial<DayRecord>) => void;
}) {
  const r = record ?? createDefaultDayRecord(date);

  function toggleMeal(idx: number) {
    const meals = r.meals.map((m, i) => i === idx ? { ...m, logged: !m.logged } : m);
    onPatch({ meals });
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Medication */}
      <div>
        <div className="text-[8px] text-muted-purple mb-1">Medication</div>
        <div className="flex flex-wrap gap-1.5">
          <Toggle label="💊 Morning" on={r.medicationMorningTaken} onToggle={() => onPatch({ medicationMorningTaken: !r.medicationMorningTaken, medicationTaken: !r.medicationMorningTaken || r.medicationArvoTaken })} />
          <Toggle label="💊 Arvo" on={r.medicationArvoTaken} onToggle={() => onPatch({ medicationArvoTaken: !r.medicationArvoTaken, medicationTaken: r.medicationMorningTaken || !r.medicationArvoTaken })} />
          <Toggle label="💊 SSRI" on={r.ssriTaken ?? false} onToggle={() => onPatch({ ssriTaken: !(r.ssriTaken ?? false) })} />
        </div>
      </div>

      {/* Meals */}
      <div>
        <div className="text-[8px] text-muted-purple mb-1">Meals</div>
        <div className="flex flex-wrap gap-1.5">
          {r.meals.map((m, i) => (
            <Toggle
              key={m.meal}
              label={m.meal === 'breakfast' ? '🍳 Brekky' : m.meal === 'lunch' ? '🥗 Lunch' : '🍽 Dinner'}
              on={m.logged}
              onToggle={() => toggleMeal(i)}
            />
          ))}
        </div>
      </div>

      {/* Activity & wellbeing */}
      <div>
        <div className="text-[8px] text-muted-purple mb-1">Activity & Wellbeing</div>
        <div className="flex flex-wrap gap-1.5">
          <Toggle label="🏋️ Gym" on={r.gymToday} onToggle={() => onPatch({ gymToday: !r.gymToday })} />
          <Toggle label="🧘 Alone time" on={r.aloneTimeToday} onToggle={() => onPatch({ aloneTimeToday: !r.aloneTimeToday })} />
          <Toggle label='😶 "That wasn\'t me"' on={r.thatWasntMe} onToggle={() => onPatch({ thatWasntMe: !r.thatWasntMe })} />
        </div>
      </div>
    </div>
  );
}
