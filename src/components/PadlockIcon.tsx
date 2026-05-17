interface Props {
  locked: boolean;
  size?: number;
}

export function PadlockIcon({ locked, size = 16 }: Props) {
  const c = locked ? '#9b89c4' : '#b5ead7';
  const h = Math.round(size * 18 / 16);
  return (
    <svg width={size} height={h} viewBox="0 0 16 18" fill="none">
      {locked ? (
        <path d="M4 8 V5.5 a4 4 0 0 1 8 0 V8" stroke={c} strokeWidth="2" strokeLinecap="round" />
      ) : (
        <path d="M4 8 V5.5 a4 4 0 0 1 7.5 -1.5" stroke={c} strokeWidth="2" strokeLinecap="round" />
      )}
      <rect x="2" y="8" width="12" height="9" rx="2.5" fill={c} />
      <rect x="7" y="11" width="2" height="3" rx="1" fill="#0f0f1a" />
    </svg>
  );
}
