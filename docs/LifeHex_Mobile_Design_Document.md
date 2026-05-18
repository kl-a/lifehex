# LifeHex Mobile — Lightweight Input Companion
## Design Document v1.0

---

## Overview

LifeHex Mobile is a **browser-based mobile companion** to the LifeHex desktop app. It is input-only by design — its sole job is to let you log your state quickly while you're away from your desk, then get out of your way.

It reads from and writes to the **exact same Google Drive JSON files** as the desktop app (`lifehex-data.json`). No separate data model. No separate sync. Whatever you log on mobile appears on desktop the next time desktop loads, via the same last-write-wins merge strategy.

**Design philosophy:** One screen. No navigation. No charts. Open, adjust, lock, close. The whole interaction should take under 20 seconds.

---

## Tech Stack

Identical to the desktop app — same repo, separate route or subdomain.

| Layer | Choice |
|---|---|
| Framework | React + Vite + TypeScript |
| Styling | Tailwind CSS + same pixel CSS conventions |
| State | Zustand (shared stores with desktop where possible) |
| Sync | Google Drive API — same `driveSync.ts` utility, same file |
| Fonts | Press Start 2P + Nunito (same as desktop) |
| Deployment | Same GitHub Pages repo, served at `/mobile` path or `m.lifehex` subdomain |

> ⚠️ **Claude Code note:** The mobile app should live in the same Vite project as the desktop app. Route it via React Router: `<Route path="/mobile" element={<MobileApp />} />`. Do not create a separate repository. All shared utilities (`driveSync.ts`, `regulationScore.ts`, `cyclePredictor.ts`, `types/index.ts`) are imported directly — no duplication.

> ⚠️ **Claude Code note:** As always, run all installs from inside the project directory. No global npm installs.

---

## Colour Palette

Identical to desktop. No new colours.

| Name | Hex |
|---|---|
| Night Sky | `#1a1a2e` |
| Deep Indigo | `#16213e` |
| Soft Lilac | `#c9b8f0` |
| Lilac Shadow | `#7a6fa0` |
| Blush Pink | `#f7cac9` |
| Blush Shadow | `#c98a88` |
| Mint Green | `#b5ead7` |
| Mint Shadow | `#6aab90` |
| Butter Yellow | `#ffeaa7` |
| Butter Shadow | `#c9a84c` |
| Cloud White | `#fdfcff` |
| Muted Purple | `#9b89c4` |
| Star Gold | `#ffe066` |
| Pixel Black | `#2d2b3d` |

---

## Typography

Same as desktop:
- **Press Start 2P** — UI chrome, labels, buttons. Min 10px. 8px for badges only.
- **Nunito** — body text, descriptions, notes. 400 / 700 only.

---

## Single-Screen Layout

The mobile app is **one screen**. There is no navigation bar. There are no tabs. Everything is on one scrollable page, ordered by priority — the most important inputs at the top, the optional ones at the bottom.

Viewport: 390px wide (iPhone 14 / Pixel 7 baseline). The page scrolls vertically. The lock button is **fixed** at the bottom of the screen so it's always reachable.

```
┌─────────────────────────────┐  390px
│  STATUS BAR                 │  ~56px  cycle countdown + zone badge
├─────────────────────────────┤
│  LOCK TOGGLE                │  ~48px  padlock + "locked/unlocked" label
├─────────────────────────────┤
│                             │
│  MOOD SLIDER                │  ~96px  horizontal, emoji thumb
│  ENERGY SLIDER              │  ~96px
│  REGULATION SLIDER          │  ~96px
│                             │
├─────────────────────────────┤
│  QUICK CHECKLIST            │  ~auto  large tap targets
│  □ Medication  □ Breakfast  │
│  □ Lunch  □ Dinner          │
│  □ Gym  □ Alone time        │
├─────────────────────────────┤
│  ▶ PHYSICAL SYMPTOMS        │  ~auto  collapsed, tap to expand
│  ▶ WHEEL OF LIFE            │  ~auto  collapsed, tap to expand
├─────────────────────────────┤
│  [  L O C K  ]              │  56px   fixed bottom, full width
└─────────────────────────────┘
```

---

## Component Specs

### 1. Status Bar (top, always visible)

Full-width card. Two pieces of information side by side.

