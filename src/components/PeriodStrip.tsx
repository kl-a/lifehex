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
  const boundaries = [
    { pct: 0,                                     label: 'M', date: fmt(cycleStart) },
    { pct: (periodLen / totalLen) * 100,           label: 'F', date: fmt(addD(cycleStart, periodLen)) },
    { pct: (ovulationDay / totalLen) * 100,        label: 'O', date: fmt(addD(cycleStart, ovulationDay)) },
    { pct: (lutealDay / totalLen) * 100,           label: 'L', date: fmt(addD(cycleStart, lutealDay)) },
    { pct: 100,                                    label: '',  date: fmt(addD(cycleStart, totalLen)) },
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
          <div className="font-bold text-[9px] tracking-wide" style={{ color: c.bg }}>
            {c.label} · Day {cyclePos}
          </div>
          <div className="font-body text-[12px] text-cloud-white/80 mt-1">{subline}</div>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        {/* Phase bar */}
        <div className="relative flex items-center" style={{ height: 20 }}>
          <div className="absolute inset-0 flex items-center">
            <div className="relative w-full h-2 rounded overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-blush-pink" style={{ width: `${(periodLen / totalLen) * 100}%` }} />
              <div className="absolute inset-y-0 bg-mint-green" style={{ left: `${(periodLen / totalLen) * 100}%`, width: `${((ovulationDay - periodLen) / totalLen) * 100}%` }} />
              <div className="absolute inset-y-0 bg-butter" style={{ left: `${(ovulationDay / totalLen) * 100}%`, width: `${(2 / totalLen) * 100}%` }} />
              <div className="absolute inset-y-0 right-0 bg-soft-lilac" style={{ left: `${(lutealDay / totalLen) * 100}%` }} />
            </div>
          </div>
          {/* Marker outside the overflow-hidden bar */}
          <div
            className="absolute top-0 bottom-0 w-0.5 rounded-full z-10"
            style={{
              left: `calc(${(cyclePos / totalLen) * 100}% - 1.5px)`,
              background: '#ffe066',
              boxShadow: '0 0 6px 2px rgba(255,224,102,0.7)',
            }}
          />
        </div>

        {/* Boundary dates */}
        <div className="relative mt-1" style={{ height: 28 }}>
          {boundaries.map((b, i) => {
            const isFirst = i === 0;
            const isLast = i === boundaries.length - 1;
            return (
              <div
                key={b.label + b.date + i}
                className="absolute font-bold text-cloud-white/50"
                style={{
                  left: isLast ? 'auto' : `${b.pct}%`,
                  right: isLast ? 0 : 'auto',
                  transform: isFirst ? 'none' : isLast ? 'none' : 'translateX(-50%)',
                  textAlign: isFirst ? 'left' : isLast ? 'right' : 'center',
                  fontSize: 9,
                  lineHeight: 1.4,
                  letterSpacing: 0.3,
                }}
              >
                {b.label && <div className="uppercase">{b.label}</div>}
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
