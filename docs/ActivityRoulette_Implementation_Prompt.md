# Claude Code Prompt — Activity Roulette Feature

Add a new "Activity Roulette" feature to the LifeHex app. This is a self-contained feature that sits inside the Wheel of Life card on the Today screen. It randomly surfaces one actionable activity aligned to one of the 8 life dimensions.

---

## What to build

A roulette button inside the Wheel of Life card on the Today screen. When pressed, it draws a random activity from `roulette_activities.json` and displays it as a card. The user can re-spin for a different activity or dismiss it.

---

## Files to create

### 1. `src/data/roulette_activities.json`
Copy the contents of the provided `roulette_activities.json` file exactly into this path. Import it as a static JSON module — do not fetch it at runtime.

```typescript
import activities from '../data/roulette_activities.json';
```

### 2. `src/components/ActivityRoulette.tsx`
The full roulette component. Spec below.

---

## Component spec — `ActivityRoulette.tsx`

### Props
```typescript
interface ActivityRouletteProps {
  // Optional: bias the spin toward a specific dimension (e.g. the lowest scoring one)
  // If not provided, all 8 dimensions are equally weighted
  lowestDimension?: keyof DimensionScores | null;
}
```

### State
```typescript
const [result, setResult] = useState<RouletteResult | null>(null);
const [isSpinning, setIsSpinning] = useState(false);
const [dismissed, setDismissed] = useState(false);

interface RouletteResult {
  dimensionKey: string;
  dimensionLabel: string;
  colour: string;
  activity: string;
}
```

### Spin logic

```typescript
function spin(bias?: string | null): RouletteResult {
  const dims = activities.dimensions;
  const keys = Object.keys(dims);

  // If a bias dimension is provided, give it a 40% chance
  // Otherwise pick uniformly at random
  let chosenKey: string;
  if (bias && dims[bias as keyof typeof dims] && Math.random() < 0.4) {
    chosenKey = bias;
  } else {
    chosenKey = keys[Math.floor(Math.random() * keys.length)];
  }

  const dim = dims[chosenKey as keyof typeof dims];
  const activityList = dim.activities;
  const activity = activityList[Math.floor(Math.random() * activityList.length)];

  return {
    dimensionKey: chosenKey,
    dimensionLabel: dim.label,
    colour: dim.colour,
    activity,
  };
}
```

### Spin animation

When the button is pressed:
1. Set `isSpinning: true`
2. Run a cycle through 9 random dimension labels using `setInterval` at 150ms intervals — this creates a slot-machine feel showing dimension names flashing before settling
3. After ~1350ms total, clear the interval, call `spin()` for the real result, set `isSpinning: false`, set `result`

```typescript
function handleSpin() {
  setIsSpinning(true);
  setDismissed(false);
  const keys = Object.keys(activities.dimensions);
  let count = 0;
  const interval = setInterval(() => {
    // Flash a random dimension label during spin — purely visual
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    setResult({
      dimensionKey: randomKey,
      dimensionLabel: activities.dimensions[randomKey as keyof typeof activities.dimensions].label,
      colour: activities.dimensions[randomKey as keyof typeof activities.dimensions].colour,
      activity: '...',
    });
    count++;
    if (count >= 9) {
      clearInterval(interval);
      setResult(spin(lowestDimension));
      setIsSpinning(false);
    }
  }, 150);
}
```

### Rendered UI

**Default state (no result yet):**
```
┌─────────────────────────────────────────┐
│  🎲  SPIN FOR AN ACTIVITY               │
│  Press to get something to do right now │
└─────────────────────────────────────────┘
```

A single button. Full width of wherever it's placed. Press Start 2P 8px label. Deep Indigo bg, `border: 2px solid #9b89c4`, `box-shadow: 3px 3px 0px #7a6fa0`. On hover: `box-shadow: 1px 1px 0px #7a6fa0; transform: translate(2px, 2px)`.

