# LifeHex — Wellness & Life Balance Tracker
## Design Document v3.0

---

## Overview

LifeHex is a personal browser-based web app (served via GitHub Pages) for tracking daily emotional wellbeing, life balance across eight dimensions, menstrual cycle phases, and ADHD/PMDD symptom patterns. It is designed exclusively for personal use and follows the same cosy pixel-DS aesthetic as Jar of Stars.

The app sits at the intersection of a mood journal, a wheel-of-life tracker, a cycle tracker, and a gentle daily structure tool. Its two distinguishing features are:

1. A **lock/unlock session system** that captures point-in-time snapshots of your state throughout the day
2. A **regulation indicator** (green / amber / red) that extrapolates from your daily inputs and learns to reflect your actual state over time — alerting you when you're trending toward a harder day before it fully arrives

The app is browser-only in v1. Time-triggered routine prompts appear as in-app banners when the app is open, not as push notifications.

---

## Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | React + Vite + TypeScript | Same as Jar of Stars; proven scaffold |
| Styling | Tailwind CSS + custom pixel CSS | Utility-first with pixel-art overrides |
| Charts | **Recharts** | Radar chart + line graphs; React-native, no canvas juggling |
| Animation | Framer Motion | Same as Jar of Stars |
| State management | Zustand | Same as Jar of Stars |
| Persistence | localStorage (primary) | JSON blob, same pattern as JoS |
| Cloud sync | Google Drive API (same mechanism as Jar of Stars) | Last-write-wins merge per entry |
| Fonts | Press Start 2P + Nunito | Identical to Jar of Stars design system |
| Deployment | GitHub Pages via GitHub Actions | Same pipeline as Jar of Stars |
| Auth | Google OAuth (same as Jar of Stars) | Drive sync only |

> ⚠️ **Claude Code note:** Always create an isolated project directory before installing dependencies. Do **not** install packages globally. Use `npm create vite@latest lifehex -- --template react-ts` to scaffold, then `cd lifehex && npm install` inside the project directory. Never run global npm installs.

---

## Colour Palette

Identical to Jar of Stars. No new colours introduced.

| Name | Hex | Usage |
|---|---|---|
| Night Sky | `#1a1a2e` | Page background |
| Deep Indigo | `#16213e` | Secondary background, cards |
| Soft Lilac | `#c9b8f0` | UI panels, card fills, primary surface |
| Lilac Shadow | `#7a6fa0` | Drop shadows on lilac elements |
| Blush Pink | `#f7cac9` | Period phase accents, warning tints |
| Blush Shadow | `#c98a88` | Drop shadows on blush, red-zone tint |
| Mint Green | `#b5ead7` | Positive/green states, unlocked state |
| Mint Shadow | `#6aab90` | Drop shadows on mint |
| Butter Yellow | `#ffeaa7` | Active states, amber-zone tint, moon accents |
| Butter Shadow | `#c9a84c` | Drop shadows on butter |
| Peach | `#ffb7b2` | Warm accents |
| Cloud White | `#fdfcff` | Text on dark backgrounds |
| Muted Purple | `#9b89c4` | Borders, inactive nav, locked state |
| Star Gold | `#ffe066` | Badges, active counters, today highlight |
| Pixel Black | `#2d2b3d` | Text on light surfaces |

### Regulation zone colours

| Zone | Colour | Border |
|---|---|---|
| Green | Mint Green `#b5ead7` bg | Mint Shadow `#6aab90` |
| Amber | Butter Yellow `#ffeaa7` bg | Butter Shadow `#c9a84c` |
| Red | Blush Pink `#f7cac9` bg | Blush Shadow `#c98a88` |

---

## Typography

| Role | Font | Notes |
|---|---|---|
| Display / UI chrome / buttons / labels | Press Start 2P | Min 10px. 8px only for badges/counters |
| Body / input fields / notes / descriptions | Nunito | 400 body, 700 emphasis only |

---

## Wheel of Life — 8 Dimensions

The radar chart tracks eight life dimensions. These are fixed and personal — not user-configurable.

| Segment | Key | Description |
|---|---|---|
| Health & Body | `healthBody` | Sleep, food, movement — the basics everything else runs on |
| Mental & Emotional Wellbeing | `mentalWellbeing` | How you're holding up inside. Regulation, clarity, groundedness |
| Relationships | `relationships` | Real contact with friends and John — the people outside your immediate daily bubble you've been pulling away from |
| Family | `family` | The carer load, mum situation, family dynamics |
| Work & Career | `workCareer` | Whether what you're spending effort on actually feels meaningful |
| Creative Life & Art | `creativeArt` | Whether you're making things rather than just consuming them |
| Rest & Recovery | `restRecovery` | Whether the time you spend on yourself is actually refilling you |
| Nourishment | `nourishment` | Alone time. Brain-melt time. Time that is fully yours with no one else in it — whether that's gaming for hours or just being a potato |

> **Radar chart geometry:** 8-axis radar charts are symmetrical and render cleanly. Each axis evenly spaced at 45°.

### Dimension reference data (used in bottom sheet as read-only nudges)

