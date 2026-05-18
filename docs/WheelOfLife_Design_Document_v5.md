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
| Charts | **Custom SVG RadarChart** (inline) + Recharts for Dashboard line/bar graphs | Full control over drag, hit-testing, and label positioning on the radar |
| Animation | Framer Motion | Same as Jar of Stars |
| State management | Zustand | Same as Jar of Stars |
| Persistence | localStorage (primary) | JSON blob, same pattern as JoS |
| Cloud sync | Google Drive API (same mechanism as Jar of Stars) | Last-write-wins merge per entry |
| Fonts | Press Start 2P + Nunito | Identical to Jar of Stars design system |
| Deployment | GitHub Pages via GitHub Actions | Same pipeline as Jar of Stars |
| Auth | Google OAuth (same as Jar of Stars) | Drive sync only |

> ⚠️ **Claude Code note:** Always create an isolated project directory before installing dependencies. Do **not** install packages globally. Use `npm create vite@latest lifehex -- --template react-ts` to scaffold, then `cd lifehex && npm install` inside the project directory. Never run global npm installs.

---

## Browser Layout — IMPORTANT

LifeHex is a **full-browser desktop web app**, not a mobile app and not a centred narrow column. Do **not** constrain the page to 390px or 480px width. Do **not** centre a narrow card in the middle of the screen with Night Sky gutters. The app fills the full browser viewport.

This has been a recurring issue when the app is rebuilt from scratch — previous attempts rendered it as a phone-sized column centred on the page. That is **wrong**. Every screen should fill the full available width and height.

### Layout philosophy
- Full viewport width and height at all times
- The Today screen uses a **viewport-height-constrained 3-column grid** — everything fits in a single non-scrolling view above the bottom nav bar with no page-level scroll
- Think **dashboard**, not phone app
- The bottom nav bar is the only fixed element; everything above it fills `calc(100dvh - nav_height - page_padding)` exactly

### Viewport height calculation
`App.tsx` applies `pt-6` (24px) top padding and `pb-20` (80px) bottom padding for the nav bar.  
Today screen outer container: `height: calc(100dvh - 104px)` — fills exactly the remaining space with no overflow and no scrollbar on the page itself.

### Responsive targets
| Breakpoint | Behaviour |
|---|---|
| Any desktop width | Full 3-column grid, fills viewport |
| Tablet (≥768px) | Same 3-column grid |
| Mobile (<768px) | Not a primary target; layout degrades gracefully |

### Bottom nav
`position: fixed; bottom: 0; width: 100%`  
Height: `56px` (80px with safe-area padding on touch devices)

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

### Group 1: Routines (emoji-triggered inline cards)

Routines are **not logged tasks** — they are guided checklists that give structure without being punitive if skipped. Prompt times are user-configurable. Items are purely visual; checking them off is local React state only (not persisted).

**How routines are accessed (current implementation):**

Three emoji buttons sit in the top-right corner of the Daily Checklist card header:

```
Daily Checklist     ✨  🍱  🌙
```

- Tapping an emoji **toggles** that routine card open/closed inline beneath the checklist header (Framer Motion height animation)
- Only one routine can be open at a time; tapping a different emoji switches
- Each routine card has a **`···` (3-dot) button** that expands an inline time picker to configure when that routine auto-shows (writes to `settingsStore`)

**Auto-show trigger (future / partially scaffolded):** Times are stored in `settingsStore` (`morningRoutineTime`, `lunchNudgeTime`, `bedtimeRoutineTime`) but time-based auto-pop on app open is not yet wired up — routines are currently always manually triggered via the emoji buttons.

**Morning Routine** ✨ — default trigger: 9:00am

```
✨ Morning Routine                    ···  ✕
□ Don't touch your phone yet
□ Clean up / make bed
□ Morning journal
□ Eat breakfast
□ Sit at a window for 5 minutes
□ Say hello to parents / John
□ Take meds
□ Start your day
```

On luteal phase days the card prepends:  
`🌙 Luteal phase — be extra gentle with yourself today.`

**Lunch Break** 🍱 — default trigger: 12:00pm

```
🍱 Lunch Break                        ···  ✕
□ Step away from your desk
□ Close the laptop
[ I'm on my break ]   ← only logged action; sets lunchBreakTaken: true
```

**Wind Down** 🌙 — default trigger: 10:00pm

```
🌙 Wind Down                          ···  ✕
□ Screens away
□ Say goodnight to everyone
□ Brush teeth
□ Read book or manga
□ Lights out
```

---

### Group 2: Daily Checklist (always interactive, logged with timestamp)

A card section always visible in the right column of the Today screen — not gated by the lock/unlock state. Each item can be checked off at any time. Checking logs the current time as an ISO string. State persists all day; at midnight `ensureToday()` archives the record and resets.

| Item | Type | Detail |
|---|---|---|
| Medication taken | Toggle (weekdays only) | Logs time tapped. On weekends: greyed out with "rest day" label |
| Breakfast | Toggle + expand | Expands: optional note ("what was it?") + checkbox "proper break — not at desk" |
| Lunch | Toggle + expand | Same as breakfast + "stepped away from desk" checkbox (`lunchBreakTaken`) |
| Dinner | Toggle + expand | Same as breakfast |
| Gym today | Toggle | Logs time tapped |
| Alone time today | Toggle | Logs time tapped |

**Checklist UI:**
- Each row: pixel-art checkbox (unchecked: `border: 2px solid #9b89c4`; checked: Mint Green fill with SVG checkmark)
- Timestamp appears inline after checking: `✓ 9:23am` in Nunito 11px Mint Green
- **Time editing:** A pencil `✏` button appears next to the timestamp. Clicking opens an inline `<input type="time">` pre-filled with the logged time. Press Enter or blur to save the corrected time; Escape cancels. This lets you backfill the actual time if you forgot to check the box in the moment.
- Meal rows expand on click via Framer Motion height animation to show note field and "proper break" toggle
- **Routine triggers:** Three emoji buttons (✨ 🍱 🌙) in the card header open routine cards inline (see Group 1)

---

### Sessions List (Right Column, below Daily Checklist)

Shows all locked sessions for today. Only rendered if at least one session exists — no empty card shown, the space collapses.

**Section header:** "SESSIONS ({N})" in Press Start 2P 8px, Star Gold.

**Each session row:**

