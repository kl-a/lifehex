import { MOOD_EMOJI } from '../data/constants';

interface Props {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}

export function MoodSlider({ value, onChange, disabled = false }: Props) {
  const pct = ((value - 1) / 9) * 100;
  const TRACK_H = 240;
  const emojiTop = Math.round(219 - (pct / 100) * 218);

  return (
    <div
      className="flex flex-col items-center gap-0 select-none flex-shrink-0 py-1"
      style={{ opacity: disabled ? 0.65 : 1 }}
    >
      <span className="font-bold text-[8px] text-butter mb-1 tracking-wide">Mood</span>
      <span className="font-bold text-[9px] text-butter mb-1">10</span>

      <div className="relative" style={{ width: 44, height: TRACK_H }}>
        <span
          className="absolute pointer-events-none"
          style={{ top: emojiTop, left: 2, fontSize: 18, lineHeight: 1, transition: 'top 60ms ease' }}
        >
          {MOOD_EMOJI(value)}
        </span>
        <input
          type="range" min="1" max="10" step="1"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="pixslider-vert absolute right-0 top-0"
        />
      </div>

      <span className="font-bold text-[9px] text-lilac-shadow mt-1">1</span>
      <span className="font-bold text-[11px] text-butter mt-1">{value}</span>
    </div>
  );
}