**Left side — cycle countdown:**

| State | Display | Style |
|---|---|---|
| > 12 days until period | `🌙 14d to period` | Soft Lilac text, Nunito 13px |
| ≤ 12 days until period | `⚠️ 4d to period` | Blush Pink text, Press Start 2P 10px, Blush Shadow border on the whole status bar |
| Period in progress | `🔴 Period day 3` | Blush Pink text, Press Start 2P 10px |
| Luteal phase (days 17–27) | `🌙 Luteal · 4d to period` | Butter Yellow text, Press Start 2P 10px, Butter Shadow border on status bar |

The ≤12 day warning is intentionally loud — it should catch your eye when you open the app so you're not caught off guard.

**Right side — zone badge:**

Same zone badge logic as desktop but compact:
- `● GREEN` / `● AMBER` / `● RED` in Press Start 2P 8px
- Badge pill with zone colour background
- In amber/red: a one-line reason in Nunito 10px below the pill (`low energy · luteal`)
- Tapping the badge opens the override bottom sheet (same 3-button sheet as desktop)

**Status bar background:**
- Default: Deep Indigo `#16213e`
- Luteal warning: `rgba(255,234,167,0.12)` tint + `border-bottom: 2px solid #c9a84c`
- Period / ≤12d warning: `rgba(247,202,201,0.12)` tint + `border-bottom: 2px solid #c98a88`

---

### 2. Lock Toggle

A single row centred on screen. Padlock icon + label.

- **Locked:** padlock icon Muted Purple, label "Locked · {HH:MM}" in Nunito 12px
- **Unlocked:** padlock icon Mint Green with pulse animation, label "Unlocked — adjusting" in Nunito 12px Mint Green
- Tap to toggle
- When locking: brief haptic-style visual flash (the whole screen flashes a single frame of Mint Green `rgba(181,234,215,0.15)`) to confirm the save

The lock button at the bottom of the screen is the **primary action** — the toggle row up top is a secondary status indicator. Both tap to lock/unlock.

---

### 3. Mood / Energy / Regulation Sliders

Three **horizontal** sliders stacked vertically. On mobile, horizontal sliders are far more comfortable than vertical — thumb swipe left/right is natural.

Each slider:

```
MOOD
😶  ─────────●──────  6
```

- Label: Press Start 2P 10px, Cloud White, above-left
- Track: `height: 6px`, Deep Indigo bg, `border: 1px solid #9b89c4`, `border-radius: 3px`
- Thumb: emoji, `font-size: 22px`, positioned above the track centre point
- Value: Nunito Bold 16px, right-aligned, in the metric's colour (Star Gold / Mint Green / Soft Lilac)
- Track fill: coloured from left edge to thumb position in the metric's colour at 40% opacity
- Snaps to integers 1–10
- Touch target: full row height ~72px (label + slider + value), not just the 6px track — the whole row is the drag surface

**Emoji sets (same as desktop):**

| Slider | 1–2 | 3–4 | 5–6 | 7–8 | 9–10 |
|---|---|---|---|---|---|
| Mood | 😫 | 🙁 | 😶 | 😄 | 😆 |
| Energy | 🪫 | 🪫 | 😐 | ⚡ | ⚡ |
| Regulation | 🌋 | 😤 | 😤 | 🧘 | 🧘 |

**Disabled state (locked):** all three sliders `opacity: 0.45`, pointer-events none, track fill desaturated.

**Pre-fill on unlock:** all three sliders pre-fill from the most recent saved session, exactly as desktop.

**Gap between sliders:** `20px`. Each slider group (`label + track + value`) has `padding: 12px 16px` horizontal padding.

---

### 4. Quick Checklist

Six large tap targets in a **2×3 grid**. No timestamps shown inline on mobile — timestamps are still logged and stored, just not displayed to keep the UI clean.

```
┌─────────────────┬─────────────────┐
│  💊 Medication  │  🍳 Breakfast   │
│  REST DAY       │  ✓              │
├─────────────────┼─────────────────┤
│  🍱 Lunch       │  🍽 Dinner      │
│                 │                 │
├─────────────────┼─────────────────┤
│  🏋️ Gym         │  🔇 Alone time  │
│                 │                 │
└─────────────────┴─────────────────┘
```