#### Health & Body
**Adds:** Working out / intentional movement, full night's sleep, eating proper meals, walking freely, taking movement breaks, going to the gym, staying hydrated
**Detracts:** Eating poorly, sleeping badly, skipping meals or eating while working, staying sedentary too long, delaying sleep for any task

#### Mental & Emotional Wellbeing
**Adds:** Booking therapy, processing something difficult and coming through it, noticing your state before it escalates, having a "that was actually me" day
**Detracts:** Suppressing feelings, emotional blow-ups that weren't caught early, persistent low mood for multiple days, not acknowledging a hard luteal phase

#### Relationships
**Adds:** Making plans with a friend and keeping them, reaching out first even briefly, doing something social outside the house, a meaningful conversation with a friend
**Detracts:** Cancelling consistently, only texting with no real interaction, weeks without contact, isolating under the guise of needing rest, only spending time with immediate family

#### Family
**Adds:** Showing up with presence and not resentment, setting a boundary with family that stuck, having a good day with mum
**Detracts:** Absorbing carer load without any recovery, family stress bleeding into the whole day, no separation between family time and your own time

#### Work & Career
**Adds:** Working on something purposeful, finishing something you're proud of, making visible progress, learning something directly applicable
**Detracts:** Full day of admin, busy but nothing completed that matters, meetings with no outcome, reactive all day, helping others at cost of your own work

#### Creative Life & Art
**Adds:** Drawing your own ideas, finishing or fleshing out a piece, trying a new technique, working on a creative programming project
**Detracts:** Watching tutorials without making anything, long gaps between sessions, consuming art passively and calling it practice, creative tools untouched for days

#### Rest & Recovery
**Adds:** Watching something from your intentional shelf, reading manga or a book, listening to music without multitasking, walking without a podcast, playing Animal Crossing or low-stakes games
**Detracts:** Doom-scrolling, consuming psychology self-help content, true crime or horror content, busywork that doesn't connect to anything, only doing tasks for others

#### Nourishment
**Adds:** A single hour completely alone, choosing rest over productivity in the evening, leaving the house alone intentionally (not for chores), gaming for a few hours uninterrupted, doing something unplanned just because you felt like it
**Detracts:** Not having a single hour alone in the day, filling recovery time with productive tasks, agreeing to plans you didn't want, never having a moment where no one needs something from you

---

## Core Concept: The Lock/Unlock Session

The central interaction paradigm of LifeHex is the **session lock**. Rather than forcing one entry per day, the app captures point-in-time snapshots of your state.

### How it works

- A **padlock icon** sits prominently on the Today screen
- **Unlocked state:** Radar chart, mood/energy/regulation sliders are interactive and editable
- **Locked state:** All sliders and radar are frozen and read-only. "Last saved: HH:MM" label shows below padlock
- When you **unlock**, controls pre-fill with your **most recent saved session** values as a starting point
- When you **lock**, a snapshot is saved containing:
  - Current timestamp (ISO 8601, AEST timezone-aware)
  - All 8 dimension scores
  - Mood, energy, and emotional regulation scores
  - System-suggested zone + user-confirmed zone
- Daily checklist items (meals, medication, gym, alone time) are **not** gated by the lock — they can be checked off at any time and are stored at the day level, not session level
- Checklist checked state resets at midnight each day
- Dimension scores, mood, energy, and regulation persist and pre-fill on next unlock
- You can lock/unlock as many times per day as you like — every lock is a new timestamped record

### Visual treatment of the lock

- **Unlocked:** Padlock icon in Mint Green `#b5ead7`, Framer Motion pulse (`scale: 1 → 1.05` loop), all sliders have active glow (`box-shadow: 0 0 0 2px #b5ead7`)
- **Locked:** Padlock icon in Muted Purple `#9b89c4`, sliders at `opacity: 0.5`, pointer-events disabled, "Last saved: HH:MM" in Nunito 12px below

---

## Daily Tracking System

The Today screen is structured around four tracking groups. The previous tag chip system is removed entirely and replaced by this structured approach.

---

### Group 1: Routines (time-triggered in-app banners)

Routines are **not logged tasks** — they are dismissible banners that appear inside the app at configured times of day. They give structure without being punitive if skipped. Prompt times are user-configurable in Settings (default times below).

Routine banners appear at the top of the Today screen, above the period strip, when the app is opened after the trigger time. They do not fire if the app is closed — browser-only, no push notifications.

**Morning Routine Banner** — default trigger: 9:00am

```
✨ Good morning
──────────────────────────────
□ Don't touch your phone yet
□ Clean up / make bed
□ Morning journal
□ Eat breakfast
□ Sit at a window for 5 minutes
□ Say hello to parents / John
□ Take meds (weekdays only)
□ Start your day
──────────────────────────────
[ Dismiss ]
```

If today is a **luteal phase day** (days 17–27), the banner prepends one line:
```
🌙 Luteal phase today — be extra gentle with yourself.
```

The morning routine checklist is purely visual — items are not logged. The banner is dismissed once per day.

**Lunch Break Banner** — default trigger: 12:00pm

