import { MoonIcon } from './MoonIcon';
import { PHASE_COLORS } from '../utils/cyclePredictor';
import type { PhaseInfo } from '../types';

interface Props {
  phaseInfo: PhaseInfo;
  periodLen: number;
  onTap: () => void;
}

export function PeriodStrip({ phaseInfo, periodLen, onTap }: Props) {
  const { phase, cyclePos, totalLen } = phaseInfo;
  const c = PHASE_COLORS[phase];
  const daysUntilNext = totalLen - cyclePos;
  const subline =
    phase === 'menstrual'
      ? `Period in progress · day ${cyclePos} of ${periodLen}`
      : `Next period in ${daysUntilNext} day${daysUntilNext === 1 ? '' : 's'}`;

  const today = new Date();
  const cycleStart = new Date(today);
  cycleStart.setDate(today.getDate() - (cyclePos - 1));
  const addD = (base: Date, n: number) => { const d = new Date(base); d.setDate(d.getDate() + n); return d; };
  const fmt = (d: Date) => d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });

  const ovulationDay = Math.floor(totalLen / 2) - 1;
  const lutealDay = Math.floor(totalLen / 2) + 1;
  // Warning zone: last 10 days before next period, never before luteal start
  const warningDay = Math.max(lutealDay, totalLen - 10);
  const boundaries = [
    { pct: 0,                                     label: 'M',  date: fmt(cycleStart) },
    { pct: (periodLen / totalLen) * 100,           label: 'F',  date: fmt(addD(cycleStart, periodLen)) },
    { pct: (ovulationDay / totalLen) * 100,        label: 'O',  date: fmt(addD(cycleStart, ovulationDay)) },
    { pct: (lutealDay / totalLen) * 100,           label: 'L',  date: fmt(addD(cycleStart, lutealDay)) },
    { pct: (warningDay / totalLen) * 100,          label: '⚠',  date: fmt(addD(cycleStart, warningDay)) },
    { pct: 100,                                    label: '',   date: fmt(addD(cycleStart, totalLen)) },
  ];

  return (
    <button
      onClick={onTap}
      className="w-full text-left rounded p-3 flex items-center gap-4 cursor-pointer"
      style={{
        background: `${c.bg}22`,
        border: `1.5px solid ${c.shadow}66`,
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
      }}
    >
      <div className="flex items-center gap-3 flex-shrink-0">
        <MoonIcon phase={phase} size={28} />
        <div>
          <div className="font-bold text-[13px] tracking-wide" style={{ color: c.bg }}>
            {c.label} · Day {cyclePos}
          </div>
          <div className="font-body text-[13px] text-cloud-white/80 mt-1">{subline}</div>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        {/* Phase bar */}
        <div className="relative flex items-center" style={{ height: 24 }}>
          <div className="absolute inset-0 flex items-center">
            <div className="relative w-full h-3 rounded overflow-hidden">
              {/* Menstrual */}
              <div className="absolute inset-y-0 left-0 bg-blush-pink" style={{ width: `${(periodLen / totalLen) * 100}%` }} />
              {/* Follicular */}
              <div className="absolute inset-y-0 bg-mint-green" style={{ left: `${(periodLen / totalLen) * 100}%`, width: `${((ovulationDay - periodLen) / totalLen) * 100}%` }} />
              {/* Ovulation peak */}
              <div className="absolute inset-y-0 bg-butter" style={{ left: `${(ovulationDay / totalLen) * 100}%`, width: `${(2 / totalLen) * 100}%` }} />
              {/* Early luteal */}
              <div className="absolute inset-y-0 bg-soft-lilac" style={{ left: `${(lutealDay / totalLen) * 100}%`, width: `${((warningDay - lutealDay) / totalLen) * 100}%` }} />
              {/* 10-day warning zone */}
              <div className="absolute inset-y-0" style={{ left: `${(warningDay / totalLen) * 100}%`, right: 0, background: 'rgba(255,234,167,0.75)' }} />
            </div>
          </div>
          {/* Warning zone border — outside overflow:hidden so it's not clipped */}
          <div
            className="absolute pointer-events-none z-10"
            style={{
              left: `${(warningDay / totalLen) * 100}%`,
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              height: 18,
              borderRadius: '0 4px 4px 0',
              border: '2.5px solid rgba(255,160,180,0.95)',
              boxShadow: '0 0 6px rgba(255,120,150,0.3), inset 0 0 4px rgba(255,160,180,0.08)',
            }}
          />
          {/* Current day marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 rounded-full z-20"
            style={{
              left: `calc(${(cyclePos / totalLen) * 100}% - 1.5px)`,
              background: '#ffe066',
              boxShadow: '0 0 6px 2px rgba(255,224,102,0.7)',
            }}
          />
        </div>

        {/* Boundary dates */}
        <div className="relative mt-1" style={{ height: 30 }}>
          {boundaries.map((b, i) => {
            const isFirst = i === 0;
            const isLast = i === boundaries.length - 1;
            const isWarning = b.label === '⚠';
            return (
              <div
                key={b.label + b.date + i}
                className="absolute font-bold"
                style={{
                  left: isLast ? 'auto' : `${b.pct}%`,
                  right: isLast ? 0 : 'auto',
                  transform: isFirst ? 'none' : isLast ? 'none' : 'translateX(-50%)',
                  textAlign: isFirst ? 'left' : isLast ? 'right' : 'center',
                  fontSize: 11,
                  lineHeight: 1.4,
                  color: isWarning ? 'rgba(255,234,167,0.8)' : 'rgba(253,252,255,0.5)',
                }}
              >
                {b.label && <div>{b.label}</div>}
                <div>{b.date}</div>
              </div>
            );
          })}
        </div>
      </div>

      <span className="text-lg text-cloud-white/50 flex-shrink-0">›</span>
    </button>
  );
}