```
21:57   😊  6      ⚡  5      🧘  7      ● GREEN
```

- Timestamp: Nunito Bold 13px, Cloud White, left-aligned
- Three metric pills side by side:
  - Mood pill: mood emoji + score, Star Gold text
  - Energy pill: ⚡ + score, Mint Green text
  - Regulation pill: 🧘 + score, Soft Lilac text
- Zone dot: 8px coloured circle, right-aligned, in zone colour
- Delete button: `×` in Muted Purple, far right, tap to remove session (with confirmation)

**Row styling:**
- `background: rgba(155,137,196,0.08)` — very subtle tint
- `border: 1px solid #9b89c4/20`
- `border-radius: 4px`, `padding: 8px 12px`
- `gap: 12px` between elements

**The three metric pills replace the old `E5 R7` notation** — same data, immediately readable because emoji + colour carry the meaning without needing to decode abbreviations.

If a session has a zone override (user corrected the system suggestion), show a small `↺` icon in Muted Purple next to the zone dot.

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

A prominent coloured card displayed in the top bar area (alongside period strip). **Always visible** — shows most recently saved zone when locked, updates live when unlocked.

**Green state:**
```
┌────────────────────────────────┐
│  TODAY'S ZONE                  │
│  ● GREEN            ↺ override │
└────────────────────────────────┘
```

**Amber state** (more urgent — background shifts, reason line added):
```
┌────────────────────────────────┐  bg: rgba(255,234,167,0.15)
│  TODAY'S ZONE                  │  border: 2px solid #c9a84c
│  ● AMBER            ↺ override │
│  low energy · luteal phase     │  ← reason line, Nunito 10px
└────────────────────────────────┘
```

**Red state** (most urgent):
```
┌────────────────────────────────┐  bg: rgba(247,202,201,0.2)
│  TODAY'S ZONE                  │  border: 2px solid #c98a88
│  ● RED              ↺ override │
│  very low regulation           │  ← reason line, Nunito 10px
└────────────────────────────────┘
```

**Reason line logic** — generated in `regulationScore.ts` alongside the zone calculation. Shows the top 1–2 contributing factors in plain language:

| Condition | Reason text |
|---|---|
| Mood ≤ 3 | "very low mood" |
| Energy ≤ 3 | "very low energy" |
| Regulation ≤ 3 | "very low regulation" |
| isLutealPhase | "luteal phase" |
| symptomCount ≥ 3 | "multiple symptoms" |
| thatWasntMe | "dissociation flagged" |
| isWeekday && !medicationTaken | "no medication today" |

Reasons are joined with " · ". Maximum 2 reasons shown. Only shown in amber/red states — green state shows no reason line.

- Zone label in Press Start 2P 10px
- Tapping "↺ override" opens a small bottom sheet with three zone buttons: Green / Amber / Red
- Both system-suggested and user-confirmed zone stored on every locked session for algorithm refinement

---

### Group 4: Physical Symptoms (optional, collapsible)

A collapsible section at the bottom of the right column. Always interactive — not gated by lock state. Stored at day level.

**Collapsed state** — shows actual logged symptoms as chips even when collapsed, not just a count:
```
▶ PHYSICAL SYMPTOMS  fatigue · headache        (if 2 logged)
▶ PHYSICAL SYMPTOMS  optional                  (if none logged)
```
Symptom names in the collapsed header are Nunito 12px Muted Purple, comma-separated. This means you see the actual data without expanding. The section only shows "optional" when nothing has been logged yet.

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
  updated_at: string;                 // ISO timestamp — updated on every settings change, used for merge
  // Future scope — scaffolded but non-functional in v1
  moodAlertThreshold: number;         // default: 5
  googleCalendarConnected: boolean;   // default: false
}
```

---

## Features

### 1. Today Screen

The primary daily interaction screen. **Not scrollable at the page level** — everything fits in the viewport. Only the right column scrolls internally. Fixed bottom nav.

**Three-column grid layout** (see Screen layout spec above for the full diagram):

**Top bar (full width, flex-shrink-0):**
1. Header row — "Today" title + date | Lock button (centred) | current time (right-aligned)
2. News ticker — scrolling marquee of all 8 dimension short-names and scores
3. Period strip + Zone badge side by side (period strip flex-1, zone badge w-52)

**Left column (1fr):** Wheel of Life radar chart + Mood/Energy/Reg timeline (below radar)
**Centre column (190px):** State sliders (Mood / Energy / Reg) only
**Right column (1fr):** Daily Checklist → Sessions list (if any today) → Physical Symptoms

#### Radar Chart (Left Column)

Implemented as a fully custom inline SVG — **not Recharts**. Recharts was abandoned because it doesn't support direct pointer-drag interaction on individual axis handles.

**Geometry:**
- ViewBox: `320 × 320`. Centre: `(160, 160)`. Outer radius `R = 104`. Label radius `LABEL_R = 126`.
- 8 axes, evenly spaced at 45°, starting at top (−π/2): Health → Mental → Relationships → Family → Work → Creative → Rest → Nourishment
- Grid rings drawn at values 2, 4, 6, 8, 10
- SVG uses `width="100%" height="100%" preserveAspectRatio="xMidYMid meet"` — fills the left column card without distortion
- Container must NOT have `overflow: hidden` — SVG labels render outside the clip boundary and pointer events would be clipped

**Interaction:**
- Pointer capture (`setPointerCapture`) on the SVG itself handles all drag/tap events
- **Drag** a handle dot to change that dimension's value in real time (live polygon update)
- **Tap** a label or handle to open the dimension detail bottom sheet (`onAxisTap` callback)
- Tap vs drag distinguished by a 5px movement threshold (`DRAG_THRESHOLD`)

**Visual states:**
- **Locked:** polygon fill `rgba(201,184,240,0.3)`, stroke `#9b89c4` (Muted Purple)
- **Unlocked:** polygon fill `rgba(181,234,215,0.35)`, stroke `#ffe066` (Star Gold)
- Active/dragging handle: radius 11px, fill Star Gold. Active (tapped): radius 8px, fill Star Gold. Idle: radius 6px.

**Labels:**
- Short name (e.g. "HEALTH") in Nunito Bold 7px — kept small to prevent overflow at LABEL_R = 126
- Score value below it in Nunito ExtraBold 10px
- Label `<g>` elements have `pointerEvents: 'auto'` so hover events fire without interfering with drag

