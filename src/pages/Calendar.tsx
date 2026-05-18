import { useState } from 'react';
import { MoonIcon } from '../components/MoonIcon';
import { PageHeader } from '../components/PageHeader';
import { useHistoryStore } from '../store/historyStore';
import { useDayStore } from '../store/dayStore';
import { useDayHistoryStore } from '../store/dayHistoryStore';
import { getCyclePhase, isoDate, PHASE_COLORS } from '../utils/cyclePredictor';
import { MOOD_EMOJI } from '../data/constants';
import type { Session, DayRecord, CyclePhase } from '../types';

interface Props {
  cycleStartISO: string;
  cycleLen: number;
  periodLen: number;
}

export function Calendar({ cycleStartISO, cycleLen, periodLen }: Props) {
  const { sessions } = useHistoryStore();
  const { dayRecord: todayRecord } = useDayStore();
  const { dayRecords: historyRecords } = useDayHistoryStore();
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const today = new Date();
  const target = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const monthName = target.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
  const firstDow = (target.getDay() + 6) % 7;
  const daysInMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();

  const byDate: Record<string, Session[]> = {};
  for (const s of sessions) {
    const k = s.timestamp.slice(0, 10);
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
  const daysLogged = new Set(monthSessions.map((s) => s.timestamp.slice(0, 10))).size;

  function getDayRecord(date: string): DayRecord | null {
    if (date === todayRecord.date) return todayRecord;
    return historyRecords.find((r) => r.date === date) ?? null;
  }

  function dominantZone(ss: Session[]): 'green' | 'amber' | 'red' | null {
    if (!ss.length) return null;
    const counts = { green: 0, amber: 0, red: 0 };
    for (const s of ss) counts[s.confirmedZone]++;
    if (counts.red >= counts.green && counts.red >= counts.amber) return 'red';
    if (counts.amber >= counts.green) return 'amber';
    return 'green';
  }

  const selectedSessions = selectedDate ? (byDate[selectedDate] ?? []) : [];
  const selectedPhase = selectedDate
    ? getCyclePhase(cycleStartISO, cycleLen, periodLen, new Date(selectedDate + 'T00:00:00')).phase
    : null;
  const selectedDayRecord = selectedDate ? getDayRecord(selectedDate) : null;
  const selectedZone = dominantZone(selectedSessions);

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
              const iso = isoDate(c.date);
              const ss = byDate[iso] ?? [];
              const avg = ss.length ? ss.reduce((s, x) => s + x.mood, 0) / ss.length : null;
              const isToday = iso === isoDate(today);
              const isFuture = c.date > today;
              const isSelected = iso === selectedDate;
              const phaseInfo = getCyclePhase(cycleStartISO, cycleLen, periodLen, c.date);

              let bg = '#1a1a2e';
              let border = 'rgba(155,137,196,0.2)';
              if (avg !== null) {
                if (avg > 7) { bg = 'rgba(181,234,215,0.25)'; border = '#6aab90'; }
                else if (avg >= 4) { bg = 'rgba(255,234,167,0.25)'; border = '#c9a84c'; }
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
                  <span className="absolute top-1.5 left-1.5 font-bold text-[11px] text-cloud-white leading-none">{c.date.getDate()}</span>
                  <span className="absolute top-1 right-1"><MoonIcon phase={phaseInfo.phase} size={14} ghost={isFuture} /></span>
                  {avg !== null && <span className="text-base absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">{MOOD_EMOJI(Math.round(avg))}</span>}
                  {ss.length > 0 && <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-star-gold" />}
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
                      const zc = { green: '#b5ead7', amber: '#ffeaa7', red: '#f7cac9' }[s.confirmedZone];
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

              {/* Checklist summary */}
              {selectedDayRecord && (
                <div>
                  <div className="text-[8px] font-bold uppercase tracking-widest text-star-gold mb-2">Checklist</div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1.5 font-body text-[12px]">
                    <span style={{ color: selectedDayRecord.medicationTaken ? '#b5ead7' : 'rgba(155,137,196,0.5)' }}>
                      💊 {selectedDayRecord.medicationTaken ? '✓' : '✗'}
                    </span>
                    <span style={{ color: selectedDayRecord.meals.filter((m) => m.logged).length > 0 ? '#b5ead7' : 'rgba(155,137,196,0.5)' }}>
                      🍱 {selectedDayRecord.meals.filter((m) => m.logged).length}/3
                    </span>
                    <span style={{ color: selectedDayRecord.gymToday ? '#b5ead7' : 'rgba(155,137,196,0.5)' }}>
                      🏋️ {selectedDayRecord.gymToday ? '✓' : '✗'}
                    </span>
                    <span style={{ color: selectedDayRecord.aloneTimeToday ? '#b5ead7' : 'rgba(155,137,196,0.5)' }}>
                      🧘 {selectedDayRecord.aloneTimeToday ? '✓' : '✗'}
                    </span>
                  </div>
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