Appears if the app is opened between 12:00pm and 1:00pm and no lunch meal has been logged yet.

```
🍱 Lunch break time.
Step away from your desk — you have until 1pm.
Close the laptop.
──────────────────────────────
[ I'm on my break ]
```

Tapping "I'm on my break" is the only logged action from any routine. It records `lunchBreakTaken: true` and `lunchBreakTime: timestamp` on the day record.

**Bedtime Routine Banner** — default trigger: 10:00pm

Appears when the app is opened after trigger time in the evening.

```
🌙 Time to wind down.
──────────────────────────────
□ Screens away
□ Say goodnight to everyone
□ Brush teeth
□ Read book or manga
□ Lights out
──────────────────────────────
[ Dismiss ]
```

---

### Group 2: Daily Checklist (always interactive, logged with timestamp)

A card section always visible on the Today screen — not gated by the lock/unlock state. Each item can be checked off at any time. Checking logs the time. State resets at midnight.

| Item | Type | Detail |
|---|---|---|
| Medication taken | Toggle (weekdays only) | Logs time tapped. On weekends: greyed out with "rest day" label |
| Breakfast | Toggle + expand | Expands: optional note ("what was it?") + checkbox "proper break — not at desk" |
| Lunch | Toggle + expand | Same as breakfast. Links to lunch break banner acknowledgement |
| Dinner | Toggle + expand | Same as breakfast |
| Gym today | Toggle | Logs time tapped |
| Alone time today | Toggle | Logs time tapped. On check: "Start a timer?" prompt with in-app configurable countdown |

**Checklist UI:**
- Each row: pixel-art checkbox (unchecked: `border: 2px solid #9b89c4`; checked: Mint Green fill with pixel checkmark icon)
- Timestamp appears inline after checking in Nunito 12px: "✓ 9:23am"
- Meal rows expand on tap via Framer Motion height animation to show note field and "proper break" toggle
- Alone time row shows a small timer icon after checking that opens a simple countdown timer panel

---

### Group 3: Mood & Emotional Regulation (session-level, within lock/unlock)

Three sliders, all interactive only when session is unlocked. All pre-fill from most recent saved session on unlock.

#### Mood Slider
- Range: 1–10, integer snapping
- Emoji thumb morphs as dragged: 😫 (1–2) → 🙁 (3–4) → 😶 (5–6) → 😄 (7–8) → 😆 (9–10)
- Large emoji displayed above slider, numeric value in Press Start 2P 10px below

#### Energy Slider
- Range: 1–10, integer snapping
- Label: "Energy" in Press Start 2P 10px
- Emoji thumb: 🪫 (1–3) → 😐 (4–6) → ⚡ (7–10)
- Same visual layout as mood slider

#### Emotional Regulation Slider
- Range: 1–10, integer snapping
- Label: "Regulation" in Press Start 2P 10px
- Subtext in Nunito 11px below label: "How well am I handling friction today?"
- Emoji thumb: 🌋 (1–3) → 😤 (4–6) → 🧘 (7–10)
- Same visual layout as mood slider

#### Regulation Zone Badge

A prominent coloured pill displayed below the three sliders. **Always visible** — shows most recently saved zone when locked, updates live when unlocked.

```
┌────────────────────────────────┐
│  TODAY'S ZONE                  │
│  ● AMBER            ↺ override │
└────────────────────────────────┘
```

- Badge background and border match zone colour (see palette)
- Zone label in Press Start 2P 10px
- Tapping "↺ override" opens a small bottom sheet with three buttons: Green / Amber / Red
- Selecting one stores the override value separately from the system suggestion
- Both system-suggested and user-confirmed zone are stored on every locked session so the delta can be used to refine the algorithm over time

---

### Group 4: Physical Symptoms (optional, collapsible)

A collapsible section below the sliders. Collapsed by default. Always interactive — not gated by lock state. Stored at day level (not per-session).

Tap header to expand:
```
▼ Physical symptoms  (optional)
```

**Symptom multi-select chips** (tap to toggle, no limit):
fatigue / bloating / breast tenderness / headache / nausea / cramps

**Optional deeper tracking** (secondary row in Nunito 12px):
- Brain fog: slider 1–10
- Working memory impaired: toggle ("Lost sentences / forgot context today")
- Focus quality: slider 1–10
- Sleep last night: hours input (number) + quality slider 1–5

**"That wasn't me" flag** — distinct row with Blush Pink pixel-border card:

```
┌────────────────────────────────┐
│  😶  "That wasn't me" moment   │
│  [ No ]   [ Yes — add a note ] │
└────────────────────────────────┘
```

Tapping "Yes" opens a single-line Nunito text input. Stored as `thatWasntMe: true` + optional note on the day record. Purpose: build a personal history of how frequently and when these moments occur.

---

## Regulation Algorithm

The system-suggested zone is calculated client-side in `utils/regulationScore.ts` every time inputs change while unlocked.

### v1 seed logic

