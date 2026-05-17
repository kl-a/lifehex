import { useRef, useEffect, useState } from 'react';

interface Props {
  label: string;
  sublabel?: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  emojiForValue: (v: number) => string;
  vertical?: boolean;
}

export function MoodSlider({ label, sublabel, value, onChange, disabled = false, emojiForValue, vertical = false }: Props) {

  if (vertical) {
    return <VerticalSlider label={label} value={value} onChange={onChange} disabled={disabled} emojiForValue={emojiForValue} />;
  }

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

function VerticalSlider({ label, value, onChange, disabled, emojiForValue }: Omit<Props, 'vertical' | 'sublabel'>) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackH, setTrackH] = useState(200);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setTrackH(entries[0].contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Thumb centre at top (value=10) = THUMB_R, at bottom (value=1) = trackH - THUMB_R
  // Emoji (18px tall) centred on thumb: top = thumbCentreY - 9
  const THUMB_R = 9;
  const thumbCentreY = THUMB_R + ((10 - value) / 9) * (trackH - THUMB_R * 2);
  const emojiTop = thumbCentreY - 9;

  return (
    <div
      className="flex flex-col items-center gap-1 h-full select-none"
      style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}
    >
      <span className="font-bold text-[9px] uppercase tracking-widest text-star-gold flex-shrink-0 text-center leading-tight">
        {label}
      </span>

      <div ref={trackRef} className="relative flex-1 min-h-0 flex items-center justify-center">
        {/* Emoji floats at value position */}
        <span
          style={{
            position: 'absolute',
            top: emojiTop,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 18,
            lineHeight: 1,
            pointerEvents: 'none',
            zIndex: 1,
            transition: 'top 60ms ease',
          }}
        >
          {emojiForValue(value)}
        </span>

        {/* Vertical track */}
        <input
          type="range"
          min="1" max="10" step="1"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="pixslider-vert"
          style={{ height: trackH }}
        />
      </div>

      <span className="font-bold text-[12px] text-butter flex-shrink-0">{value}</span>
    </div>
  );
}
