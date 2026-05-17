import type { CyclePhase } from '../types';
import { PHASE_COLORS } from '../utils/cyclePredictor';

interface Props {
  phase?: CyclePhase;
  size?: number;
  ghost?: boolean;
}

export function MoonIcon({ phase = 'luteal', size = 16, ghost = false }: Props) {
  const c = PHASE_COLORS[phase].bg;
  const stroke = PHASE_COLORS[phase].shadow;
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
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="6" fill="transparent" stroke={stroke} strokeWidth="1.5" />
      <path d="M8 2 A6 6 0 0 1 8 14 A4 6 0 0 0 8 2 Z" fill={fill} stroke={stroke} strokeWidth="1" />
    </svg>
  );
}