**Hover tooltip (label only — not dot handles):**
- `onMouseEnter` / `onMouseLeave` on label `<g>` elements fire `onAxisHover` callback
- Dot handles do NOT fire hover events
- Tooltip renders as an `position: absolute` floating card within the left column card, positioned `bottom: 38px` (above the legend row), with `pointer-events: none` — **no layout shift**
- Legend row (short name + score for all 8 dims) is always visible beneath the tooltip

**Legend row — dimension highlighting:**
The legend row below the radar always shows all 8 dimensions. It also highlights the two lowest and two highest scoring dimensions to give an immediate at-a-glance signal without reading the full octagon:
- **Two lowest scoring dimensions:** label and score rendered in Blush Pink `#f7cac9` with a subtle `border: 1px solid #c98a88` around the legend chip
- **Two highest scoring dimensions:** label and score rendered in Mint Green `#b5ead7` with a subtle `border: 1px solid #6aab90`
- All other dimensions: Cloud White `#fdfcff` label, no border
- Ties broken by axis order (first occurrence wins)
- If all dimensions are equal score: no highlighting applied, all Cloud White

**Dimension detail bottom sheet:**
- Triggered by tap on label or handle
- `height: 78vh`, `flex flex-col`, `border-radius: 8px 8px 0 0`
- Drag handle at top; inner content div is `flex-1 overflow-y-auto`
- Swipe-to-dismiss: Framer Motion `drag="y"` with `dragConstraints={{ top: 0 }}`. Dismissed if `offset.y > 80` or `velocity.y > 400`
- Shows: dimension name, description, score, Adds ↑ chips (Mint Green), Detracts ↓ chips (Blush Pink)
- Close button (×) in header

#### State Timeline (Left Column, below radar)

Sits below the radar chart in the left column card, separated by a `1px solid #9b89c4/30` divider. Gives the timeline the full left column width — significantly more readable than the previous cramped centre column placement.

Shows all three state metrics for today's locked sessions as a multi-line sparkline.

- **Time range:** 8:00am → midnight (16-hour window)
- X-axis: hours `[8, 12, 16, 20, 24]`; labels in Nunito 10px, rotated vertical to prevent overlap
- Y-axis: 1–10, grid lines at 1, 5, 10 in Muted Purple at 20% opacity
- **Three lines plotted:**
  - Mood: Star Gold `#ffe066`, dot radius 4px
  - Energy: Mint Green `#b5ead7`, dot radius 4px
  - Regulation: Soft Lilac `#c9b8f0`, dot radius 4px
- Each session is a point on all three lines simultaneously, connected within each line
- Dots: filled circles. On hover: radius increases to 6px + tooltip showing `HH:MM · 😊 M · ⚡ E · 🧘 R`
- If a session only has one data point (no line to draw): renders as isolated dots only
- Small legend below the chart: coloured square + label for each metric, Nunito 10px
- **Empty state:** "No sessions today" centred in Muted Purple Nunito 13px — chart area collapses to minimal height (~60px) with the empty message centred

#### State Sliders (Centre Column)

Three **vertical** range sliders stacked side by side, filling the centre column card. Each is a `MoodSlider` component in vertical mode. The centre column contains **only the sliders** — the timeline has moved to the left column below the radar.

**Layout:** `flex gap-3 justify-around` within the column card. Each slider is `flex flex-col items-center h-full`.

**Vertical slider implementation:**
- CSS class `pixslider-vert`: `writing-mode: vertical-lr; direction: rtl; width: 6px; height: 100%`
- Emoji position uses **pure CSS calc** — no JavaScript measurement: `top: calc(${pct} * (100% - 18px))` where `pct = (10 - value) / 9`. This is mathematically exact: thumb centre travels from 9px (top, value=10) to (H−9px) (bottom, value=1); emoji top = pct × (H−18px).
- `transition: top 80ms ease` for smooth emoji movement

**Hover tooltip:** Hovering the label text (not the slider itself) shows a 160px floating card above the label. The tooltip div has `normal-case tracking-normal` to override the parent's `uppercase tracking-widest` CSS so description text renders in normal sentence case.

| Slider | Range | Emojis | Tooltip |
|---|---|---|---|
| Mood | 1–10 | 😫→🙁→😶→😄→😆 | "Your overall emotional tone right now…" |
| Energy | 1–10 | 🪫→😐→⚡ | "Physical and mental fuel available…" |
| Reg | 1–10 | 🌋→😤→🧘 | "Emotional regulation — how grounded…" |

All three are disabled (opacity 0.5, pointer-events none) when session is locked.

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

The Cycle screen uses the full browser width with a **two-column layout** — current cycle information on the left, historical pattern on the right. Scrollable page.

```
┌────────────────────────────────────────────────────────────────────────┐
│  HEADER ROW: "Cycle"                                                   │
├──────────────────────────────────┬─────────────────────────────────────┤
│  LEFT COLUMN (1fr)               │  RIGHT COLUMN (1.5fr)               │
│                                  │                                     │
│  CURRENT CYCLE CARD              │  YOUR CYCLE PATTERN CARD            │
│  Phase ring + countdown          │  28-day mood map                    │
│  Projected warning banner        │  "That wasn't me" strip             │
│  Log period buttons              │                                     │
│  Cycle settings (collapsible)    ├─────────────────────────────────────┤
│                                  │  CYCLE LOG                          │
│                                  │  Scrollable list of past cycles     │
└──────────────────────────────────┴─────────────────────────────────────┘
│  BOTTOM NAV (fixed)                                                    │
└────────────────────────────────────────────────────────────────────────┘
```

**Grid implementation:**
```css
.cycle-page {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 12px;
  padding: 0 24px;
  align-items: start;
}

/* Right column stacks pattern card above log */
.cycle-right {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
```

The right column is wider (`1.5fr`) because the 28-day pattern strip needs horizontal space — each of the 28 day slots needs to be legible.

---

#### Left column — Current cycle card

**Phase ring** — large arc showing current position in cycle. Phase label, day count, days until next period, moon icon for current phase. Centred in the card.

**Projected warning banner** — shown whenever within 7 days of luteal window or currently in it. Amber card below the ring:

