import type { RegulationInputs } from '../types';

export function calculateZone(inputs: RegulationInputs): 'green' | 'amber' | 'red' {
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
