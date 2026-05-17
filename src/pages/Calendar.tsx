import { useState } from 'react';
import { MoonIcon } from '../components/MoonIcon';
import { BottomSheet } from '../components/BottomSheet';
import { useHistoryStore } from '../store/historyStore';
import { getCyclePhase, isoDate, PHASE_COLORS } from '../utils/cyclePredictor';
import { MOOD_EMOJI } from '../data/constants';
import type { Session, CyclePhase } from '../types';

interface Props {
  cycleStartISO: string;
  cycleLen: number;
  periodLen: number;
}

interface DayDetail {
  date: string;
  sessions: Session[];
  phase: CyclePhase;
}

export function Calendar({ cycleStartISO, cycleLen, periodLen }: Props) {
  const { sessions } = useHistoryStore();
  const [monthOffset, setMonthOffset] = useState(0);
  const [detail, setDetail] = useState<DayDetail | null>(null);

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

  return (
    <div className="flex flex-col gap-3 pb-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="font-bold text-[14px] text-cloud-white">Calendar</div>
          <div className="font-body text-[12px] text-lilac-shadow mt-1">Mood map · Moon phases</div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost px-3 py-2 font-bold text-[10px]" onClick={() => setMonthOffset((o) => o - 1)}>‹</button>
          <span className="font-bold text-[9px] text-cloud-white min-w-[130px] text-center">{monthName}</span>
          <button
            className="btn-ghost px-3 py-2 font-bold text-[10px]"
            disabled={monthOffset >= 0}
            onClick={() => setMonthOffset((o) => o + 1)}
          >›</button>
        </div>
      </div>

      {/* Day-of-week header */}
      <div className="grid grid-cols-7">
        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d) => (
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
              onClick={() => !isFuture && setDetail({ date: iso, sessions: ss, phase: phaseInfo.phase })}
              className="relative rounded p-1.5"
              style={{
                height: 72,
                background: isFuture ? 'rgba(22,21,46,0.5)' : bg,
                border: `1px solid ${border}`,
                opacity: isFuture ? 0.5 : 1,
                outline: isToday ? '2px solid #ffe066' : undefined,
                outlineOffset: isToday ? '-2px' : undefined,
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
            {(['menstrual','follicular','ovulation','luteal'] as CyclePhase[]).map((p) => (
              <div key={p} className="flex items-center gap-2">
                <MoonIcon phase={p} size={16} />
                <span className="font-body text-[11px] text-cloud-white">{PHASE_COLORS[p].label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Day detail sheet */}
      <BottomSheet open={!!detail} onClose={() => setDetail(null)} title={detail ? new Date(detail.date + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}>
        {detail && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <div>
                <div className="font-bold text-[7px] text-star-gold mb-1">Avg Mood</div>
                <div className="font-bold text-[24px] text-cloud-white">
                  {detail.sessions.length ? (detail.sessions.reduce((s, x) => s + x.mood, 0) / detail.sessions.length).toFixed(1) : '—'}
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <MoonIcon phase={detail.phase} size={24} />
                <div>
                  <div className="font-bold text-[7px] text-lilac-shadow uppercase">Phase</div>
                  <div className="font-body text-[13px] font-bold text-cloud-white">{PHASE_COLORS[detail.phase].label}</div>
                </div>
              </div>
            </div>
            {detail.sessions.length === 0 ? (
              <p className="font-body text-[13px] text-lilac-shadow">No sessions logged.</p>
            ) : (
              detail.sessions.map((s) => (
                <div key={s.id} className="card-indigo">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-[8px] text-cloud-white">
                      {new Date(s.timestamp).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-xl">{MOOD_EMOJI(s.mood)}</span>
                      <span className="font-body text-[13px] font-bold text-cloud-white">{s.mood}/10</span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </BottomSheet>
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
