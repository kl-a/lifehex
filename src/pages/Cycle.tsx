import { useState } from 'react';
import { MoonIcon } from '../components/MoonIcon';
import { useCycleStore } from '../store/cycleStore';
import { useSettingsStore } from '../store/settingsStore';
import { getCyclePhase, isoDate, fmtDate, PHASE_COLORS } from '../utils/cyclePredictor';
import { v4 as uuid } from 'uuid';

export function Cycle() {
  const { cycles, logStart, logEnd, updateCycle, removeCycle, addCycleEntry } = useCycleStore();
  const {
    expectedCycleLength: cycleLen,
    expectedPeriodLength: periodLen,
    setExpectedCycleLength,
    setExpectedPeriodLength,
  } = useSettingsStore();

  const today = new Date();
  const startISO = cycles.length ? cycles[0].cycleStartDate : isoDate(today);
  const phaseInfo = getCyclePhase(startISO, cycleLen, periodLen, today);
  const periodActive = cycles.length > 0 && !cycles[0].cycleEndDate;

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');

  // Add past cycle state
  const [addingOpen, setAddingOpen] = useState(false);
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');

  // Phase ring geometry
  const size = 280, cx = size / 2, cy = size / 2, R = size / 2 - 14, r = R - 36;
  const total = cycleLen;
  const dayAngle = (d: number) => -Math.PI / 2 + ((d - 1) / total) * 2 * Math.PI;

  const arcs = [
    { from: 1, to: periodLen, fill: '#f7cac9', stroke: '#c98a88' },
    { from: periodLen + 1, to: total / 2 - 1, fill: '#b5ead7', stroke: '#6aab90' },
    { from: total / 2 - 1, to: total / 2 + 1, fill: '#ffeaa7', stroke: '#c9a84c' },
    { from: total / 2 + 1, to: total, fill: '#c9b8f0', stroke: '#7a6fa0' },
  ];

  const arcPath = (start: number, end: number, rad: number) => {
    const a0 = dayAngle(start), a1 = dayAngle(end);
    const x0 = cx + Math.cos(a0) * rad, y0 = cy + Math.sin(a0) * rad;
    const x1 = cx + Math.cos(a1) * rad, y1 = cy + Math.sin(a1) * rad;
    const large = (end - start) / total > 0.5 ? 1 : 0;
    return { x0, y0, x1, y1, large };
  };

  const ringPath = (from: number, to: number) => {
    const o = arcPath(from, to, R);
    const i = arcPath(to, from, r);
    return `M ${o.x0} ${o.y0} A ${R} ${R} 0 ${o.large} 1 ${o.x1} ${o.y1} L ${i.x0} ${i.y0} A ${r} ${r} 0 ${o.large} 0 ${i.x1} ${i.y1} Z`;
  };

  const markerAngle = dayAngle(phaseInfo.cyclePos);
  const mx = cx + Math.cos(markerAngle) * ((R + r) / 2);
  const my = cy + Math.sin(markerAngle) * ((R + r) / 2);

  function handleStart() {
    if (periodActive) return;
    const now = new Date().toISOString();
    logStart({
      id: uuid(),
      cycleStartDate: isoDate(today),
      cycleEndDate: null,
      cycleLength: cycleLen,
      periodLength: periodLen,
      created_at: now,
      updated_at: now,
    });
  }

  function handleEnd() {
    if (!periodActive || !cycles[0]) return;
    logEnd(cycles[0].id, isoDate(today));
  }

  function startEdit(id: string, startDate: string, endDate: string | null) {
    setEditingId(id);
    setEditStart(startDate);
    setEditEnd(endDate ?? '');
  }

  function handleSaveEdit(id: string) {
    if (!editStart) return;
    updateCycle(id, { cycleStartDate: editStart, cycleEndDate: editEnd || null });
    setEditingId(null);
  }

  function handleAddCycle() {
    if (!newStart) return;
    const now = new Date().toISOString();
    addCycleEntry({
      id: uuid(),
      cycleStartDate: newStart,
      cycleEndDate: newEnd || null,
      cycleLength: cycleLen,
      periodLength: periodLen,
      created_at: now,
      updated_at: now,
    });
    setNewStart('');
    setNewEnd('');
    setAddingOpen(false);
  }

  return (
    <div className="flex flex-col gap-4 pb-16">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-bold text-[14px] text-cloud-white">Cycle</div>
          <div className="font-body text-[12px] text-lilac-shadow mt-1">
            {PHASE_COLORS[phaseInfo.phase].label} · Day {phaseInfo.cyclePos} of {total}
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold text-[7px] text-lilac-shadow uppercase">Next Period</div>
          <div className="font-bold text-[10px] text-butter mt-1">
            {phaseInfo.phase === 'menstrual' ? 'In progress' : `In ${total - phaseInfo.cyclePos}d`}
          </div>
        </div>
      </div>

      {/* Phase ring */}
      <div className="card-indigo flex flex-col items-center p-4">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} shapeRendering="geometricPrecision" style={{ maxWidth: '100%' }}>
          {arcs.map((a, i) => (
            <path key={i} d={ringPath(a.from, a.to)} fill={a.fill} stroke={a.stroke} strokeWidth="1.5"
              opacity={phaseInfo.phase === (['menstrual','follicular','ovulation','luteal'][i]) ? 1 : 0.4}
            />
          ))}
          {Array.from({ length: total }).map((_, i) => {
            const ang = dayAngle(i + 1);
            return <line key={i} x1={cx + Math.cos(ang) * R} y1={cy + Math.sin(ang) * R} x2={cx + Math.cos(ang) * (R - 4)} y2={cy + Math.sin(ang) * (R - 4)} stroke="rgba(22,33,62,0.8)" strokeWidth="1" />;
          })}
          <circle cx={mx} cy={my} r="5" fill="#ffe066" stroke="#16213e" strokeWidth="2" />
          <text x={cx} y={cy - 22} textAnchor="middle" fontFamily="'Press Start 2P'" fontWeight="700" fontSize="10" fill="#9b89c4">DAY</text>
          <text x={cx} y={cy + 18} textAnchor="middle" fontFamily="'Press Start 2P'" fontWeight="700" fontSize="42" fill="#ffeaa7">{phaseInfo.cyclePos}</text>
          <text x={cx} y={cy + 36} textAnchor="middle" fontFamily="'Press Start 2P'" fontWeight="700" fontSize="10" fill="#fdfcff">OF {total}</text>
        </svg>
        <div className="flex items-center gap-3 mt-3">
          <MoonIcon phase={phaseInfo.phase} size={24} />
          <div>
            <div className="font-body text-[14px] font-bold text-cloud-white">{PHASE_COLORS[phaseInfo.phase].label}</div>
            <div className="font-body text-[12px] text-lilac-shadow mt-1">
              {phaseInfo.phase === 'menstrual'
                ? `Day ${phaseInfo.cyclePos} of ${periodLen} period days`
                : `Next period in ${total - phaseInfo.cyclePos} days`}
            </div>
          </div>
        </div>
      </div>

      {/* Log period */}
      <div className="card-indigo">
        <div className="font-bold text-[8px] text-star-gold mb-3">Log Period</div>
        <div className="flex gap-2">
          <button className={`btn-${periodActive ? 'ghost' : 'blush'} flex-1 font-bold text-[8px]`} onClick={handleStart} disabled={periodActive}>
            {periodActive ? 'Currently active' : 'Started today'}
          </button>
          <button className="btn-ghost flex-1 font-bold text-[8px]" disabled={!periodActive} onClick={handleEnd}>
            Ended today
          </button>
        </div>
      </div>

      {/* Expected lengths */}
      <div className="card-indigo">
        <div className="font-bold text-[8px] text-star-gold mb-4">Expected Lengths</div>
        <SettingSlider label="Cycle length" min={21} max={35} value={cycleLen} onChange={setExpectedCycleLength} unit="days" />
        <div className="h-4" />
        <SettingSlider label="Period duration" min={3} max={8} value={periodLen} onChange={setExpectedPeriodLength} unit="days" />
        <p className="font-body text-[11px] text-lilac-shadow mt-3 leading-relaxed">
          Predictions rebase from your most recent confirmed start date.
        </p>
      </div>

      {/* Cycle log */}
      <div className="flex justify-between items-center mt-2">
        <div className="font-bold text-sm text-cloud-white">Cycle Log</div>
        <button
          onClick={() => { setAddingOpen((o) => !o); setNewStart(''); setNewEnd(''); }}
          className="btn-ghost text-xs px-3 py-1.5"
        >
          {addingOpen ? 'Cancel' : '+ Add past cycle'}
        </button>
      </div>

      {/* Add past cycle form */}
      {addingOpen && (
        <div className="card-indigo flex flex-col gap-3">
          <div className="text-xs font-bold text-star-gold">Add Past Cycle</div>
          <p className="text-xs text-muted-purple">
            The new cycle will be inserted chronologically — existing cycles renumber automatically.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-purple mb-1.5 block">Period start date <span className="text-blush-pink">*</span></label>
              <DateInput value={newStart} onChange={setNewStart} max={isoDate(today)} />
            </div>
            <div>
              <label className="text-xs text-muted-purple mb-1.5 block">Period end date <span className="text-lilac-shadow">(optional)</span></label>
              <DateInput value={newEnd} onChange={setNewEnd} max={isoDate(today)} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAddingOpen(false)} className="btn-ghost text-xs px-3 py-1.5">Cancel</button>
            <button onClick={handleAddCycle} disabled={!newStart} className="btn-blush text-xs px-3 py-1.5">Add Cycle</button>
          </div>
        </div>
      )}

      {/* Cycle rows */}
      {cycles.length === 0 ? (
        <div className="card-base p-4 text-sm text-muted-purple text-center">
          No cycles logged yet. Log a period start above.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {cycles.map((c, i) => (
            <div key={c.id} className="card-base p-3">
              {editingId === c.id ? (
                <div className="flex flex-col gap-3">
                  <div className="text-xs font-bold text-cloud-white">
                    {i === 0 ? 'Current cycle' : `Cycle −${i}`}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-purple mb-1.5 block">Period start date</label>
                      <DateInput value={editStart} onChange={setEditStart} max={isoDate(today)} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-purple mb-1.5 block">Period end date</label>
                      <DateInput value={editEnd} onChange={setEditEnd} max={isoDate(today)} />
                      {i === 0 && (
                        <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!editEnd}
                            onChange={(e) => setEditEnd(e.target.checked ? '' : isoDate(today))}
                            className="accent-mint-green"
                          />
                          <span className="text-xs text-muted-purple">Still in progress</span>
                        </label>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingId(null)} className="btn-ghost text-xs px-3 py-1.5">Cancel</button>
                    <button onClick={() => handleSaveEdit(c.id)} disabled={!editStart} className="btn-butter text-xs px-3 py-1.5">Save</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-muted-purple mb-0.5">
                      {i === 0 ? 'Current' : `Cycle −${i}`}
                    </div>
                    <div className="text-sm font-semibold text-cloud-white">
                      {fmtDate(c.cycleStartDate)}
                      <span className="text-muted-purple mx-1.5">→</span>
                      {c.cycleEndDate ? fmtDate(c.cycleEndDate) : <span className="text-mint-green">in progress</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => startEdit(c.id, c.cycleStartDate, c.cycleEndDate)}
                    className="btn-ghost text-xs px-2.5 py-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => removeCycle(c.id)}
                    className="text-muted-purple/40 hover:text-blush-pink transition-colors text-xs px-2 py-1 rounded border border-transparent hover:border-blush-pink/30"
                    title="Delete cycle"
                  >✕</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DateInput({ value, onChange, max }: { value: string; onChange: (v: string) => void; max?: string }) {
  return (
    <input
      type="date"
      value={value}
      max={max}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-night-sky border border-muted-purple/40 rounded-lg px-3 py-2 text-sm text-cloud-white focus:outline-none focus:border-muted-purple/80 transition-colors"
      style={{ colorScheme: 'dark' }}
    />
  );
}

function SettingSlider({ label, min, max, value, onChange, unit }: { label: string; min: number; max: number; value: number; onChange: (n: number) => void; unit: string }) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="font-body text-[13px] font-semibold text-cloud-white">{label}</span>
        <span className="font-bold text-[9px] text-butter">{value} {unit}</span>
      </div>
      <input type="range" min={min} max={max} step="1" className="pixslider w-full" value={value} onChange={(e) => onChange(parseInt(e.target.value, 10))} />
    </div>
  );
}
