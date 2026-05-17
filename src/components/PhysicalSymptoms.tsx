import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useDayStore } from '../store/dayStore';

const SYMPTOM_CHIPS = [
  { id: 'fatigue',           label: 'Fatigue',           em: '😴' },
  { id: 'bloating',          label: 'Bloating',          em: '🫧' },
  { id: 'breast_tenderness', label: 'Breast tenderness', em: '🌸' },
  { id: 'headache',          label: 'Headache',          em: '🤯' },
  { id: 'nausea',            label: 'Nausea',            em: '🤢' },
  { id: 'cramps',            label: 'Cramps',            em: '⚡' },
];

export function PhysicalSymptoms() {
  const [open, setOpen] = useState(false);
  const {
    dayRecord,
    toggleSymptom,
    setBrainFog,
    setWorkingMemoryImpaired,
    setFocusQuality,
    setSleepHours,
    setSleepQuality,
    setThatWasntMe,
    setThatWasntMeNote,
  } = useDayStore();

  const activeCount = dayRecord.symptoms.length;

  return (
    <div className="card-indigo">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 text-left"
      >
        <span className="font-bold text-[10px] uppercase tracking-widest text-muted-purple">
          {open ? '▼' : '▶'} Physical symptoms
        </span>
        <span className="font-body text-[11px] text-muted-purple/60">optional</span>
        {activeCount > 0 && (
          <span className="ml-auto font-bold text-[10px] text-blush-pink">{activeCount} logged</span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="pt-4 flex flex-col gap-4">
              {/* Symptom chips */}
              <div className="flex flex-wrap gap-2">
                {SYMPTOM_CHIPS.map((c) => {
                  const on = dayRecord.symptoms.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => toggleSymptom(c.id)}
                      className={`chip ${on ? 'chip-on' : ''}`}
                    >
                      <span className="text-base leading-none">{c.em}</span>
                      <span className="font-body text-[12px] font-semibold">{c.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Optional deeper tracking */}
              <div className="flex flex-col gap-3">
                {/* Brain fog */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-bold text-[9px] uppercase tracking-widest text-muted-purple">Brain fog</span>
                    <span className="font-body text-[11px] text-cloud-white">{dayRecord.brainFog ?? '—'}</span>
                  </div>
                  <input
                    type="range" min={1} max={10}
                    value={dayRecord.brainFog ?? 5}
                    onChange={(e) => setBrainFog(parseInt(e.target.value, 10))}
                    className="pixslider w-full"
                  />
                </div>

                {/* Focus quality */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-bold text-[9px] uppercase tracking-widest text-muted-purple">Focus quality</span>
                    <span className="font-body text-[11px] text-cloud-white">{dayRecord.focusQuality ?? '—'}</span>
                  </div>
                  <input
                    type="range" min={1} max={10}
                    value={dayRecord.focusQuality ?? 5}
                    onChange={(e) => setFocusQuality(parseInt(e.target.value, 10))}
                    className="pixslider w-full"
                  />
                </div>

                {/* Working memory */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dayRecord.workingMemoryImpaired}
                    onChange={(e) => setWorkingMemoryImpaired(e.target.checked)}
                    className="w-4 h-4 mt-0.5 accent-blush-pink flex-shrink-0"
                  />
                  <div>
                    <div className="font-bold text-[10px] uppercase tracking-widest text-muted-purple">Working memory impaired</div>
                    <div className="font-body text-[11px] text-muted-purple/60">Lost sentences / forgot context today</div>
                  </div>
                </label>

                {/* Sleep */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <span className="font-bold text-[9px] uppercase tracking-widest text-muted-purple block mb-1">Sleep hours</span>
                    <input
                      type="number" min={0} max={24} step={0.5}
                      value={dayRecord.sleepHours ?? ''}
                      placeholder="hrs"
                      onChange={(e) => setSleepHours(e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-full bg-night-sky border border-muted-purple/20 rounded px-3 py-1.5 font-body text-[12px] text-cloud-white placeholder:text-muted-purple/40 outline-none focus:border-muted-purple/50"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="font-bold text-[9px] uppercase tracking-widest text-muted-purple">Quality</span>
                      <span className="font-body text-[11px] text-cloud-white">{dayRecord.sleepQuality ?? '—'}/5</span>
                    </div>
                    <input
                      type="range" min={1} max={5}
                      value={dayRecord.sleepQuality ?? 3}
                      onChange={(e) => setSleepQuality(parseInt(e.target.value, 10))}
                      className="pixslider w-full"
                    />
                  </div>
                </div>
              </div>

              {/* "That wasn't me" */}
              <div
                className="rounded p-3 flex flex-col gap-2"
                style={{ background: 'rgba(247,202,201,0.08)', border: '2px solid rgba(201,138,136,0.35)' }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">😶</span>
                  <span className="font-bold text-[10px] text-blush-pink uppercase tracking-widest">"That wasn't me" moment</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setThatWasntMe(false)}
                    className={`flex-1 py-1.5 rounded border font-bold text-[10px] transition-all ${
                      !dayRecord.thatWasntMe
                        ? 'border-muted-purple/40 text-muted-purple bg-muted-purple/10'
                        : 'border-muted-purple/20 text-muted-purple/40'
                    }`}
                  >No</button>
                  <button
                    onClick={() => setThatWasntMe(true)}
                    className={`flex-1 py-1.5 rounded border font-bold text-[10px] transition-all ${
                      dayRecord.thatWasntMe
                        ? 'border-blush-pink/50 text-blush-pink bg-blush-pink/10'
                        : 'border-muted-purple/20 text-muted-purple/40'
                    }`}
                  >Yes — add a note</button>
                </div>
                {dayRecord.thatWasntMe && (
                  <input
                    type="text"
                    placeholder="What happened?"
                    value={dayRecord.thatWasntMeNote}
                    onChange={(e) => setThatWasntMeNote(e.target.value)}
                    className="w-full bg-night-sky border border-blush-pink/20 rounded px-3 py-1.5 font-body text-[12px] text-cloud-white placeholder:text-muted-purple/40 outline-none focus:border-blush-pink/40"
                    autoFocus
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