Each cell:
- `height: 64px`, full cell is tappable
- Emoji + label in Nunito Bold 13px
- **Unchecked:** Deep Indigo bg, `border: 1px solid #9b89c4/50`, `border-radius: 4px`
- **Checked:** Mint Green bg `rgba(181,234,215,0.2)`, `border: 1px solid #6aab90`, checkmark `✓` in Mint Green top-right corner
- **Medication on weekend:** greyed out, "REST DAY" label in Muted Purple 8px, not tappable
- **Meal cells:** tapping a checked meal cell opens a minimal bottom sheet with just two things — a "proper break?" toggle and a one-line note field. No expand/collapse in the grid itself.
- Grid padding: `16px` horizontal, `8px` gap between cells

The checklist is **not gated by lock state** — same as desktop. You can check items any time.

---

### 5. Physical Symptoms (collapsed by default)

A collapsible row. Collapsed state shows logged symptoms inline:

```
▶ PHYSICAL SYMPTOMS  fatigue · headache
```
or
```
▶ PHYSICAL SYMPTOMS  optional
```

Tapping expands to show:

**Symptom chips** — full-width wrapping grid of tappable chips:
`fatigue` / `bloating` / `breast tenderness` / `headache` / `nausea` / `cramps`

Chips: `height: 36px`, `padding: 0 12px`, `border-radius: 4px`. Unchecked: Muted Purple border. Checked: Blush Pink bg + Blush Shadow border.

**"That wasn't me" flag** — below the chips, a single wide button:
```
┌─────────────────────────────┐
│  😶 "That wasn't me" today  │
│  [ No ]    [ Yes + note ]   │
└─────────────────────────────┘
```

"Yes" opens a single-line text input bottom sheet for a brief note.

**Brain fog / working memory / focus** — three optional small toggles below the "that wasn't me" row, rendered as compact yes/no chips:
```
Brain fog  [ Low · Med · High ]
Working memory  [ Fine · Struggling ]
```

These are low-priority optional fields — they live at the bottom of the expanded section.

---

### 6. Wheel of Life (collapsed by default)

A collapsible row, lowest priority. Collapsed state:

```
▶ WHEEL OF LIFE  H8 M5 Re8 F7 W8 C3 Rs7 N8
```

Shows the current scores as a compact inline summary so you can see at a glance if anything is way off — without needing to expand.

Tapping expands to show a simplified radar interaction — **not the full SVG drag radar**. Instead, 8 compact slider rows, one per dimension, stacked vertically:

```
HEALTH      ────────●──  8
MENTAL      ─────●─────  5
RELATE      ────────●──  8
...
```

Same horizontal slider style as the mood/energy/regulation sliders but with Soft Lilac as the track fill colour for all 8. No drag handles, no SVG geometry — just 8 simple range inputs.

These are also **not gated by lock state** in terms of visibility, but they only commit to the saved session on lock (same as the sliders).

**Adds/Detracts reference** — not shown on mobile. Too much content for a quick-input context. Users can check the desktop app for the reference chips.

---

### 7. Lock Button (fixed bottom)

A full-width fixed button at the very bottom of the screen. Always visible regardless of scroll position.

**Unlocked state:**
```
┌─────────────────────────────┐
│    🔒  LOCK & SAVE          │  Mint Green bg, Mint Shadow border
└─────────────────────────────┘
```

**Locked state:**
```
┌─────────────────────────────┐
│    🔓  UNLOCK TO ADJUST     │  Muted Purple bg, Lilac Shadow border
└─────────────────────────────┘
```

- Height: `56px`, full viewport width, `border-radius: 0` (flush with screen edges)
- Press Start 2P 10px label
- On lock: visual flash confirmation (full-screen Mint Green overlay at `opacity: 0.15` for 300ms, Framer Motion `animate={{ opacity: [0, 0.15, 0] }}`)
- `padding-bottom: env(safe-area-inset-bottom)` to handle iPhone home bar notch

---

## Interaction Flow

