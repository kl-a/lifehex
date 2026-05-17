import type { RegulationInputs } from '../types';

export function getZoneReasons(inputs: RegulationInputs): string[] {
  const reasons: string[] = [];
  if (inputs.mood < 4) reasons.push('low mood');
  if (inputs.energy < 4) reasons.push('low energy');
  if (inputs.regulation < 4) reasons.push('low regulation');
  if (inputs.isLutealPhase) reasons.push('luteal phase');
  if (inputs.symptomCount >= 3) reasons.push('multiple symptoms');
  if (inputs.thatWasntMeToday) reasons.push('dissociation flagged');
  if (inputs.isWeekday && !inputs.medicationTaken) reasons.push('no medication today');
  return reasons.slice(0, 2);
}

export function calculateZone(inputs: RegulationInputs): 'green' | 'amber' | 'red' {
  // Hard floor — any core state below 2 → red immediately
  if (inputs.mood < 2 || inputs.energy < 2 || inputs.regulation < 2) return 'red';

  // Hard floor — any core state below 4 → at least amber; still escalates to red if severe
  if (inputs.mood < 4 || inputs.energy < 4 || inputs.regulation < 4) {
    let risk = 0;
    if (inputs.mood < 4) risk += 1;
    if (inputs.energy < 4) risk += 1;
    if (inputs.regulation < 4) risk += 2;
    if (inputs.thatWasntMeToday) risk += 2;
    if (inputs.symptomCount >= 3) risk += 2;
    if (inputs.isLutealPhase) risk += 1;
    return risk >= 6 ? 'red' : 'amber';
  }

  let risk = 0;

  if (inputs.mood <= 3) risk += 3;
  else if (inputs.mood <= 5) risk += 1;

  if (inputs.energy <= 3) risk += 2;
  else if (inputs.energy <= 5) risk += 1;

  if (inputs.regulation <= 3) risk += 3;
  else if (inputs.regulation <= 5) risk += 1;

  if (inputs.isLutealPhase) risk += 1;
  if (inputs.isWeekday && !inputs.medicationTaken) risk += 1;

  if (inputs.symptomCount >= 3) risk += 2;
  else if (inputs.symptomCount >= 1) risk += 1;

  if (inputs.thatWasntMeToday) risk += 2;
  if (inputs.sleepQuality !== null && inputs.sleepQuality <= 2) risk += 1;

  if (inputs.gymToday) risk -= 1;
  if (inputs.mealsLogged >= 2) risk -= 1;

  if (risk >= 6) return 'red';
  if (risk >= 3) return 'amber';
  return 'green';
  // TODO: adaptive weight refinement from override history
}
