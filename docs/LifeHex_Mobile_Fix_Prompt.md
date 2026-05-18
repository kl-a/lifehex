# Claude Code Prompt — Selene Mobile UI Fix

The mobile companion app has been scaffolded but has significant visual and layout issues compared to the design document. Please fix all of the following. Do not change any data logic, sync logic, or state management — only fix the visual presentation and layout.

---

## 1. Typography — apply the correct fonts everywhere

The app must use exactly two fonts and nothing else:
- **Press Start 2P** (Google Fonts) — all UI chrome: section labels (MOOD, ENERGY, REGULATION, PHYSICAL SYMPTOMS, WHEEL OF LIFE), the lock toggle label, the lock button label, the zone badge text, the checklist item labels, badge counters. Minimum 10px. Use 8px only for sub-labels like "REST DAY" or "optional".
- **Nunito** — all body/descriptive text: the "Open desktop →" link, the Google Drive banner text, the zone reason line, timestamps, meal note fields. Weight 400 for body, 700 for emphasis only.

Currently the app appears to be using a system sans-serif font for labels. Replace all of these with the correct font. Make sure both fonts are imported in `index.html` via:
```html
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Nunito:wght@400;700&display=swap" rel="stylesheet">
```

---

## 2. Colour — fix every element against the palette

The only permitted colours are from this palette. No greys, no default browser colours, no off-palette values:

| Token | Hex |
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

Specific fixes needed:
- Page background must be Night Sky `#1a1a2e`
- All card/section backgrounds must be Deep Indigo `#16213e`
- All borders must use Muted Purple `#9b89c4` at full or reduced opacity — no default grey borders
- Section labels (MOOD, ENERGY, REGULATION) must be Muted Purple `#9b89c4`, not the current off-white
- Score values (the "5" next to each slider label) must be coloured per metric: Mood = Star Gold `#ffe066`, Energy = Mint Green `#b5ead7`, Regulation = Soft Lilac `#c9b8f0`
- The lock toggle row background should be Deep Indigo, not black/near-black
- The "UNLOCK TO ADJUST" fixed button must be Muted Purple bg `#9b89c4` with `box-shadow: 3px 3px 0px #7a6fa0` when locked; Mint Green bg `#b5ead7` with `box-shadow: 3px 3px 0px #6aab90` when unlocked
- The zone badge (currently showing AMBER) needs: Butter Yellow `#ffeaa7` background at 20% opacity, `border: 2px solid #c9a84c`, zone dot `●` in `#c9a84c`, label in Press Start 2P 8px Cloud White
- The Google Drive connect banner: Deep Indigo bg, `border: 2px solid #9b89c4`, Connect button in Soft Lilac bg with Lilac Shadow `box-shadow: 3px 3px 0px #7a6fa0`, Skip button in Deep Indigo bg with Muted Purple border

---

## 3. Hard pixel shadows — add to every elevated element

This app uses **hard drop shadows only** — no `blur`, no `drop-shadow` filters, no `box-shadow` with blur radius. Every card, button, and badge must have a hard offset shadow:

```css
/* Card/section panels */
box-shadow: 4px 4px 0px #7a6fa0;  /* Lilac Shadow */

/* Buttons (default) */
box-shadow: 3px 3px 0px <shadow-colour-matching-fill>;

/* Pressed/active button */
transform: translate(2px, 2px);
box-shadow: 1px 1px 0px <shadow-colour-matching-fill>;

/* Zone badge (amber) */
box-shadow: 3px 3px 0px #c9a84c;

/* Zone badge (green) */
box-shadow: 3px 3px 0px #6aab90;

/* Zone badge (red) */
box-shadow: 3px 3px 0px #c98a88;
```

Currently no shadows are visible anywhere. Add them to: the status bar card, the lock toggle row, every checklist cell, the physical symptoms row, the wheel of life row, the fixed lock button, the Google Drive banner.

---

## 4. Slider visual fixes

The sliders are mostly correct in layout but need these fixes:

**Track styling:**
```css
/* Remove default browser slider appearance entirely */
input[type=range] {
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  background: #16213e;
  border: 1px solid #9b89c4;
  border-radius: 3px;
  width: 100%;
}

/* Thumb — hide the default, we use an emoji positioned absolutely above it */
input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 2px;
  height: 18px;
  background: transparent;
}
```

