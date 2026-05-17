import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis,
} from 'recharts';
import { useHistoryStore } from '../store/historyStore';
import { DIMENSIONS } from '../data/constants';
import { sessionsInRange, streakDays } from '../utils/moodAggregate';
import type { DimensionScores } from '../types';

export function Dashboard() {
  const { sessions } = useHistoryStore();
  const [range, setRange] = useState(30);

  const inRange = sessionsInRange(sessions, range);
  const streak = streakDays(sessions);
  const moodAvg = inRange.length
    ? (inRange.reduce((s, x) => s + x.mood, 0) / inRange.length).toFixed(1)
    : '—';
  const daysLogged = new Set(inRange.map((s) => s.timestamp.slice(0, 10))).size;

  const avg = (list: typeof sessions): DimensionScores => {
    const out = {} as DimensionScores;
    for (const d of DIMENSIONS) {
      const vals = list.map((s) => s.dimensions[d.key]);
      out[d.key] = vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : 0;
    }
    return out;
  };
  const avg7 = avg(sessionsInRange(sessions, 7));
  const avg30 = avg(sessionsInRange(sessions, 30));

  const zoneCounts = { green: 0, amber: 0, red: 0 };
  inRange.forEach((s) => { zoneCounts[s.confirmedZone] = (zoneCounts[s.confirmedZone] ?? 0) + 1; });

  const moodData = inRange.map((s) => ({
    date: new Date(s.timestamp).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
    mood: s.mood,
    energy: s.energy ?? undefined,
    regulation: s.emotionalRegulation ?? undefined,
  }));

  const radarData7 = DIMENSIONS.map((d) => ({ subject: d.short, v7: avg7[d.key], v30: avg30[d.key] }));

  return (
    <div className="flex flex-col gap-4 pb-16">
      <div className="flex justify-between items-center">
        <div>
          <div className="font-bold text-[14px] text-cloud-white">Dashboard</div>
          <div className="font-body text-[12px] text-lilac-shadow mt-1">Trends · History · Drift</div>
        </div>
        <div className="flex rounded overflow-hidden border border-muted-purple/40">
          {[30, 90].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`font-bold text-[7px] px-3 py-2 transition-colors ${range === r ? 'bg-muted-purple/30 text-butter' : 'text-lilac-shadow'}`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-4 gap-2">
        <StatTile label="Sessions" value={String(inRange.length)} color="text-butter" />
        <StatTile label="Avg Mood" value={moodAvg} color="text-mint-green" />
        <StatTile label="Streak" value={`${streak}d`} color="text-peach" />
        <StatTile label="Days" value={String(daysLogged)} color="text-soft-lilac" />
      </div>

      {/* Mood line chart */}
      <div className="card-indigo">
        <div className="font-bold text-[8px] text-star-gold mb-1">Mood Over Time</div>
        <div className="font-body text-[11px] text-lilac-shadow mb-3">{range} day window</div>
        {moodData.length < 2 ? (
          <div className="h-40 flex items-center justify-center font-body text-[13px] text-lilac-shadow">
            Log a few sessions to see your trend.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={moodData}>
              <CartesianGrid stroke="#7a6fa0" strokeOpacity={0.2} strokeDasharray="3 4" />
              <XAxis dataKey="date" tick={{ fontFamily: 'Nunito', fontSize: 10, fill: '#7a6fa0' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis domain={[1, 10]} tick={{ fontFamily: 'Nunito', fontSize: 10, fill: '#7a6fa0' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#16213e', border: '1px solid #9b89c4', borderRadius: 4, fontFamily: 'Nunito', fontSize: 12 }} />
              <Line type="monotone" dataKey="mood" stroke="#ffe066" strokeWidth={2.5} dot={{ fill: '#ffe066', r: 3, strokeWidth: 0 }} activeDot={{ r: 6, fill: '#ffe066' }} />
              <Line type="monotone" dataKey="energy" stroke="#b5ead7" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              <Line type="monotone" dataKey="regulation" stroke="#c9b8f0" strokeWidth={1.5} dot={false} strokeDasharray="2 3" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Balance drift + top tags */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card-indigo">
          <div className="font-bold text-[8px] text-star-gold mb-1">Balance Drift</div>
          <div className="font-body text-[10px] text-lilac-shadow mb-2">7d vs 30d avg</div>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData7} cx="50%" cy="50%" outerRadius="65%">
              <PolarGrid stroke="#7a6fa0" strokeOpacity={0.25} />
              <PolarAngleAxis dataKey="subject" tick={{ fontFamily: "'Press Start 2P'", fontSize: 7, fill: '#9b89c4' }} />
              <Radar dataKey="v30" stroke="#c9b8f0" fill="rgba(201,184,240,0.25)" strokeWidth={1.5} />
              <Radar dataKey="v7" stroke="#ffe066" fill="rgba(255,224,102,0.2)" strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 justify-center mt-1">
            <LegendDot color="#ffe066" label="7 days" />
            <LegendDot color="#c9b8f0" label="30 days" />
          </div>
        </div>

        <div className="card-indigo">
          <div className="font-bold text-[8px] text-star-gold mb-3">Zone Distribution</div>
          {inRange.length === 0 ? (
            <p className="font-body text-[12px] text-lilac-shadow">No sessions in this range yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {([['green', '#b5ead7', '#6aab90'], ['amber', '#ffeaa7', '#c9a84c'], ['red', '#f7cac9', '#c98a88']] as const).map(([z, fill, border]) => {
                const count = zoneCounts[z] ?? 0;
                const max = Math.max(...Object.values(zoneCounts), 1);
                return (
                  <div key={z} className="flex items-center gap-2">
                    <span className="font-bold text-[9px] uppercase w-10" style={{ color: fill }}>{z}</span>
                    <div className="flex-1 h-2 bg-muted-purple/15 rounded overflow-hidden">
                      <div className="h-full rounded" style={{ width: `${(count / max) * 100}%`, background: fill, border: `1px solid ${border}` }} />
                    </div>
                    <span className="font-bold text-[9px] w-5 text-right" style={{ color: fill }}>{count}</span>
                  </div>
                );
              })}
              <div className="flex gap-3 mt-1">
                <LegendDot color="#b5ead7" label="Energy" />
                <LegendDot color="#c9b8f0" label="Regulation" />
                <LegendDot color="#ffe066" label="Mood" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card-base p-3 text-center">
      <div className={`font-bold text-[18px] ${color}`}>{value}</div>
      <div className="font-bold text-[6px] text-lilac-shadow mt-2 uppercase leading-relaxed">{label}</div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="inline-block w-4 h-1 rounded" style={{ background: color }} />
      <span className="font-body text-[11px] text-cloud-white">{label}</span>
    </span>
  );
}
