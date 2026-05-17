import { BottomSheet } from './BottomSheet';
import { DIMENSIONS } from '../data/constants';
import type { DimensionScores } from '../types';

interface Props {
  dimKey: keyof DimensionScores | null;
  value: number;
  onChange: (key: keyof DimensionScores, value: number) => void;
  onClose: () => void;
}

export function DimensionSheet({ dimKey, value, onChange, onClose }: Props) {
  const dim = DIMENSIONS.find((d) => d.key === dimKey);

  return (
    <BottomSheet open={!!dimKey} onClose={onClose} title={dim?.label ?? ''}>
      {dim && (
        <div>
          <p className="font-body text-[13px] text-cloud-white/75 mb-4">{dim.desc}</p>

          <div className="flex items-center gap-4 mb-2">
            <span className="font-bold text-[32px] text-butter w-14 text-right">{value}</span>
            <input
              type="range" min="0" max="10" step="1"
              value={value}
              onChange={(e) => onChange(dim.key, parseInt(e.target.value, 10))}
              className="pixslider flex-1"
            />
          </div>
          <div className="flex justify-between font-body text-[11px] text-lilac-shadow px-14 mb-5">
            <span>0</span><span>5</span><span>10</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="font-bold text-[7px] text-mint-green uppercase tracking-widest mb-2">Adds +</div>
              <div className="flex flex-col gap-1.5">
                {dim.adds.map((a) => (
                  <span key={a} className="chip-readonly border-mint-shadow/40">
                    <span className="font-body text-[11px] text-mint-green">+ {a}</span>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="font-bold text-[7px] text-blush-shadow uppercase tracking-widest mb-2">Detracts −</div>
              <div className="flex flex-col gap-1.5">
                {dim.detracts.map((a) => (
                  <span key={a} className="chip-readonly border-blush-shadow/40">
                    <span className="font-body text-[11px] text-blush-shadow">− {a}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button
            className="btn-butter w-full mt-5 font-bold text-[9px]"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      )}
    </BottomSheet>
  );
}