**Track fill:** Add a coloured fill from left edge to the thumb position using a CSS linear-gradient on the track background, updated via inline style on every value change:
```javascript
// In the slider onChange handler, update the track fill:
const pct = ((value - 1) / 9) * 100;
// For mood (Star Gold):
trackStyle = `linear-gradient(to right, #ffe066 ${pct}%, #16213e ${pct}%)`
// For energy (Mint Green):
trackStyle = `linear-gradient(to right, #b5ead7 ${pct}%, #16213e ${pct}%)`
// For regulation (Soft Lilac):
trackStyle = `linear-gradient(to right, #c9b8f0 ${pct}%, #16213e ${pct}%)`
```

**Emoji thumb position:** The emoji must appear centred **above** the track at the correct horizontal position. Use a `position: relative` wrapper div. The emoji is `position: absolute`, `top: -28px`, `left: calc(${pct}% - 11px)` (11px = half emoji width at 22px font size). Add `transition: left 80ms ease` for smooth movement.

**Disabled state:** When session is locked, all three slider rows must be `opacity: 0.45` and `pointer-events: none`. Currently they appear fully active even when locked.

**Touch target:** The entire slider row (label + track + value) must be at least 72px tall. The drag surface must be the full row width, not just the narrow track. Set `touch-action: pan-y` on the slider row container to prevent conflict with page scroll.

---

## 5. Checklist cell fixes

The cells are roughly the right size but need these visual fixes:

**Unchecked state:**
```css
background: #16213e;
border: 2px solid rgba(155, 137, 196, 0.5);
border-radius: 4px;
box-shadow: 3px 3px 0px #7a6fa0;
min-height: 64px;
display: flex;
align-items: center;
gap: 10px;
padding: 0 14px;
```

**Checked state:**
```css
background: rgba(181, 234, 215, 0.15);
border: 2px solid #6aab90;
box-shadow: 3px 3px 0px #6aab90;
```
Add a `✓` checkmark in Mint Green `#b5ead7` in the top-right corner of checked cells (position: absolute, top: 6px, right: 8px, font-size: 12px).

**Emoji size:** The emoji in each cell should be `font-size: 20px`, not the current larger size that makes the cells feel heavy.

**Label font:** Press Start 2P 10px, Cloud White `#fdfcff`. Currently appears to be a system font.

**Medication REST DAY state:** When it's a weekend, the cell should be `opacity: 0.4`, `pointer-events: none`, and show "REST DAY" in Press Start 2P 8px Muted Purple below the label.

---

## 6. Status bar fixes

The status bar is currently two separate disconnected elements. It should be a single full-width card:

```
┌─────────────────────────────────────────┐
│  🌙 Set up cycle →    │  ● AMBER        │
│                       │  no medication  │
└─────────────────────────────────────────┘
```

- Single card, `background: #16213e`, `border: 2px solid #9b89c4`, `border-radius: 4px`, `box-shadow: 4px 4px 0px #7a6fa0`
- Left side: cycle info in Nunito 13px Soft Lilac. "Set up cycle →" is a link that opens the desktop app in a new tab (`window.open('/cycle', '_blank')`)
- Right side: zone badge — pill with zone-coloured background, `● ZONE` in Press Start 2P 8px, reason line in Nunito 10px below if amber/red
- The two sides are `display: flex; justify-content: space-between; align-items: center; padding: 12px 16px`

**When luteal warning (days 17–27):** card background shifts to `rgba(255,234,167,0.1)`, border becomes `2px solid #c9a84c`
**When ≤12 days to period:** card background shifts to `rgba(247,202,201,0.1)`, border becomes `2px solid #c98a88`, cycle text switches to Press Start 2P 10px Blush Pink

---

## 7. Lock toggle row fixes

Currently showing as a very dark flat row. Fix:

- Background: Deep Indigo `#16213e`
- `border: 2px solid #9b89c4`
- `border-radius: 4px`
- `box-shadow: 4px 4px 0px #7a6fa0`
- `padding: 12px 16px`
- `display: flex; align-items: center; justify-content: center; gap: 10px`
- Padlock icon: 20px, Muted Purple when locked / Mint Green when unlocked
- Label: Press Start 2P 10px — "Locked · {HH:MM}" in Muted Purple when locked, "Unlocked — adjusting" in Mint Green when unlocked
- When unlocked: add a Framer Motion `scale: [1, 1.04, 1]` pulse loop on the padlock icon (`repeat: Infinity, duration: 2`)

---

## 8. Fixed lock button fixes

The "UNLOCK TO ADJUST" / "LOCK & SAVE" fixed button at the bottom needs:

- `position: fixed; bottom: 0; left: 0; right: 0`
- `height: 56px`
- `padding-bottom: env(safe-area-inset-bottom)`
- `border-radius: 0` — flush with screen bottom edges
- Label: Press Start 2P 10px

**Locked state (UNLOCK TO ADJUST):**
```css
background: #9b89c4;
color: #2d2b3d;
box-shadow: 0px -3px 0px #7a6fa0;  /* shadow on top edge only — reversed for bottom element */
```

**Unlocked state (LOCK & SAVE):**
```css
background: #b5ead7;
color: #2d2b3d;
box-shadow: 0px -3px 0px #6aab90;
```

On lock — trigger a Framer Motion full-screen flash overlay:
```jsx
<motion.div
  className="fixed inset-0 pointer-events-none z-50 bg-mint"
  animate={{ opacity: [0, 0.15, 0] }}
  transition={{ duration: 0.3 }}
  style={{ background: '#b5ead7' }}
/>
```

---

## 9. Collapsible section rows (Physical Symptoms, Wheel of Life)

These are currently rendering as flat text rows. Fix:

```css
background: #16213e;
border: 2px solid rgba(155,137,196,0.4);
border-radius: 4px;
box-shadow: 3px 3px 0px #7a6fa0;
padding: 14px 16px;
display: flex;
align-items: center;
gap: 10px;
```

- `▶` triangle in Muted Purple `#9b89c4`, rotates to `▼` when expanded (Framer Motion `rotate: 0 → 90`)
- Section label: Press Start 2P 10px Muted Purple
- Inline summary text (symptoms listed / wheel scores): Nunito 12px Muted Purple, right-aligned

When expanded, content slides down via Framer Motion `height: 0 → auto` animation (use `AnimatePresence` + `motion.div` with `initial={{ height: 0, opacity: 0 }}` / `animate={{ height: 'auto', opacity: 1 }}`).

---

## 10. Google Drive banner fixes

The banner is currently using a large primary button style that looks too heavy. Fix:

- Banner card: `background: #16213e`, `border: 2px solid #9b89c4`, `border-radius: 4px`, `box-shadow: 4px 4px 0px #7a6fa0`, `padding: 14px 16px`
- Banner text: Nunito 13px Cloud White — "Connect Google Drive to sync your data"
- Two buttons side by side:
  - Connect: `background: #c9b8f0`, `border: 2px solid #7a6fa0`, `box-shadow: 3px 3px 0px #7a6fa0`, Press Start 2P 9px Pixel Black label
  - Skip: `background: transparent`, `border: 2px solid #9b89c4`, Press Start 2P 9px Muted Purple label
- Buttons have pressed state: `transform: translate(2px, 2px)`, `box-shadow: 1px 1px 0px <shadow>`

---

## 11. Page spacing and container

- Page background: Night Sky `#1a1a2e` — solid, no texture on mobile
- All section cards have `margin: 0 16px` horizontal — no edge-to-edge cards except the fixed bottom button
- Gap between sections: `10px`
- `padding-bottom: 72px` on the scrollable container to clear the fixed button
- `max-width: 480px; margin: 0 auto` on the outer container so it centres on wider phones
- Use `min-height: 100dvh` (not `100vh`) to handle mobile browser chrome correctly

---

## Summary of what NOT to change

- All data logic, Zustand store reads/writes
- The Google Drive sync mechanism
- The lock/unlock session logic
- The regulation score calculation
- All TypeScript interfaces and data models
- The slider value ranges (1–10) and emoji mappings
- The checklist item list and their logged fields

Only the visual presentation needs to change.
