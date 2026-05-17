import type { Dimension } from '../types';

export const DIMENSIONS: Dimension[] = [
  {
    key: 'healthBody',
    label: 'Health & Body',
    short: 'HEALTH',
    desc: "Sleep, food, movement — the basics everything else runs on.",
    adds: [
      'Working out / intentional movement',
      "Full night's sleep",
      'Eating proper meals',
      'Walking freely',
      'Taking movement breaks',
      'Going to the gym',
      'Staying hydrated',
    ],
    detracts: [
      'Eating poorly',
      'Sleeping badly',
      'Skipping meals or eating while working',
      'Staying sedentary too long',
      'Delaying sleep for any task',
    ],
  },
  {
    key: 'mentalWellbeing',
    label: 'Mental & Emotional',
    short: 'MENTAL',
    desc: "How you're holding up inside. Regulation, clarity, groundedness.",
    adds: [
      'Booking therapy',
      'Processing something difficult and coming through it',
      'Noticing your state before it escalates',
      'Having a "that was actually me" day',
    ],
    detracts: [
      'Suppressing feelings',
      "Emotional blow-ups that weren't caught early",
      'Persistent low mood for multiple days',
      'Not acknowledging a hard luteal phase',
    ],
  },
  {
    key: 'relationships',
    label: 'Relationships',
    short: 'RELATE',
    desc: "Real contact with friends and John — the people outside your immediate daily bubble.",
    adds: [
      'Making plans with a friend and keeping them',
      'Reaching out first even briefly',
      'Doing something social outside the house',
      'A meaningful conversation with a friend',
    ],
    detracts: [
      'Cancelling consistently',
      'Only texting with no real interaction',
      'Weeks without contact',
      'Isolating under the guise of needing rest',
    ],
  },
  {
    key: 'family',
    label: 'Family',
    short: 'FAMILY',
    desc: "The carer load, mum situation, family dynamics.",
    adds: [
      'Showing up with presence and not resentment',
      'Setting a boundary with family that stuck',
      'Having a good day with mum',
    ],
    detracts: [
      'Absorbing carer load without any recovery',
      'Family stress bleeding into the whole day',
      'No separation between family time and your own time',
    ],
  },
  {
    key: 'workCareer',
    label: 'Work & Career',
    short: 'WORK',
    desc: "Whether what you're spending effort on actually feels meaningful.",
    adds: [
      'Working on something purposeful',
      "Finishing something you're proud of",
      'Making visible progress',
      'Learning something directly applicable',
    ],
    detracts: [
      'Full day of admin',
      'Busy but nothing completed that matters',
      'Meetings with no outcome',
      'Reactive all day',
      'Helping others at cost of your own work',
    ],
  },
  {
    key: 'creativeArt',
    label: 'Creative Life & Art',
    short: 'CREATE',
    desc: "Whether you're making things rather than just consuming them.",
    adds: [
      'Drawing your own ideas',
      'Finishing or fleshing out a piece',
      'Trying a new technique',
      'Working on a creative programming project',
    ],
    detracts: [
      'Watching tutorials without making anything',
      'Long gaps between sessions',
      'Consuming art passively and calling it practice',
      'Creative tools untouched for days',
    ],
  },
  {
    key: 'restRecovery',
    label: 'Rest & Recovery',
    short: 'REST',
    desc: "Whether the time you spend on yourself is actually refilling you.",
    adds: [
      'Watching something from your intentional shelf',
      'Reading manga or a book',
      'Listening to music without multitasking',
      'Walking without a podcast',
      'Playing Animal Crossing or low-stakes games',
    ],
    detracts: [
      'Doom-scrolling',
      'Consuming psychology self-help content',
      'True crime or horror content',
      "Busywork that doesn't connect to anything",
      'Only doing tasks for others',
    ],
  },
  {
    key: 'nourishment',
    label: 'Nourishment',
    short: 'NOURISH',
    desc: "Alone time. Brain-melt time. Time that is fully yours with no one else in it.",
    adds: [
      'A single hour completely alone',
      'Choosing rest over productivity in the evening',
      'Leaving the house alone intentionally',
      'Gaming for a few hours uninterrupted',
      'Doing something unplanned just because you felt like it',
    ],
    detracts: [
      'Not having a single hour alone in the day',
      'Filling recovery time with productive tasks',
      "Agreeing to plans you didn't want",
      'Never having a moment where no one needs something from you',
    ],
  },
];

export const MOOD_EMOJI = (v: number): string => {
  if (v <= 2) return '😫';
  if (v <= 4) return '🙁';
  if (v <= 6) return '😶';
  if (v <= 8) return '😄';
  return '😆';
};

export const ENERGY_EMOJI = (v: number): string => {
  if (v <= 3) return '🪫';
  if (v <= 6) return '😐';
  return '⚡';
};

export const REGULATION_EMOJI = (v: number): string => {
  if (v <= 3) return '🌋';
  if (v <= 6) return '😤';
  return '🧘';
};

export const DEFAULT_DIMENSIONS = {
  healthBody: 5,
  mentalWellbeing: 5,
  relationships: 5,
  family: 5,
  workCareer: 5,
  creativeArt: 5,
  restRecovery: 5,
  nourishment: 5,
};
