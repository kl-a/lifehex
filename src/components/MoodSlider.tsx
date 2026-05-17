import { useState } from 'react';

interface Props {
  label: string;
  sublabel?: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  emojiForValue: (v: number) => string;
  vertical?: boolean;
  tooltip?: string;
}

export function MoodSlider({ label, sublabel, value, onChange, disabled = false, emojiForValue, vertical = false, tooltip }: Props) {
  if (vertical) {
    return <VerticalSlider label={label} value={value} onChange={onChange} disabled={disabled} emojiForValue={emojiForValue} tooltip={tooltip} />;
  }

  return (
    <div style={{ opacity: disabled ? 0.55 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="font-bold text-[10px] uppercase tracking-widest text-star-gold">{label}</span>
        {sublabel && <span className="font-body text-[11px] text-muted-purple">{sublabel}</span>}
        <span className="ml-auto font-bold text-[12px] text-cloud-white">{value}<span className="text-muted-purple text-[10px]">/10</span></span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[26px] leading-none flex-shrink-0 w-8 text-center">
          {emojiForValue(value)}
        </span>
        <div className="relative flex-1" style={{ height: 24 }}>
          <input
            type="range" min="1" max="10" step="1"
            value={value} disabled={disabled}
            onChange={(e) => onChange(parseInt(e.target.value, 10))}
            className="pixslider w-full absolute inset-0"
            style={{ height: '100%' }}
          />
        </div>
      </div>
      <div className="flex justify-between mt-1" style={{ paddingLeft: 44 }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <span key={n} className="font-bold text-[8px]"
            style={{ color: n === value ? '#ffe066' : 'rgba(155,137,196,0.35)' }}>{n}</span>
        ))}
      </div>
    </div>
  );
}

function VerticalSlider({ label, value, onChange, disabled, emojiForValue, tooltip }: Omit<Props, 'vertical' | 'sublabel'>) {
  const [showTip, setShowTip] = useState(false);
  // pct=0 → value=10 (top), pct=1 → value=1 (bottom).
  // Emoji (18px tall) centred on thumb: top = pct*(H-18) = calc(${pct} * (100% - 18px))
  const pct = (10 - value) / 9;

  return (
    <div
      className="flex flex-col items-center gap-1 h-full select-none"
      style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}
    >
      <span
        className="font-bold text-[9px] uppercase tracking-widest text-star-gold flex-shrink-0 text-center leading-tight relative cursor-default"
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
      >
        {label}
        {tooltip && showTip && (
          <div
            className="absolute bottom-full left-1/2 mb-2 z-50 rounded-lg p-2 text-left pointer-events-none normal-case tracking-normal"
            style={{
              transform: 'translateX(-50%)',
              width: 160,
              background: 'rgba(22,33,62,0.97)',
              border: '1px solid rgba(155,137,196,0.4)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            }}
          >
            <span className="font-bold text-[10px] text-star-gold block mb-0.5">{label}</span>
            <span className="text-[10px] text-muted-purple leading-snug">{tooltip}</span>
          </div>
        )}
      </span>

      <div className="relative flex-1 min-h-0 flex justify-center">
        <span
          style={{
            position: 'absolute',
            top: `calc(${pct} * (100% - 18px))`,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 18,
            lineHeight: 1,
            pointerEvents: 'none',
            zIndex: 1,
            transition: 'top 80ms ease',
          }}
        >
          {emojiForValue(value)}
        </span>

        <input
          type="range" min="1" max="10" step="1"
          value={value} disabled={disabled}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="pixslider-vert"
          style={{ height: '100%' }}
        />
      </div>

      <span className="font-bold text-[12px] text-butter flex-shrink-0">{value}</span>
    </div>
  );
}
