export interface DimensionScores {
  creative: number;
  connection: number;
  restoration: number;
  boundaries: number;
  meaningfulWork: number;
  physicalHealth: number;
}

export interface Session {
  id: string;
  timestamp: string;
  dimensions: DimensionScores;
  mood: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface CycleEntry {
  id: string;
  cycleStartDate: string;
  cycleEndDate: string | null;
  cycleLength: number;
  periodLength: number;
  created_at: string;
  updated_at: string;
}

export interface Settings {
  expectedCycleLength: number;
  expectedPeriodLength: number;
  driveConnected: boolean;
  lastSyncedAt: string | null;
}

export interface Tag {
  id: string;
  label: string;
  em: string;
  group: string;
}

export interface Dimension {
  key: keyof DimensionScores;
  label: string;
  short: string;
  desc: string;
  adds: string[];
  detracts: string[];
}

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

export interface PhaseInfo {
  phase: CyclePhase;
  cyclePos: number;
  totalLen: number;
}
