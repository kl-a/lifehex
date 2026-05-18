export interface DimensionScores {
  healthBody: number;
  mentalWellbeing: number;
  relationships: number;
  family: number;
  workCareer: number;
  creativeArt: number;
  restRecovery: number;
  nourishment: number;
}

export interface RegulationInputs {
  mood: number;
  energy: number;
  regulation: number;
  isLutealPhase: boolean;
  medicationTaken: boolean;
  isWeekday: boolean;
  symptomCount: number;
  thatWasntMeToday: boolean;
  sleepQuality: number | null;
  mealsLogged: number;
  gymToday: boolean;
}

export interface ZoneOverride {
  sessionId: string;
  date: string;
  systemSuggested: 'green' | 'amber' | 'red';
  userConfirmed: 'green' | 'amber' | 'red';
  inputsSnapshot: RegulationInputs;
}

export interface Session {
  id: string;
  timestamp: string;
  dimensions: DimensionScores;
  mood: number;
  energy: number;
  emotionalRegulation: number;
  systemZone: 'green' | 'amber' | 'red';
  confirmedZone: 'green' | 'amber' | 'red';
  zoneOverride: ZoneOverride | null;
  created_at: string;
  updated_at: string;
}

export interface MealLog {
  meal: 'breakfast' | 'lunch' | 'dinner';
  logged: boolean;
  loggedTime: string | null;
  note: string;
  properBreak: boolean;
}

export interface DayRecord {
  id: string;
  date: string;
  medicationTaken: boolean;
  medicationTime: string | null;
  meals: MealLog[];
  lunchBreakTaken: boolean;
  lunchBreakTime: string | null;
  gymToday: boolean;
  gymTime: string | null;
  aloneTimeToday: boolean;
  aloneTimeStart: string | null;
  symptoms: string[];
  brainFog: number | null;
  workingMemoryImpaired: boolean;
  focusQuality: number | null;
  sleepHours: number | null;
  sleepQuality: number | null;
  thatWasntMe: boolean;
  thatWasntMeNote: string;
  moodAverage: number | null;
  dominantZone: 'green' | 'amber' | 'red' | null;
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
  morningRoutineTime: string;
  lunchNudgeTime: string;
  bedtimeRoutineTime: string;
  weekdayMedicationTracking: boolean;
  driveConnected: boolean;
  lastSyncedAt: string | null;
  updated_at: string;
  moodAlertThreshold: number;
  googleCalendarConnected: boolean;
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
