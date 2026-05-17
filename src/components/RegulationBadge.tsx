import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type Zone = 'green' | 'amber' | 'red';

interface Props {
  zone: Zone;
  reasons?: string[];
  onOverride: (zone: Zone) => void;
}

const ZONE_STYLES: Record<Zone, { bg: string; border: string; dot: string; label: string }> = {
  green: { bg: 'rgba(181,234,215,0.15)', border: '#6aab90', dot: '#b5ead7', label: 'GREEN' },
  amber: { bg: 'rgba(255,234,167,0.15)', border: '#c9a84c', dot: '#ffeaa7', label: 'AMBER' },
  red:   { bg: 'rgba(247,202,201,0.15)', border: '#c98a88', dot: '#f7cac9', label: 'RED'   },
};

export function RegulationBadge({ zone, reasons = [], onOverride }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const s = ZONE_STYLES[zone];

  return (
    <div className="relative h-full">
      <div
        className="flex items-center gap-3 px-4 py-2.5 rounded h-full"
        style={{ background: s.bg, border: `2px solid ${s.border}` }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="font-bold text-[8px] uppercase tracking-widest text-muted-purple flex-shrink-0">Current State</span>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.dot }} />
            <span className="font-bold text-[11px] flex-shrink-0" style={{ color: s.dot }}>{s.label}</span>
            {zone !== 'green' && reasons.length > 0 && (
              <span className="font-body text-[10px] text-muted-purple truncate">{reasons.join(' · ')}</span>
            )}
          </div>
          <button
            onClick={() => setShowPicker((v) => !v)}
            className="font-bold text-[9px] text-muted-purple hover:text-cloud-white transition-colors flex-shrink-0"
          >↺ override</button>
        </div>
      </div>

      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full left-0 right-0 mt-1 z-20 card-indigo flex gap-2 p-3"
          >
            {(['green', 'amber', 'red'] as Zone[]).map((z) => {
              const zs = ZONE_STYLES[z];
              return (
                <button
                  key={z}
                  onClick={() => { onOverride(z); setShowPicker(false); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded font-bold text-[10px] transition-opacity"
                  style={{
                    background: zs.bg,
                    border: `2px solid ${zs.border}`,
                    color: zs.dot,
                    opacity: z === zone ? 1 : 0.65,
                  }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: zs.dot }} />
                  {zs.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