```
┌──────────────────────────────────────────┐
│  🌙 Luteal phase in 4 days               │
│  Based on your cycle, day 17 arrives     │
│  on Thu 22 May. Your harder window       │
│  typically runs 10–11 days.              │
└──────────────────────────────────────────┘
```

If currently in luteal phase:
```
┌──────────────────────────────────────────┐
│  🌙 Luteal phase — day 3 of ~11          │
│  Period expected around 4 June.          │
│  Be gentle with yourself this week.      │
└──────────────────────────────────────────┘
```

Banner: Butter Yellow `#ffeaa7` bg, `border: 2px solid #c9a84c`, Nunito 13px, Pixel Black `#2d2b3d`.

**Log period buttons** — two buttons below the banner:
- "Period started today" → new CycleEntry with today as start
- "Period ended today" → sets cycleEndDate on open entry
- Confirmation prompt if a period entry is already open

**Cycle settings** — collapsible section, collapsed by default, at the bottom of the left card:
- Expected cycle length slider (21–35 days)
- Expected period duration slider (3–8 days)
- Changes apply to current and future predictions only — past confirmed cycles are immutable

---

#### Right column — top: Your cycle pattern card

Title: "Your cycle pattern" in Press Start 2P 10px.
Subtitle: "Average across all logged cycles · {N} cycles" in Nunito 12px Muted Purple.

**Personal mood map** — a horizontal row of 28 equally-spaced day-slot blocks filling the full card width. Each slot coloured by average mood across all historical cycles for that cycle day:

| Avg mood | Colour |
|---|---|
| ≥ 7 | Mint Green `#b5ead7` |
| 4–6.99 | Butter Yellow `#ffeaa7` |
| < 4 | Blush Pink `#f7cac9` |
| No data | Deep Indigo, dashed Muted Purple border |

Block height: `~40px`. Day number label below each block in Press Start 2P 6px.

Phase labels above the strip at correct day ranges: **M** (days 1–5) · **F** (days 6–13) · **O** (days 14–15) · **L** (days 16–28) — in their respective phase colours, Press Start 2P 8px.

Today's cycle day: Star Gold `#ffe066` outline `2px solid`, so you can see exactly where you are in your personal pattern.

**"That wasn't me" strip** — a thinner strip (20px tall) directly below the mood map. Small Blush Pink dot on days where dissociation flags have historically clustered. Empty otherwise. Label: "that wasn't me" in Nunito 10px Muted Purple, left-aligned above the strip.

**Hover on any day slot:** tooltip showing "Day {N} · Avg mood {X} · {Y} sessions · {Z} flags"

**Empty state** (first cycle, limited data): All slots show in Deep Indigo empty state. Banner above: "This fills in as you log more cycles. You're on cycle 1 — keep going." Days already passed in the current cycle fill in with actual data immediately.

---

#### Right column — bottom: Cycle log card

Title: "Cycle history" in Press Start 2P 10px.

Scrollable list of all past confirmed cycles, most recent first. Each row:
- Start date → end date
- Duration in days
- A small coloured phase pill bar (proportional M/F/O/L segments) scaled to that cycle's length
- If end date is null (ongoing): "In progress" label in Mint Green

Max height: `300px`, `overflow-y: auto`, thin scrollbar.

---

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

The Calendar screen uses the full browser width with a **two-column layout** — the calendar grid on the left, a detail/summary panel on the right that updates when you click a day.

```
┌────────────────────────────────────────────────────────────────────────┐
│  HEADER ROW: "Calendar"                                                │
├──────────────────────────────────────┬─────────────────────────────────┤
│  LEFT (2fr): CALENDAR GRID           │  RIGHT (1fr): DAY DETAIL PANEL  │
│                                      │                                 │
│  ← May 2025 →                        │  (empty until day tapped)       │
│  Mo Tu We Th Fr Sa Su                │  Shows: sessions, checklist,    │
│  [  ][  ][  ][  ][  ][  ][  ]       │  symptoms, "that wasn't me"     │
│  ...                                 │  flag, moon phase label         │
│                                      │                                 │
└──────────────────────────────────────┴─────────────────────────────────┘
│  BOTTOM NAV (fixed)                                                    │
└────────────────────────────────────────────────────────────────────────┘
```

**Grid:**
```css
.calendar-page {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 12px;
  padding: 0 24px;
  align-items: start;
}
```

**Left column — calendar grid:**
- Month header: ← May 2025 → centred, Press Start 2P 12px
- Day-of-week row: Mo Tu We Th Fr Sa Su in Press Start 2P 8px Muted Purple
- Grid: 7 equal columns. Each cell approximately `(available width / 7)` wide, `~72px` tall
- Luteal window days have a faint Butter Yellow `rgba(255,234,167,0.08)` wash stacked under their zone tint — creates a subtle amber stripe across those days that makes the cluster pattern visible over months

**Each day cell:**
- Day number: Press Start 2P 10px, top-left
- Background tint: dominant zone colour (see CSS below)
- Moon icon: 16×16px SVG, bottom-right corner
- Session dot: 4px Star Gold circle, bottom-centre, if any sessions logged
- Clicking a day: highlights it with Star Gold outline and populates the right panel (no bottom sheet — the panel is always there)

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
outline: none;
box-shadow: inset 0 0 0 1000px rgba(255, 234, 167, 0.06);

/* Selected day */
outline: 2px solid #ffe066;
outline-offset: -2px;