```typescript
interface RegulationInputs {
  mood: number;                    // 1–10
  energy: number;                  // 1–10
  regulation: number;              // 1–10
  isLutealPhase: boolean;
  medicationTaken: boolean;
  isWeekday: boolean;
  symptomCount: number;            // 0–6
  thatWasntMeToday: boolean;
  sleepQuality: number | null;     // 1–5, null if not entered
  mealsLogged: number;             // 0–3
  gymToday: boolean;
}

function calculateZone(inputs: RegulationInputs): 'green' | 'amber' | 'red' {
  let risk = 0;

  // Core mood signals
  if (inputs.mood <= 3) risk += 3;
  else if (inputs.mood <= 5) risk += 1;

  if (inputs.energy <= 3) risk += 2;
  else if (inputs.energy <= 5) risk += 1;

  if (inputs.regulation <= 3) risk += 3;
  else if (inputs.regulation <= 5) risk += 1;

  // Cycle phase amplifier
  if (inputs.isLutealPhase) risk += 1;

  // Medication missed on weekday
  if (inputs.isWeekday && !inputs.medicationTaken) risk += 1;

  // Physical load
  if (inputs.symptomCount >= 3) risk += 2;
  else if (inputs.symptomCount >= 1) risk += 1;

  // Dissociation flag
  if (inputs.thatWasntMeToday) risk += 2;

  // Sleep
  if (inputs.sleepQuality !== null && inputs.sleepQuality <= 2) risk += 1;

  // Positive offsets
  if (inputs.gymToday) risk -= 1;
  if (inputs.mealsLogged >= 2) risk -= 1;

  if (risk >= 6) return 'red';
  if (risk >= 3) return 'amber';
  return 'green';
}
```

### Override learning loop

Every user override is stored so the delta between system suggestion and actual state accumulates as a data asset for future refinement:

```typescript
interface ZoneOverride {
  sessionId: string;
  date: string;
  systemSuggested: 'green' | 'amber' | 'red';
  userConfirmed: 'green' | 'amber' | 'red';
  inputsSnapshot: RegulationInputs;
}
```

In a future version, weights in `calculateZone` can be adjusted based on override patterns. This infrastructure is **scaffolded in v1** with a `// TODO: adaptive weight refinement` comment — the adjustment logic is future scope.

---

## Luteal Phase Warning State

When the current cycle day falls between day 17 and the predicted period start (inclusive), the app enters **luteal warning state**.

Visual changes:
- Period strip background shifts to Butter Yellow `#ffeaa7` with Butter Shadow border
- Small 🌙 amber icon appears left of phase label in the strip, text changes to "Luteal phase — watch zone"
- Morning routine banner prepends the luteal gentle-reminder line
- `isLutealPhase: true` is passed to the regulation algorithm (adds +1 to risk, effectively lowering the amber threshold)
- Calendar days in the luteal window show a subtle Butter Yellow tint overlay stacked on top of their zone colour

Luteal window is calculated in `utils/cyclePredictor.ts`:
```typescript
// luteal window = day 17 of cycle through day before next period start
const lutealStart = addDays(cycleStartDate, 16); // day 17 (0-indexed)
const lutealEnd = subDays(nextPeriodStartDate, 1);
const isLuteal = isWithinInterval(today, { start: lutealStart, end: lutealEnd });
```

---

## App Architecture

```
src/
├── main.tsx
├── App.tsx
├── pages/
│   ├── Today.tsx              # Main daily screen
│   ├── Calendar.tsx           # Monthly mood + moon calendar
│   ├── Cycle.tsx              # Period tracker
│   └── Dashboard.tsx          # Trends and history
├── components/
│   ├── PeriodStrip.tsx        # Horizontal phase banner (top of Today)
│   ├── RadarChart.tsx         # 8-axis Recharts radar
│   ├── MoodSlider.tsx         # Reusable emoji slider (mood / energy / regulation)
│   ├── LockToggle.tsx         # Session lock/unlock control
│   ├── RegulationBadge.tsx    # Green/amber/red zone pill + override
│   ├── DailyChecklist.tsx     # Meal / med / gym / alone-time checkboxes
│   ├── PhysicalSymptoms.tsx   # Collapsible symptom section
│   ├── RoutineBanner.tsx      # Morning / lunch / bedtime banners
│   ├── MoonIcon.tsx           # SVG moon phase renderer
│   ├── CalendarGrid.tsx       # Monthly calendar with zone tints + moons
│   └── BottomNav.tsx          # 4-tab navigation bar
├── store/
│   ├── sessionStore.ts        # Zustand: current unlocked session state
│   ├── dayStore.ts            # Zustand: day-level data (checklist, symptoms, flag)
│   ├── historyStore.ts        # Zustand: all saved sessions
│   ├── cycleStore.ts          # Zustand: cycle entries
│   └── settingsStore.ts       # Zustand: preferences + routine times
├── utils/
│   ├── driveSync.ts           # Google Drive sync
│   ├── cyclePredictor.ts      # Phase + luteal window calculation
│   ├── moonPhase.ts           # Cycle day → moon icon variant (SH)
│   ├── moodAggregate.ts       # Daily mood/zone rollup for calendar
│   ├── regulationScore.ts     # Zone calculation algorithm
│   └── routinePrompt.ts       # Time-of-day banner trigger logic
└── types/
    └── index.ts               # All shared TypeScript interfaces
```