```
1. User opens /mobile in browser
2. App loads → silent Google Drive token refresh
3. If connected: fetches + merges latest data (same driveSync.ts logic)
4. App renders with LOCKED state, pre-filled from most recent session
5. User sees current zone + cycle countdown at a glance
6. If state looks right → done (no action needed)
7. If updating → tap UNLOCK TO ADJUST
8. Sliders animate to active state (Framer Motion opacity 0.45 → 1.0, 200ms)
9. User swipes sliders, taps checklist items
10. Taps LOCK & SAVE
11. Flash confirmation
12. New session written to localStorage + Drive (3s debounce)
13. User closes browser tab
```

Total interaction time for a quick check-in: **~15 seconds**.

---

## Google Drive Sync

Identical to desktop. Same file (`lifehex-data.json`), same merge function, same `driveSync.ts`.

On mobile, sync is triggered:
- On app load (silent token refresh, no popup)
- On every lock event (3-second debounce)

If Drive is not connected (first use on mobile), a banner appears below the status bar:

```
┌─────────────────────────────────────┐
│  Connect Google Drive to sync data  │
│  [ Connect ]              [ Skip ]  │
└─────────────────────────────────────┘
```

"Skip" allows offline-only use. Data is saved to localStorage only. On next load, the banner reappears.

> ⚠️ **Claude Code note:** The OAuth flow on mobile must use a popup window (`window.open`), not a redirect, to avoid losing mobile browser state. The same `VITE_GOOGLE_CLIENT_ID` env variable is used — no separate credentials needed.

---

## Empty / First-Use States

**No sessions ever logged:** All sliders pre-fill at 5. Zone badge shows `● —` in Muted Purple. Cycle countdown shows `🌙 Set up cycle →` which links to the desktop `/cycle` page.

**No Drive connection:** Offline-only mode. Data accumulates in localStorage. Banner persists until connected.

**Offline (no network):** App still works fully. localStorage is source of truth. Sync runs next time there's connectivity and the app is opened.

---

## URL Structure

```
/mobile                    # main mobile app (Today input)
```

No sub-routes on mobile. The desktop app lives at `/` (or `/today`, `/calendar`, etc.). The mobile companion is a single URL.

A small "Open desktop →" link sits at the very top of the page in Nunito 11px Muted Purple, right-aligned, for when you want to switch to full view.

---

## CSS / Layout Notes

```css
/* Mobile page container */
.mobile-app {
  width: 100%;
  max-width: 480px;        /* caps on wider phones / tablets */
  margin: 0 auto;
  min-height: 100dvh;      /* dvh handles mobile browser chrome */
  background: #1a1a2e;
  display: flex;
  flex-direction: column;
  padding-bottom: 72px;    /* clear the fixed lock button */
}

/* Fixed lock button */
.lock-button-fixed {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  height: 56px;
  padding-bottom: env(safe-area-inset-bottom);
}

/* Horizontal slider touch target */
.slider-row {
  padding: 12px 16px;
  min-height: 72px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  touch-action: pan-y;     /* allow vertical scroll but capture horizontal drag */
}

/* Checklist grid */
.checklist-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 0 16px;
}
```

**`touch-action: pan-y`** on slider rows is critical — without it, horizontal swipes on sliders will conflict with vertical page scroll on iOS and Android. Each slider row captures horizontal touch, the page scrolls on vertical touch.

**`min-height: 100dvh`** (dynamic viewport height) accounts for the collapsible browser chrome bar on mobile Chrome and Safari. Using `100vh` causes a jump when the address bar hides — `dvh` fixes this.

---

## Pixel Art Conventions (mobile)

Same rules as desktop, with two mobile-specific adjustments:

1. **No dithered texture backgrounds** on mobile — the subtle SVG checkerboard pattern adds rendering overhead on lower-end phones. Flat Night Sky only.
2. **Hard shadows reduced to 2px** on mobile (vs 4px desktop) — smaller screen means shadows that feel proportional at 4px on desktop feel heavy at mobile scale.

Everything else identical: no gradients, hard pixel borders, Press Start 2P chrome, Nunito body.

---

## Out of Scope for Mobile v1

- Any charts or historical data views
- Calendar view
- Cycle screen / phase ring
- Dashboard
- Settings (use desktop settings)
- Period logging (log period start/end on desktop)
- Routine banners (morning/lunch/bedtime prompts)
- Push notifications (browser-only, same constraint as desktop)
- Native app / PWA install prompt (future scope — `// TODO: add PWA manifest and service worker`)
