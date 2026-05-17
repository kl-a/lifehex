// Cycle phase math + moon icon component

function getCyclePhase(startISO, cycleLen, periodLen, today) {
  const start = new Date(startISO + 'T00:00:00');
  const day = Math.floor((today - start) / (1000 * 60 * 60 * 24));
  const cyclePos = ((day % cycleLen) + cycleLen) % cycleLen + 1; // 1..cycleLen
  let phase = 'luteal';
  if (cyclePos <= periodLen) phase = 'menstrual';
  else if (cyclePos < cycleLen / 2 - 1) phase = 'follicular';
  else if (cyclePos <= cycleLen / 2 + 1) phase = 'ovulation';
  else phase = 'luteal';
  return { day, cyclePos, phase, totalLen: cycleLen };
}

const PHASE_COLOR = {
  menstrual: { bg: '#f7cac9', shadow: '#c98a88', label: 'Menstrual' },
  follicular: { bg: '#b5ead7', shadow: '#6aab90', label: 'Follicular' },
  ovulation: { bg: '#ffeaa7', shadow: '#c9a84c', label: 'Ovulation' },
  luteal: { bg: '#c9b8f0', shadow: '#7a6fa0', label: 'Luteal' },
};

function MoonIcon({ phase = 'luteal', size = 16, ghost = false }) {
  const c = PHASE_COLOR[phase].bg;
  const stroke = PHASE_COLOR[phase].shadow;
  const fill = ghost ? 'transparent' : c;
  if (phase === 'menstrual') {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="6" fill={fill} stroke={stroke} strokeWidth="1.5" />
      </svg>
    );
  }
  if (phase === 'ovulation') {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="6" fill={fill} stroke={stroke} strokeWidth="1.5" />
        <circle cx="6" cy="6" r="1" fill={stroke} opacity={ghost ? 0 : 0.4} />
      </svg>
    );
  }
  if (phase === 'follicular') {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="6" fill="transparent" stroke={stroke} strokeWidth="1.5" />
        <path d="M8 2 A6 6 0 0 0 8 14 A4 6 0 0 1 8 2 Z" fill={fill} stroke={stroke} strokeWidth="1" />
      </svg>
    );
  }
  // luteal: SH waning, lit on right
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="6" fill="transparent" stroke={stroke} strokeWidth="1.5" />
      <path d="M8 2 A6 6 0 0 1 8 14 A4 6 0 0 0 8 2 Z" fill={fill} stroke={stroke} strokeWidth="1" />
    </svg>
  );
}

Object.assign(window, { getCyclePhase, PHASE_COLOR, MoonIcon });