---

## Data Models

```typescript
// A single locked session snapshot
interface Session {
  id: string;
  timestamp: string;              // ISO 8601, AEST offset e.g. "+10:00"
  dimensions: DimensionScores;
  mood: number;                   // 1–10
  energy: number;                 // 1–10
  emotionalRegulation: number;    // 1–10
  systemZone: 'green' | 'amber' | 'red';
  confirmedZone: 'green' | 'amber' | 'red';
  zoneOverride: ZoneOverride | null;
  created_at: string;
  updated_at: string;
}

interface DimensionScores {
  healthBody: number;             // 0–10, integer
  mentalWellbeing: number;
  relationships: number;
  family: number;
  workCareer: number;
  creativeArt: number;
  restRecovery: number;
  nourishment: number;
}

// Day-level record (one per calendar day, updated throughout the day)
interface DayRecord {
  id: string;
  date: string;                   // "YYYY-MM-DD"
  // Checklist
  medicationTaken: boolean;
  medicationTime: string | null;
  meals: MealLog[];               // up to 3
  lunchBreakTaken: boolean;
  lunchBreakTime: string | null;
  gymToday: boolean;
  gymTime: string | null;
  aloneTimeToday: boolean;
  aloneTimeStart: string | null;
  // Physical symptoms
  symptoms: string[];             // e.g. ['fatigue', 'headache']
  brainFog: number | null;        // 1–10
  workingMemoryImpaired: boolean;
  focusQuality: number | null;    // 1–10
  sleepHours: number | null;
  sleepQuality: number | null;    // 1–5
  // Emotional
  thatWasntMe: boolean;
  thatWasntMeNote: string;
  // Computed on save
  moodAverage: number | null;     // rolling average of all session moods this day
  dominantZone: 'green' | 'amber' | 'red' | null;
  created_at: string;
  updated_at: string;
}

interface MealLog {
  meal: 'breakfast' | 'lunch' | 'dinner';
  logged: boolean;
  loggedTime: string | null;
  note: string;
  properBreak: boolean;
}

// Period cycle entry
interface CycleEntry {
  id: string;
  cycleStartDate: string;         // "YYYY-MM-DD"
  cycleEndDate: string | null;    // null if ongoing
  cycleLength: number;            // expected days for this cycle
  periodLength: number;           // expected period duration in days
  created_at: string;
  updated_at: string;
}

// Zone override record (stored for algorithm refinement)
interface ZoneOverride {
  sessionId: string;
  date: string;
  systemSuggested: 'green' | 'amber' | 'red';
  userConfirmed: 'green' | 'amber' | 'red';
  inputsSnapshot: RegulationInputs;
}

// Settings
interface Settings {
  expectedCycleLength: number;        // default: 28
  expectedPeriodLength: number;       // default: 5
  morningRoutineTime: string;         // default: "09:00"
  lunchNudgeTime: string;             // default: "12:00"
  bedtimeRoutineTime: string;         // default: "22:00"
  weekdayMedicationTracking: boolean; // default: true
  driveConnected: boolean;
  lastSyncedAt: string | null;
  // Future scope — scaffolded but non-functional in v1
  moodAlertThreshold: number;         // default: 5
  googleCalendarConnected: boolean;   // default: false
}
```

---

## Features

### 1. Today Screen

The primary daily interaction screen. Scrollable. Fixed bottom nav.

Vertical stack order:

1. **Routine banner** (conditional — appears at top when time-triggered, dismissible)
2. **Period strip** (always visible)
3. **Regulation zone badge** (always visible)
4. **Lock/Unlock toggle**
5. **Radar chart** (8-axis, interactive when unlocked)
6. **Mood slider** (interactive when unlocked)
7. **Energy slider** (interactive when unlocked)
8. **Emotional regulation slider** (interactive when unlocked)
9. **Daily checklist** (always interactive)
10. **Physical symptoms** (collapsible, always interactive)

#### Radar Chart

- Built with Recharts `RadarChart`
- 8 axes clockwise from top: Health & Body, Mental & Wellbeing, Relationships, Family, Work & Career, Creative & Art, Rest & Recovery, Nourishment
- Scale 0–10, integer snapping only
- **Locked:** filled polygon Soft Lilac `#c9b8f0`, Muted Purple stroke, `opacity: 0.6`
- **Unlocked:** filled polygon Mint Green `#b5ead7` at `opacity: 0.5`, Star Gold `#ffe066` stroke, subtle glow `filter: drop-shadow(0 0 4px #b5ead7)`
- Axis labels in Press Start 2P 8px, abbreviated (e.g. "HEALTH", "MENTAL", "RELATE", "FAMILY", "WORK", "CREATE", "REST", "NOURISH")
- **Tapping** an axis label or polygon area when unlocked opens the dimension bottom sheet:
  - Slides up from bottom (see bottom sheet spec)
  - Dimension name in Press Start 2P 10px, one-line description in Nunito 13px
  - Integer slider 0–10 for that dimension
  - **Live radar update:** radar polygon updates in real time as slider drags. Bottom sheet covers only lower ~50% of screen so radar is visible above it. Closing confirms the value — does not revert.
  - Read-only reference chips below: "Adds ↑" in Mint Green chip style, "Detracts ↓" in Blush Pink chip style. Not interactive. Reference only.
  - "Done" button closes sheet