/* Today (unselected) */
border: 2px solid #ffe066;
```

**Right column — day detail panel:**

Default state (no day selected): A placeholder card with "← Select a day to see details" in Nunito 14px Muted Purple, centred.

When a day is selected, the panel fills with:
- **Date header:** Day name + full date, Press Start 2P 10px, Cloud White
- **Zone badge:** GREEN / AMBER / RED pill in zone colour
- **Moon phase label:** phase name + moon SVG icon, Nunito 13px
- **Sessions list:** each session shows time + mood emoji + mood/energy/reg scores + zone dot. If none: "No sessions logged."
- **Checklist summary:** icons row — medication ✓/✗, meals 3/3, gym ✓/✗, alone time ✓/✗. Nunito 13px.
- **Physical symptoms:** comma-separated list if any logged. "None logged" otherwise.
- **"That wasn't me" flag:** shown in a small Blush Pink chip if flagged, with note if present. Hidden if not flagged.

The right panel is `position: sticky; top: 24px` so it stays visible as the calendar scrolls.

---

### 6. Dashboard Screen

The Dashboard is a **full-browser review page** that uses the full horizontal viewport — same philosophy as the Today screen. It is **not** a narrow centred column. The layout uses a grid that fills the viewport width at all times.

It answers four questions, arranged spatially rather than sequentially:

1. **Top bar:** How am I doing right now? (headline + stats)
2. **Left column:** How have I been feeling over time? (main trend chart)
3. **Right column — top:** What's driving it? (correlation cards)
4. **Right column — bottom:** Which parts of my life have drifted? (radar)
5. **Full width — bottom:** What does my cycle pattern look like? (cycle strip)

**Global time window toggle** — top-right of the page header. Three options: `7d` / `30d` / `90d`. Affects every chart and stat simultaneously. Segmented pixel-art button group. Default: `30d`.

The page uses `overflow-y: auto`. All sections are `card-indigo` cards with `16px` internal padding and `12px` gap.

---

#### Full layout spec (wide browser)

```
┌────────────────────────────────────────────────────────────────────────┐
│  HEADER ROW (full width)                                               │
│  "Dashboard" · Trends · History · Drift        [7d]  [30d]  [90d]     │
├────────────────────────────────────────────────────────────────────────┤
│  HEADLINE CARD (full width)                                            │
│  Synthesis sentence                    [pill] [pill] [pill] [pill]    │
├─────────────────────────────────────┬──────────────────────────────────┤
│                                     │  CORRELATION CARDS (1fr)        │
│  FEELING CHART (2fr)                │  2×2 grid of causal comparisons │
│  3 lines mood/energy/reg            ├──────────────────────────────────┤
│  + luteal bands                     │  BALANCE DRIFT RADAR (1fr)      │
│  + zone dot strip                   │  Read-only radar + drift table  │
│                                     │                                  │
├─────────────────────────────────────┴──────────────────────────────────┤
│  CYCLE PATTERN STRIP (full width)                                      │
│  28-day personal mood map + "that wasn't me" strip                     │
└────────────────────────────────────────────────────────────────────────┘
│  BOTTOM NAV (fixed)                                                    │
└────────────────────────────────────────────────────────────────────────┘
```

**Grid implementation:**
```css
/* Outer page container — flex column */
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 24px;
  overflow-y: auto;
}

/* Main two-column area */
.dashboard-main {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 12px;
  align-items: start;
}

