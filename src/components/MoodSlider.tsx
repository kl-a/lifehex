interface Props {
  label: string;
  sublabel?: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  emojiForValue: (v: number) => string;
}

export function MoodSlider({ label, sublabel, value, onChange, disabled = false, emojiForValue }: Props) {
  return (
    <div style={{ opacity: disabled ? 0.55 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="font-bold text-[10px] uppercase tracking-widest text-star-gold">{label}</span>
        {sublabel && <span className="font-body text-[11px] text-muted-purple">{sublabel}</span>}
        <span className="ml-auto font-bold text-[12px] text-cloud-white">{value}<span className="text-muted-purple text-[10px]">/10</span></span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[26px] leading-none flex-shrink-0 w-8 text-center" style={{ transition: 'opacity 80ms' }}>
          {emojiForValue(value)}
        </span>
        <div className="relative flex-1" style={{ height: 24 }}>
          <input
            type="range" min="1" max="10" step="1"
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(parseInt(e.target.value, 10))}
            className="pixslider w-full absolute inset-0"
            style={{ height: '100%' }}
          />
        </div>
      </div>

      {/* Tick marks */}
      <div className="flex justify-between mt-1" style={{ paddingLeft: 44 }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <span
            key={n}
            className="font-bold text-[8px]"
            style={{ color: n === value ? '#ffe066' : 'rgba(155,137,196,0.35)' }}
          >{n}</span>
        ))}
      </div>
    </div>
  );
}