---

### 2. Period Strip (top of Today, below routine banner)

Full-width banner card.

**Standard state:**
- Phase label in Press Start 2P 10px: `Menstrual` / `Follicular` / `Ovulation` / `Luteal`
- Days into current phase + days until next period (or "Period in progress")
- Miniature horizontal phase bar with current position marker
- Moon icon for current phase (16px SVG)

**Luteal warning state (days 17–27):**
- Background shifts to Butter Yellow `#ffeaa7`, border `2px solid #c9a84c`
- 🌙 amber icon left of phase label
- Phase label text: "Luteal phase — watch zone"

**Phase colours:**
| Phase | Background | Border |
|---|---|---|
| Menstrual | Blush Pink `#f7cac9` | Blush Shadow `#c98a88` |
| Follicular | Mint Green `#b5ead7` | Mint Shadow `#6aab90` |
| Ovulation | Butter Yellow `#ffeaa7` | Butter Shadow `#c9a84c` |
| Luteal (standard) | Soft Lilac `#c9b8f0` | Lilac Shadow `#7a6fa0` |
| Luteal (warning) | Butter Yellow `#ffeaa7` | Butter Shadow `#c9a84c` |

Tapping strip navigates to Cycle tab.

---

### 3. Cycle Screen

**Phase ring** — large arc showing current position in cycle. Phase label, day count, days until next period, moon icon.

**Cycle log** — scrollable list of confirmed past cycles with start date, end date, duration, coloured pill bar.

**Log period:**
- "Period started today" → new CycleEntry with today as start
- "Period ended today" → sets cycleEndDate on open entry
- Confirmation prompt if a period entry is already open

**Cycle settings:**
- Expected cycle length slider (21–35 days)
- Expected period duration slider (3–8 days)
- Changes apply to current and future predictions only — past confirmed cycles are immutable

**Prediction logic (`cyclePredictor.ts`):**
- Predict next 6 periods from most recent confirmed start
- If actual start differs from predicted, confirmed date wins and future predictions rebase
- Luteal window: days 17 through day before next predicted/confirmed period start
- Southern hemisphere moon mapping applied

---

### 4. Moon Phase System

Small SVG moon icons on calendar day cells and in the period strip.

**Cycle phase → moon icon mapping (Southern Hemisphere):**

In the southern hemisphere the illuminated limb appears on the opposite side to the northern hemisphere. Icon art direction reflects this.

| Phase | Icon | Colour |
|---|---|---|
| Menstrual | Full red circle | Blush Pink `#f7cac9` |
| Follicular | Waxing crescent — lit on **left** (SH) | Mint Green `#b5ead7` |
| Ovulation | Full moon | Butter Yellow `#ffeaa7` |
| Luteal | Waning crescent — lit on **right** (SH) | Soft Lilac `#c9b8f0` |
| Luteal warning | Waning crescent with amber glow | Butter Yellow `#ffeaa7` |

- Confirmed past: solid coloured moons
- Predicted future: same shapes at `opacity: 0.4`, dashed outline stroke
- Calendar size: 16×16px SVG, bottom-right corner of day cell
- Period strip size: 20×20px

---

### 5. Calendar Screen

**Each day cell shows:**
- Day number: Press Start 2P 10px, top-left
- Background tint: based on day's **dominant zone** (green/amber/red tint)
- Moon icon: bottom-right 16px SVG
- Session dot: 4px Star Gold circle, bottom-centre, if sessions logged that day