/* Right column — stacks correlation + radar vertically */
.dashboard-right {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
```

The left column is `2fr` — the feeling chart gets the majority of horizontal space. The right column stacks correlation cards above the drift radar. The cycle strip sits below both at full width.

The feeling chart height should be `min-height: 320px` and grows with content. The right column cards fill their natural height — they do not need to match the left column exactly. The radar card uses `aspect-ratio: 1` to keep the SVG square within its column width.

---

#### Section 1 — Headline card

A single full-width card at the top. Two parts:

**Synthesis sentence** — generated from current data in `utils/dashboardInsight.ts`. Picks the most relevant single insight based on priority order:

| Condition | Message |
|---|---|
| Currently in luteal phase | "🌙 Luteal phase — day {X} of {N}. {If avg reg < 6: 'Your regulation has been lower than usual this week. Be gentle.'}" |
| Luteal phase in ≤ 5 days | "🌙 Luteal phase in {N} days. {If 7d avg reg is declining: 'Your regulation is already trending down — worth protecting your schedule.'}" |
| 5+ green days streak | "✨ {N} green days in a row. {Phase label} — {If follicular: 'this is usually your strongest window.'}" |
| 3+ red/amber days in current week | "⚠️ {N} harder days this week. {If luteal: 'This matches your luteal phase pattern.'}" |
| 7-day avg regulation < 5 | "🔴 Your regulation average has been below 5 for 7 days. Consider booking something restorative." |
| Default (no strong signal) | "📊 {N} sessions logged over {window}. Avg mood {X} · Avg regulation {Y}." |

The sentence uses Nunito 15px. Muted Purple text for the default state; Cloud White for warning/positive states.

**Stat pills row** — four small pills below the sentence, full width, evenly spaced:

| Pill | Value | Colour |
|---|---|---|
| Avg Mood | e.g. `😄 7.2` | Star Gold |
| Avg Regulation | e.g. `🧘 6.8` | Soft Lilac |
| Current streak | e.g. `🔥 4d green` or `2d amber` | zone colour |
| Cycle position | e.g. `🌙 Luteal day 3` or `Follicular · 8d to luteal` | phase colour |

Pills: Deep Indigo bg, `border: 1px solid #9b89c4`, `border-radius: 4px`, Press Start 2P 8px label, Nunito 13px value.

---

#### Section 2 — Feeling chart

Full-width card. Two stacked layers sharing the same x-axis (date range).

**Line chart** (Recharts `ComposedChart`):
- Three lines: Mood (Star Gold `#ffe066`), Energy (Mint Green `#b5ead7`), Regulation (Soft Lilac `#c9b8f0`)
- Each point = one locked session. Multiple sessions per day appear as separate dots.
- X-axis: dates across selected window. Y-axis: 1–10.
- **Luteal phase bands:** `ReferenceArea` elements for each luteal window in the time range. Fill: `rgba(255, 234, 167, 0.12)`. No stroke. Renders behind the lines.
- Grid lines: horizontal only, Muted Purple at 20% opacity
- Dot size: 4px radius. On hover: 6px + tooltip showing `HH:MM · Mood X · Energy Y · Reg Z`
- Legend: small coloured squares + labels, bottom of chart, Nunito 11px

**Empty state:** "No sessions in this window yet — start logging on the Today page." Centred, Nunito 14px, Muted Purple.

**Zone dot strip** (sits flush below the chart, same card, separated by a 1px `#9b89c4/30` line):
- One dot per calendar day across the selected window
- Dot size: 10px circle
- Colour: green (`#b5ead7`) / amber (`#ffeaa7`) / red (`#f7cac9`) / no data (Deep Indigo with Muted Purple border)
- Days in luteal window: dot has an additional outer ring in Butter Shadow `#c9a84c`
- Dots evenly spaced across full card width
- Hover: tooltip with date + zone label
- Acts as a visual summary / colour-coded ruler below the chart

---

#### Section 3 — Correlation cards

Left half of a two-column row (right half is Section 4). Four cards in a 2×2 grid.

Each card answers one causal question with a simple before/after comparison:

**Card 1 — 💊 Medication effect**
- Label: "Medication"
- Shows: avg emotional regulation on medicated weekdays vs unmedicated weekdays
- Format: `Medicated 7.2 · Unmedicated 4.8` with a small coloured delta arrow
- Only counts weekdays (medication is weekday-only)

**Card 2 — 🌙 Cycle phase effect**
- Label: "Cycle phase"
- Shows: avg mood on luteal days vs non-luteal days
- Format: `Non-luteal 7.4 · Luteal 5.1`

**Card 3 — 🏋️ Movement effect**
- Label: "Movement"
- Shows: avg mood on gym days vs non-gym days
- Format: `Gym days 7.8 · Rest days 6.2`

**Card 4 — 🍱 Nourishment effect**
- Label: "Meals"
- Shows: avg regulation on days with 3 meals logged vs fewer
- Format: `3 meals 7.0 · Fewer 5.5`

**Card styling:**
- Deep Indigo bg, `border: 1px solid #9b89c4`, `border-radius: 4px`, `padding: 12px`
- Emoji + label: Press Start 2P 8px, Muted Purple
- Numbers: Nunito Bold 18px, Cloud White
- Delta arrow: ↑ Mint Green if positive correlation clearly visible (diff > 0.5), → Muted Purple if inconclusive, ↓ Blush Pink if inverse
- **Empty state** (fewer than 7 days of relevant data): replace numbers with "More data needed" in Nunito 12px Muted Purple. Do not show zeroes or misleading comparisons.

---

#### Section 4 — Balance drift radar

Right half of the two-column row (sits alongside Section 3).

**Radar chart** — same custom SVG radar as Today screen but read-only (no drag interaction). Two overlaid polygons:

- **Current window** (e.g. last 30 days average): Star Gold stroke `#ffe066`, fill `rgba(255,224,102,0.15)`
- **Previous window** (the 30 days before that): Muted Purple stroke `#9b89c4`, fill `rgba(155,137,196,0.1)`

This answers "which dimensions have shifted" more usefully than 7d vs 30d when data is sparse, because comparing last-30 vs prior-30 only requires you to have been logging for 60 days. For users with less data, falls back to 7d vs all-time average.

**Legend:** "Last {N}d" in Star Gold · "Prior {N}d" in Muted Purple — Nunito 11px below radar.

**Drift table** — below the radar, a small list of the top 3 positive and top 3 negative dimension drifts:

```
↑ Nourishment  +2.1
↑ Rest         +1.4
↑ Health       +0.8
↓ Creative     −2.4
↓ Mental       −1.1
↓ Family       −0.6
```

Nunito 13px. Green arrows for positive, Blush Pink for negative. Only shows if drift data is meaningful (diff > 0.3 on at least one dimension).

**Empty state:** "Keep logging to see how your balance shifts over time." Centred, Nunito 13px, Muted Purple. Radar still renders but both polygons show a flat octagon at 5 on all axes.

---

#### Section 5 — Cycle pattern strip

Full-width card. **Scaffolded from day one but fills with data over time.**

Title: "Your cycle pattern" in Press Start 2P 10px. Subtitle: "Average across all logged cycles · {N} cycles" in Nunito 12px Muted Purple.

**Mood strip** — a horizontal row of 28 day-slot blocks (cycle day 1 through 28), each coloured by the average mood logged on that cycle day across all historical data:

| Avg mood | Block colour |
|---|---|
| ≥ 7 | Mint Green `#b5ead7` |
| 4–6.99 | Butter Yellow `#ffeaa7` |
| < 4 | Blush Pink `#f7cac9` |
| No data | Deep Indigo with dashed Muted Purple border |

Block size: equal width to fill full card, ~32px tall. Day number label below each block in Press Start 2P 6px.

Phase labels above the strip at the correct day ranges: M (days 1–5) · F (days 6–13) · O (days 14–15) · L (days 16–28) — in their respective phase colours.

**"That wasn't me" strip** — a second, thinner strip (16px tall) directly below the mood strip. Each slot shows a small Blush Pink dot if any "that wasn't me" flags were logged on that cycle day historically. No dot if none. This builds a personal map of dissociation frequency across the cycle.

**Hover:** hovering a day slot shows a tooltip: "Day {N} · Avg mood {X} · {Y} sessions · {Z} 'that wasn't me' flags"

**Empty state** (fewer than 1 full cycle logged): Shows the 28-block strip with all slots in Deep Indigo empty state + a banner above: "This fills in as you log more cycles. You're on cycle 1 — keep going." Blocks for the current cycle days you've already passed fill in with your actual data even on the first cycle.

---

**Future scope placeholders (scaffolded, non-functional in v1):**
```typescript
// TODO: adaptive zone algorithm weight refinement from override history
// TODO: 7-day average zone drop in-app banner alert
// TODO: Google Calendar integration — auto-add break/gym/rest slots
// TODO: export dashboard as PDF summary
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

### Screen layout spec — Today screen (full browser, 3-column grid)

The Today screen is a **single non-scrolling viewport**. Everything fits within `calc(100dvh - 104px)` with no page-level scroll. The right column is the only internally-scrollable area.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  HEADER ROW (flex, 3-cell grid: 1fr auto 1fr)                            │
│  "Today" + date label       Lock button         Current time             │
├──────────────────────────────────────────────────────────────────────────┤
│  NEWS TICKER (full width, scrolling marquee of dimension scores)          │
├──────────────────────────────────────────────────────────────────────────┤
│  PERIOD STRIP (flex-1)          │  ZONE BADGE (w-52, flex-shrink-0)      │
│  Phase + cycle day + mini bar   │  ● GREEN / AMBER / RED  ↺ override     │
│                                 │  reason line (amber/red only)          │
├───────────────────┬─────────────┴─────────────┬──────────────────────────┤
│   LEFT            │   CENTRE    (190px fixed)  │   RIGHT                  │
│   1fr             │                            │   1fr                    │
│                   │                            │                          │
│  ┌─────────────┐  │  ┌─────────────────────┐   │  ┌────────────────────┐ │
│  │ Wheel of    │  │  │ State               │   │  │ Daily Checklist    │ │
│  │ Life        │  │  │                     │   │  │ ✨ 🍱 🌙           │ │
│  │             │  │  │  [Mood] [Enrg] [Reg]│   │  │ □ Medication ✓9am  │ │
│  │  8-axis     │  │  │  vertical sliders   │   │  │ □ Breakfast ▼      │ │
│  │  SVG radar  │  │  │  with emoji thumbs  │   │  │ □ Lunch     ▼      │ │
│  │             │  │  │  (sliders only —    │   │  │ □ Dinner    ▼      │ │
│  │  (drag/tap  │  │  │   no timeline here) │   │  │ □ Gym              │ │
│  │   handles)  │  │  │                     │   │  │ □ Alone time       │ │
│  │             │  │  └─────────────────────┘   │  └────────────────────┘ │
│  └─────────────┘  │                            │                          │
│                   │                            │  ┌────────────────────┐ │
│  dimension legend │                            │  │ SESSIONS (N)       │ │
│  lowest 2 = pink  │                            │  │ 21:57 😊6 ⚡5 🧘7  │ │
│  highest 2 = mint │                            │  │ ● GREEN            │ │
│                   │                            │  └────────────────────┘ │
│  ────────────────  │                            │                          │
│  STATE TIMELINE   │                            │  ┌────────────────────┐ │
│  mood/energy/reg  │                            │  │ ▶ Physical symptoms│ │
│  3 lines, today   │                            │  │ fatigue · headache │ │
│                   │                            │  └────────────────────┘ │
├───────────────────┴────────────────────────────┴──────────────────────────┤
│  BOTTOM NAV — fixed, full width                                            │
│  🌸 Today   📅 Calendar   🌙 Cycle   📊 Dashboard   ⚙ Settings           │
└──────────────────────────────────────────────────────────────────────────┘
```

**Column grid:** `gridTemplateColumns: '1fr 190px 1fr'`  
**Outer container:** `display: flex; flex-direction: column; height: calc(100dvh - 104px); gap: 8px`  
**Top compact section:** `flex-shrink: 0` (header + ticker + period/zone row)  
**3-column grid:** `flex: 1; min-height: 0` — fills remaining height exactly

**Card internal padding:** `card-indigo` = 14px border-radius, 16px padding, Deep Indigo bg  
**Column overflow:** Left and Centre: `overflow: hidden`. Right: `overflow-y: auto; scrollbar-width: thin`

**Spacing tokens:**
- Page padding (App.tsx): `pt-6` (24px top) + `pb-20` (80px bottom nav)
- Column gap: `12px`
- Card internal padding: `16px` (from `card-indigo` class)

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

### Bottom sheet behaviour (dimension detail)

```
Entry:       Framer Motion y: '100%' → y: 0, duration: 0.22s, easing: easeOut
Background:  Deep Indigo #16213e  (card-indigo class)
Top border:  2px solid #9b89c4
Radius:      border-radius: 8px 8px 0 0
Backdrop:    rgba(26, 26, 46, 0.85) blur(4px) — click to dismiss
Height:      78vh  (fixed, not max-height — ensures full content visibility)
Layout:      flex flex-col — handle (flex-shrink-0) + scrollable content (flex-1 overflow-y-auto)
Handle bar:  40px × 4px, border-radius: 2px, colour #9b89c4/50, centred, 8px gap below top padding
Swipe close: Framer Motion drag="y" dragConstraints={{ top: 0 }} dragElastic={{ top: 0, bottom: 0.2 }}
             Dismissed when offset.y > 80px OR velocity.y > 400
```

---

## Navigation

| Tab | Icon | Screen |
|---|---|---|
| Today | ☀️ | Today.tsx |
| Calendar | 📅 | Calendar.tsx |
| Cycle | 🌙 | Cycle.tsx |
| Dashboard | 📊 | Dashboard.tsx |
| Settings | ☀️ | Settings.tsx |

- Active tab: Butter Yellow icon + Press Start 2P 8px label
- Inactive tab: Muted Purple icon, no label
- Tab bar: Deep Indigo bg, `box-shadow: 0px -2px 0px #9b89c4`

Settings: gear icon top-right, accessible from any screen.

---

## Data Persistence

All data is stored in browser localStorage via Zustand's `persist` middleware. Nothing is sent to a server. Five separate keys keep concerns isolated and allow independent migration to Google Drive per collection.

### localStorage keys

| Key | Store | Contents | Resets? |
|---|---|---|---|
| `lifehex_sessions` | `historyStore.ts` | All locked session snapshots (mood, energy, regulation, dimensions, zone, timestamp) | Never — accumulates indefinitely |
| `lifehex_day` | `dayStore.ts` | Today's DayRecord — checklist state, meals, symptoms, sleep, "that wasn't me" | Midnight — archived first, then reset |
| `lifehex_day_history` | `dayHistoryStore.ts` | All past DayRecords, sorted descending by date | Never — accumulates indefinitely |
| `lifehex_cycles` | `cycleStore.ts` | Period cycle entries (start date, end date, length) | Never |
| `lifehex_settings` | `settingsStore.ts` | Cycle lengths, routine times, medication toggle, Drive connection state | Never |

### Day archiving

`dayStore.ensureToday()` is called on every app mount and route change. When the stored `dayRecord.date` differs from today's date (i.e. the user opens the app after midnight):

1. The outgoing `DayRecord` is passed to `useDayHistoryStore.getState().archiveDay(record)`
2. `archiveDay` deduplicates by date (last-write-wins) — safe to call multiple times
3. A fresh `defaultDayRecord(today)` replaces the current record

This means checklist data is **never lost** — past days accumulate in `lifehex_day_history`.

### Export format (version 2)

Settings → Download JSON produces a file ready for Google Drive migration:

```json
{
  "version": 2,
  "exportedAt": "2026-05-17T10:00:00.000Z",
  "sessions": [...],
  "dayRecords": [...],
  "cycles": [...],
  "settings": {...}
}
```

`dayRecords` includes today's live record merged with all history (today wins on date collision). This matches the Drive sync schema exactly — `importDayRecords()` on `dayHistoryStore` is the hook for the future merge.

---

## Google Drive Sync

**Sync file:** `lifehex-data.json` in Google Drive app folder

```json
{
  "version": 2,
  "exportedAt": "ISO timestamp",
  "sessions": [...],
  "dayRecords": [...],
  "cycles": [...],
  "settings": {...}
}
```

> `zoneOverrides` are embedded within each `Session` object as `session.zoneOverride` (nullable). Not a separate top-level array.

---

### The merge function

The core of `driveSync.ts`. Every collection (sessions, dayRecords, cycles) is merged using the same function — Drive items load first, then local items overwrite if they are newer or not present on Drive at all.

```typescript
function _merge<T extends { id: string; updated_at?: string; created_at?: string }>(
  localItems: T[],
  driveItems: T[]
): T[] {
  const map = new Map<string, T>();

  // Drive items populate the map first
  driveItems.forEach(item => map.set(item.id, item));

  // Local items win if they are newer OR if they don't exist on Drive
  localItems.forEach(item => {
    const existing = map.get(item.id);
    const localTs = item.updated_at || item.created_at || '';
    const driveTs = existing
      ? (existing.updated_at || existing.created_at || '')
      : '';
    if (!existing || localTs > driveTs) {
      map.set(item.id, item);
    }
  });

  return [...map.values()];
}
```

**Key behaviour:**
- Items that exist only on Drive are kept (additive from Drive)
- Items that exist only locally are kept (additive from local — this is the fix for the data-loss bug)
- Items that exist on both sides: the one with the newer ISO timestamp wins
- Timestamps are compared as strings — ISO 8601 strings sort lexicographically correctly, so no date parsing needed

---

### Full sync flow on load

```
1. App starts
2. Check localStorage for 'lifehexConnected' === 'true'
3. If true → attempt silent token refresh (no popup, no user interaction)
4. If refresh succeeds → fetch lifehex-data.json from Drive
5. CRITICAL: if Drive file is empty, missing, or has zero items in all
   collections → DO NOT overwrite local data. Treat as "Drive is new/empty"
   and skip to step 7 with local data only.
6. If Drive file has data → merge each collection independently:
     mergedSessions   = _merge(localSessions,   driveSessions)
     mergedDayRecords = _merge(localDayRecords,  driveDayRecords)
     mergedCycles     = _merge(localCycles,      driveCycles)
     mergedSettings   = mergeSettings(localSettings, driveSettings)
7. Write merged result back to BOTH localStorage AND Drive
8. UI renders from merged state
```

**Step 5 is the critical fix for the data-loss bug.** The previous implementation treated an empty Drive file as authoritative, which wiped local data on first connect. The correct behaviour: if Drive returns an empty or null payload for any collection, that collection is ignored and local data is preserved. An empty Drive file means "nothing has been synced yet", not "there is nothing".

```typescript
// Guard in driveSync.ts — add this before any merge
function isDriveFileEmpty(driveData: DriveFile | null): boolean {
  if (!driveData) return true;
  const totalItems =
    (driveData.sessions?.length ?? 0) +
    (driveData.dayRecords?.length ?? 0) +
    (driveData.cycles?.length ?? 0);
  return totalItems === 0;
}

// In the sync-on-load flow:
const driveData = await fetchDriveFile();
if (isDriveFileEmpty(driveData)) {
  // Drive is new/empty — write local data up to Drive, don't touch local
  await writeDriveFile(buildDrivePayload(localState));
  return; // local state is already correct, no store updates needed
}
// Otherwise proceed with merge
```

---

### Settings merge

Settings is a single object, not an array, so it can't use `_merge`. It uses a simpler last-write-wins on the whole object using `updated_at`:

```typescript
// Add updated_at to Settings interface (see Data Models)
function mergeSettings(local: Settings, drive: Settings): Settings {
  const localTs = local.updated_at || '';
  const driveTs = drive.updated_at || '';
  return localTs >= driveTs ? local : drive;
}
```

If Drive settings are newer, Drive wins the whole object. If local is newer or equal, local wins. This means the last device to change a setting wins — acceptable for a single-user app.

> ⚠️ **Claude Code note:** Add `updated_at: string` to the `Settings` interface. Set it to `new Date().toISOString()` whenever any setting changes. This is required for the settings merge to work correctly.

---

### On every write (debounced)

After any lock event, checklist update, cycle log, or settings change, a debounced save fires:

```typescript
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSave(state: LifeHexState) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    const payload = buildDrivePayload(state);
    await patchDriveFile(payload);   // HTTP PATCH to Drive file
    localStorage.setItem('lifehex_last_synced', new Date().toISOString());
  }, 3000); // 3-second debounce — rapid changes batch into one write
}
```

Rapid edits (e.g. dragging a slider multiple times before locking) batch into a single Drive write.

---

### Multi-device behaviour

| Step | Desktop | Mobile (`/mobile`) |
|---|---|---|
| 1 | Logs sessions offline | — |
| 2 | Comes online → writes merged DB to Drive | — |
| 3 | — | Opens app → fetches Drive → merges → all sessions present |
| 4 | — | Adds checklist items → writes to Drive | |
| 5 | Refreshes → merges → checklist items now on desktop | — |

**Where it can go wrong:** No real-time listener — Drive is only read on load. If both devices are open simultaneously and edit the same session, whichever writes last wins the whole session object. Safe for additive use (different sessions on each device survive the merge). Lossy for concurrent edits to the exact same session on two devices at once — an unlikely edge case for a personal app.

---

### localStorage key reference

```
lifehex_sessions        → Session[]
lifehex_day_records     → DayRecord[]
lifehex_cycles          → CycleEntry[]
lifehex_settings        → Settings
lifehexConnected        → 'true' | 'false'  (Drive connection state)
lifehex_last_synced     → ISO timestamp of last successful Drive write
```

---

**Sync triggers summary:**
- App load → silent token refresh → fetch + merge + write
- Every lock event → `scheduleSave()` (3s debounce)
- Every checklist item check → `scheduleSave()` (3s debounce)
- Every cycle log (period start/end) → `scheduleSave()` (3s debounce)
- Every settings change → `scheduleSave()` (3s debounce)
- Manual sync button in Settings → immediate fetch + merge + write (no debounce)

> ⚠️ **Claude Code note:** Store credentials in `.env` as `VITE_GOOGLE_CLIENT_ID` and `VITE_GOOGLE_API_KEY`. Never hardcode. Add `.env` to `.gitignore`. Provide `.env.example` with placeholder values. The OAuth flow must use `window.open` (popup), not a redirect, to avoid losing app state on mobile browsers.

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