**Spinning state:**
The button is replaced by a result card that flashes through dimension names rapidly. Show the dimension label in Press Start 2P 10px in the dimension's colour. The activity text shows `...` during spin.

**Result state:**

```
┌─────────────────────────────────────────────┐
│  ✦ HEALTH & BODY                        ↺ ✕ │  ← dimension label (colour) | respin | dismiss
│                                             │
│  "Go for a walk with no podcast, no music,  │
│   no destination. Just look at things."     │
│                                             │
└─────────────────────────────────────────────┘
```

- Card background: `rgba(<dimension colour at 15% opacity>)`
- `border: 2px solid <dimension colour>`
- `box-shadow: 4px 4px 0px <dimension shadow colour>` — use the nearest `-Shadow` palette colour to the dimension colour
- Dimension label: Press Start 2P 8px in the dimension's colour. A small `✦` pixel star prefix.
- Activity text: Nunito 15px, `font-weight: 700`, Cloud White `#fdfcff`. Line height 1.5. This is the hero text — give it breathing room with `padding: 14px 0`.
- **↺ respin button:** small, top-right of card. Press Start 2P 8px Muted Purple. Calls `handleSpin()` again.
- **✕ dismiss button:** small, top-right next to respin. Sets `dismissed: true` which returns to the default button state.
- Animate in with Framer Motion: `initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}`

**Shadow colour mapping** (use the closest palette shadow for each dimension):

| Dimension colour | Shadow to use |
|---|---|
| `#b5ead7` (Mint Green) | `#6aab90` (Mint Shadow) |
| `#c9b8f0` (Soft Lilac) | `#7a6fa0` (Lilac Shadow) |
| `#ffeaa7` (Butter Yellow) | `#c9a84c` (Butter Shadow) |
| `#ffb7b2` (Peach) | `#c98a88` (Blush Shadow) |
| `#f7cac9` (Blush Pink) | `#c98a88` (Blush Shadow) |
| `#ffe066` (Star Gold) | `#c9a84c` (Butter Shadow) |

---

## Where to place it in Today screen

Inside the **Wheel of Life card** (left column), below the dimension legend row and above the STATE TODAY timeline section. Separate it from the legend with a `1px solid rgba(155,137,196,0.2)` divider.

In `WheelOfLifeCard.tsx` (or equivalent), import and render:

```tsx
import ActivityRoulette from './ActivityRoulette';

// After the legend row:
<div className="border-t border-muted-purple/20 pt-3 mt-3">
  <ActivityRoulette lowestDimension={lowestDimensionKey} />
</div>
```

Pass `lowestDimensionKey` as the bias — this is whichever of the 8 dimensions currently has the lowest score. Calculate it from the current session's `DimensionScores`:

```typescript
const lowestDimensionKey = Object.entries(dimensions)
  .sort(([, a], [, b]) => a - b)[0]?.[0] ?? null;
```

This means the spin is softly nudged toward the dimension that needs the most attention — not forced, just weighted at 40%.

---

## What NOT to change

- Do not modify the lock/unlock session logic
- Do not modify the Drive sync logic
- Do not add roulette results to any stored data model — this feature is ephemeral, display-only
- Do not add a new tab or route for this feature — it lives inside the existing Wheel of Life card only
- Do not install any new dependencies — this uses only React state, Framer Motion (already installed), and the static JSON file

---

## Acceptance criteria

- [ ] Pressing the button triggers the slot-machine animation (dimension labels flash for ~600ms)
- [ ] A result card appears showing the dimension name in its colour and the activity text
- [ ] The ↺ button respins with a new animation
- [ ] The ✕ button returns to the default button state
- [ ] On mobile (`/mobile` route), the component also renders correctly — it should be responsive and work at 390px width
- [ ] The bias toward the lowest dimension is applied (40% weight) but not guaranteed — spinning multiple times will show variety
- [ ] No console errors relating to the JSON import