**Tapping a day** opens bottom sheet:
- All sessions that day (time, mood, energy, regulation, zone)
- Checklist summary (what was checked, what wasn't)
- Physical symptoms logged
- "That wasn't me" flag + note if set
- Moon phase label for that day

**Month navigation:** ← → arrows, Press Start 2P style, centred above grid.

**Day cell CSS:**
```css
/* No data */
background: #1a1a2e;
border: 1px solid #16213e;

/* Green zone */
background: rgba(181, 234, 215, 0.2);
border: 1px solid #6aab90;

/* Amber zone */
background: rgba(255, 234, 167, 0.2);
border: 1px solid #c9a84c;

/* Red zone */
background: rgba(247, 202, 201, 0.2);
border: 1px solid #c98a88;

/* Luteal window overlay (stacks on zone tint) */
background: rgba(255, 234, 167, 0.08);

/* Today */
outline: 2px solid #ffe066;
outline-offset: -2px;
```

---

### 6. Dashboard Screen

**Mood & regulation over time**
- Recharts `LineChart` with three lines: mood (Star Gold), energy (Mint Green), regulation (Soft Lilac)
- Toggle: 7 days / 30 days / 90 days
- Each point = a session. X-axis: date. Y-axis: 1–10
- Luteal phase windows shown as subtle Butter Yellow vertical bands behind the chart

**Zone history**
- Stacked bar chart — green/amber/red distribution per week
- Shows which weeks were harder at a glance

**Dimension radar — period comparison**
- Two overlaid radars: "last 7 days average" vs "last 30 days average"
- Shows drift in life balance over time

**Checklist completion**
- Stat cards: "Medication X/5 weekdays", "Meals logged X/21", "Gym X/7", "Lunch breaks taken X/7"

**Future scope placeholders (scaffolded, non-functional):**
```typescript
// TODO: adaptive zone algorithm weight refinement from override history
// TODO: correlation view — luteal phase vs regulation score overlay
// TODO: mood heatmap
// TODO: 7-day average zone drop alert (in-app banner trigger)
// TODO: Google Calendar integration — auto-add break/gym slots to calendar
```

---

## Pixel Art UI Conventions

- **No gradients.** Flat stepped colours or dithering only
- **Hard drop shadows.** Hard offset, no blur, using `-Shadow` colour variant
- **Pixel borders.** `border: 2px solid`. No `border-radius` > 4px on most elements
- **Press Start 2P minimum 10px.** 8px only for badges
- **No glassmorphism, no blur, no smooth gradients**
- **Background:** Night Sky `#1a1a2e` everywhere
- **Dithered textures** on large panel fills (SVG checkerboard background at 2px scale)

### Concrete CSS shadow reference

```css
/* Lilac panel (cards, bottom sheets, modals) */
box-shadow: 4px 4px 0px #7a6fa0;

/* Mint panel (active/unlocked, green zone) */
box-shadow: 4px 4px 0px #6aab90;

/* Blush panel (period, red zone) */
box-shadow: 4px 4px 0px #c98a88;

/* Butter panel (amber zone, luteal warning, active tab) */
box-shadow: 4px 4px 0px #c9a84c;

/* Buttons — 3px offset for tactile feel */
box-shadow: 3px 3px 0px <shadow-colour-matching-button-fill>;

/* Pressed/active button state */
transform: translate(2px, 2px);
box-shadow: 1px 1px 0px <shadow-colour-matching-button-fill>;

/* Bottom nav — top edge only */
box-shadow: 0px -2px 0px #9b89c4;

/* No shadow on: plain text, axis labels, icon-only elements, radar chart itself */
```

### Screen layout spec — Today screen

```
┌─────────────────────────────────┐  390px viewport
│  ROUTINE BANNER        ~auto    │  Conditional. Top of screen. Dismissible.
│  (morning/lunch/bedtime)        │  Deep Indigo bg, Butter Yellow border
├─────────────────────────────────┤
│  PERIOD STRIP          ~72px    │  Full-width, phase-coloured bg
│  phase + mini bar + moon        │  2px solid <phase-shadow> border-bottom
├─────────────────────────────────┤
│  REGULATION BADGE      ~48px    │  Centred pill: ● AMBER  ↺ override
│                                 │  Always visible (locked and unlocked)
├─────────────────────────────────┤
│  LOCK TOGGLE ROW       ~40px    │  Padlock + "Unlock to update" label
│                                 │  Mint Green unlocked / Muted Purple locked
├─────────────────────────────────┤
│                                 │
│  RADAR CHART          ~320px    │  8-axis, square aspect, 16px side padding
│                                 │
├─────────────────────────────────┤
│  MOOD SLIDER           ~88px    │  Emoji above, slider, numeric below
├─────────────────────────────────┤
│  ENERGY SLIDER         ~88px    │  Same layout
├─────────────────────────────────┤
│  REGULATION SLIDER     ~96px    │  Same + Nunito 11px subtext below label
├─────────────────────────────────┤
│  DAILY CHECKLIST       ~auto    │  Always interactive (not gated by lock)
│  □ Medication  ✓ 9:23am         │  Pixel checkboxes. Meals expandable.
│  □ Breakfast □ Lunch □ Dinner   │
│  □ Gym  □ Alone time            │
├─────────────────────────────────┤
│  ▼ Physical symptoms   ~auto    │  Collapsed by default, tap to expand
│  (chips + optional sliders)     │  "That wasn't me" at bottom of section
├─────────────────────────────────┤
│  BOTTOM NAV            ~56px    │  Fixed. Deep Indigo bg.
│  🌸 Today 📅 Cal 🌙 Cycle 📊   │
└─────────────────────────────────┘
```

**Spacing tokens:**
- Page horizontal padding: `16px`
- Section gap: `12px`
- Card internal padding: `12px`
- Chip gap: `8px`
- Bottom nav height: `56px` — scrollable content needs `padding-bottom: 72px`

### Screen layout spec — Calendar screen

```
┌─────────────────────────────────┐
│  MONTH HEADER          ~48px    │  ← May 2025 →  Press Start 2P, centred
├─────────────────────────────────┤
│  DAY-OF-WEEK ROW       ~32px    │  Mo Tu We Th Fr Sa Su — 8px PS2P
├─────────────────────────────────┤
│  CALENDAR GRID         ~auto    │  7 equal-width columns
│  Each cell ~52px tall           │  Day number top-left (10px PS2P)
│                                 │  Moon icon bottom-right (16px SVG)
│                                 │  Session dot bottom-centre (4px Star Gold)
└─────────────────────────────────┘
```

### Bottom sheet behaviour

```
Entry:      Framer Motion y: '100%' → y: 0, duration: 0.25s, easing: easeOut
Background: Deep Indigo #16213e
Top border: 2px solid #9b89c4
Radius:     border-radius: 8px 8px 0 0
Backdrop:   rgba(26, 26, 46, 0.7) — tap to dismiss
Max height: 60vh, internally scrollable
Handle bar: 32px × 4px, border-radius: 2px, colour #9b89c4, centred, 8px from top edge
```

---

## Navigation

| Tab | Icon | Screen |
|---|---|---|
| Today | 🌸 | Today.tsx |
| Calendar | 📅 | Calendar.tsx |
| Cycle | 🌙 | Cycle.tsx |
| Dashboard | 📊 | Dashboard.tsx |

- Active tab: Butter Yellow icon + Press Start 2P 8px label
- Inactive tab: Muted Purple icon, no label
- Tab bar: Deep Indigo bg, `box-shadow: 0px -2px 0px #9b89c4`

Settings: gear icon top-right, accessible from any screen.

---

## Responsive Behaviour

- Mobile-first at 390px (Pixel 7 / iPhone 14)
- Desktop: max-width 480px centred, Night Sky gutters
- Radar chart: fluid 280–420px
- Bottom nav: `position: fixed; bottom: 0`

---

## Google Drive Sync

**Sync file:** `lifehex-data.json` in Google Drive app folder

```json
{
  "sessions": [...],
  "dayRecords": [...],
  "cycles": [...],
  "zoneOverrides": [...],
  "settings": {...},
  "exported_at": "ISO timestamp"
}
```

**Merge strategy (last-write-wins per item by `updated_at`):**
```typescript
function merge<T extends { id: string; updated_at: string }>(
  local: T[], remote: T[]
): T[] {
  const map = new Map<string, T>();
  remote.forEach(item => map.set(item.id, item));
  local.forEach(item => {
    const existing = map.get(item.id);
    if (!existing || item.updated_at > existing.updated_at) {
      map.set(item.id, item);
    }
  });
  return [...map.values()];
}
```

**Sync triggers:** app load (silent token refresh), 3-second debounce after every lock or checklist update, manual sync button in Settings.

> ⚠️ **Claude Code note:** Store credentials in `.env` as `VITE_GOOGLE_CLIENT_ID` and `VITE_GOOGLE_API_KEY`. Never hardcode. Add `.env` to `.gitignore`. Provide `.env.example` with placeholder values.

---

## Settings Screen

| Setting | Type | Default |
|---|---|---|
| Expected cycle length | Slider 21–35 | 28 days |
| Expected period duration | Slider 3–8 | 5 days |
| Morning routine time | Time picker | 09:00 |
| Lunch nudge time | Time picker | 12:00 |
| Bedtime routine time | Time picker | 22:00 |
| Weekday medication tracking | Toggle | On |
| Google Drive sync | Connect / Disconnect | Disconnected |
| Manual sync | Button | — |
| Export data (JSON) | Button | — |
| Mood alert threshold | Slider `[coming soon]` | 5 |
| Google Calendar integration | Toggle `[coming soon]` | Off |

---

## Out of Scope for v1

- Push notifications of any kind (browser-only; no PWA in v1)
- Google Calendar integration — auto-add break/gym/meditation slots (settings toggle scaffolded as `[coming soon]`)
- Adaptive zone algorithm weight refinement (infrastructure scaffolded, logic is future scope)
- Correlation view (luteal phase vs regulation overlay chart)
- Mood heatmap
- Fertile window display
- Customisable dimensions
- Any social or sharing features
- iOS or Android app store submission

---

## Development Setup

```bash
# Scaffold (run once, inside your chosen parent directory)
npm create vite@latest lifehex -- --template react-ts
cd lifehex

# All installs run from inside lifehex/
npm install
npm install zustand framer-motion recharts
npm install uuid date-fns
npm install -D @types/uuid
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Add to index.html (no npm package needed for fonts):
# <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Nunito:wght@400;700&display=swap" rel="stylesheet">

# Env setup
cp .env.example .env
# Fill in VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_API_KEY

npm run dev
```

> ⚠️ **Claude Code note:** All `npm install` commands must run from inside `lifehex/`. No global installs. No `sudo npm install`. `date-fns` is required for `cyclePredictor.ts` date arithmetic (`addDays`, `subDays`, `isWithinInterval`).

---

## GitHub Pages Deployment

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

```typescript
// vite.config.ts
export default defineConfig({
  base: '/lifehex/', // update to match actual repo name
  plugins: [react()],
})
```

---

## Key Dependencies

```json
{
  "react": "^18",
  "typescript": "^5",
  "vite": "^5",
  "zustand": "^4",
  "framer-motion": "^11",
  "recharts": "^2",
  "uuid": "^9",
  "date-fns": "^3",
  "tailwindcss": "^3"
}
```