import type { Dimension, Tag } from '../types';

export const DIMENSIONS: Dimension[] = [
  {
    key: 'creative',
    label: 'Creative',
    short: 'CREATE',
    desc: "Whether you're actually making things rather than consuming them. The act of putting something into the world, however small.",
    adds: [
      'Putting drawing tutorials to practice',
      'Sketching or drawing freely',
      'Finishing or fleshing out a piece',
      'Trying a new technique or style',
      'Working on creative programming projects',
    ],
    detracts: [
      'Watching tutorials without making anything',
      'Long gaps between creative sessions',
      'Consuming art passively and calling it practice',
      'Programming becomes compulsive, not creative',
      'Leaving creative tools untouched for days',
    ],
  },
  {
    key: 'connection',
    label: 'Connection',
    short: 'CONN',
    desc: "Whether you're maintaining real relationships outside your immediate circle. Genuine interaction with friends, not just proximity to people.",
    adds: [
      'Making plans with a friend and keeping them',
      'Having a meaningful conversation with a friend',
      'Reaching out first, even for a short call',
      'Doing something social outside the house',
    ],
    detracts: [
      'Cancelling on people consistently',
      'Only texting, no real interaction',
      'Weeks passing without contact',
      'Isolating under the guise of needing rest',
      'Only spending time with immediate family and partner',
    ],
  },
  {
    key: 'restoration',
    label: 'Restoration',
    short: 'REST',
    desc: "Whether the time you spend on yourself is actually refilling you. Intentional input that leaves you better than it found you.",
    adds: [
      'Watching something from the intentional shelf',
      'Reading manga or a book',
      'Listening to music without multitasking',
      'Going for a walk without a podcast',
      'Playing Animal Crossing or low-stakes games',
      'Doing something unplanned just because I felt like it',
    ],
    detracts: [
      'Doom-scrolling Instagram or TikTok',
      'Consuming psychology self-help content',
      'True crime or horror content',
      'Busywork that connects to nothing meaningful',
      'Multiple hours of passive algorithmic content',
      'Only doing tasks for others and nothing of my own',
    ],
  },
  {
    key: 'boundaries',
    label: 'Boundaries',
    short: 'BOUNDS',
    desc: "Whether you're actively protecting your own time and space. The deliberate act of saying no and holding the line on what's yours.",
    adds: [
      'Saying no to a social obligation',
      'Taking Monday leave without filling it with tasks',
      'Eating a meal without doing something else',
      'Choosing rest over productivity in the evening',
      'Leaving the house alone intentionally',
      'Booking time with the therapist',
    ],
    detracts: [
      "Agreeing to plans you didn't want",
      'Filling recovery time with productive tasks',
      'Skipping meals or eating while working',
      'Checking work messages outside hours',
      'Not having a single hour alone or quiet in the day',
    ],
  },
  {
    key: 'meaningfulWork',
    label: 'Meaning',
    short: 'MEAN',
    desc: "Whether what you're spending your effort on actually matters to you. How connected the work feels, not how much of it there is.",
    adds: [
      'Working on a project that feels purposeful or interesting',
      "Finishing something you're proud of",
      'Learning something directly applicable to work or life',
      'Making visible progress on something',
      'Working on personal tools or systems',
    ],
    detracts: [
      'Full day of admin or data entry work',
      'Busy but nothing completed that matters',
      'Meetings with no outcome',
      'Reactive work all day, no proactive work',
      'Helping others at the cost of your own work',
      'Rabbit-holing on one task at the expense of everything else',
    ],
  },
  {
    key: 'physicalHealth',
    label: 'Physical',
    short: 'BODY',
    desc: "Whether you're treating your body like it has to last. Sleep, food, and movement — the basics that everything else runs on.",
    adds: [
      'Working out or intentional movement',
      "Getting a full night's sleep",
      'Eating a proper meal',
      'Walking or wandering in free time',
      'Taking movement breaks between meetings',
      'Going to the gym',
      'Stay hydrated',
    ],
    detracts: [
      'Eating like a trash panda',
      'Sleeping poorly or at a bad angle',
      'Skipping meals or eating while doing something else',
      'Staying in one spot too long, for work or pleasure',
      'Delaying sleep for any task',
    ],
  },
];

export const TAGS: Tag[] = [
  { id: 'gym',              em: '🏋️', label: 'Gym',              group: 'Body'     },
  { id: 'walk',             em: '🚶', label: 'Walk',             group: 'Body'     },
  { id: 'ate_well',         em: '🥗', label: 'Ate well',         group: 'Body'     },
  { id: 'junk_food',        em: '🍕', label: 'Junk food',        group: 'Body'     },
  { id: 'good_sleep',       em: '🌙', label: 'Good sleep',       group: 'Body'     },
  { id: 'poor_sleep',       em: '😴', label: 'Poor sleep',       group: 'Body'     },
  { id: 'hydrated',         em: '💧', label: 'Hydrated',         group: 'Body'     },
  { id: 'drawing',          em: '🎨', label: 'Drawing',          group: 'Creative' },
  { id: 'creative_project', em: '✨', label: 'Creative project', group: 'Creative' },
  { id: 'social',           em: '🫂', label: 'Social outing',    group: 'Social'   },
  { id: 'working',          em: '💻', label: 'Working',          group: 'Work'     },
  { id: 'busy_day',         em: '📋', label: 'Busy day',         group: 'Work'     },
  { id: 'gaming',           em: '🎮', label: 'Gaming',           group: 'Rest'     },
  { id: 'reading',          em: '📖', label: 'Reading',          group: 'Rest'     },
  { id: 'rest_day',         em: '🛁', label: 'Rest day',         group: 'Rest'     },
  { id: 'nature',           em: '🌿', label: 'Outdoors',         group: 'Rest'     },
  { id: 'therapy',          em: '🛋️', label: 'Therapy',          group: 'Mind'     },
  { id: 'alone_time',       em: '🔇', label: 'Alone time',       group: 'Mind'     },
  { id: 'cooking',          em: '🍳', label: 'Cooking',          group: 'Life'     },
  { id: 'alcohol',          em: '🍷', label: 'Alcohol',          group: 'Life'     },
];

export const TAG_GROUP_ORDER = ['Body', 'Creative', 'Social', 'Work', 'Rest', 'Mind', 'Life'];

export const MOOD_EMOJI = (v: number): string => {
  if (v <= 2) return '😫';
  if (v <= 4) return '🙁';
  if (v <= 6) return '😶';
  if (v <= 8) return '😄';
  return '😆';
};

export const DEFAULT_DIMENSIONS = {
  creative: 5,
  connection: 5,
  restoration: 5,
  boundaries: 5,
  meaningfulWork: 5,
  physicalHealth: 5,
};
