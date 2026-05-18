# Selene

A personal wellness tracker for the browser. Tracks daily mood, energy, life balance, menstrual cycle phases, and ADHD/PMDD symptom patterns — all in one full-viewport dashboard.

Built for personal use. No backend, no accounts, no data leaves your browser unless you export it.

---

## Features

### Today Screen
- **Wheel-of-life radar** — 8 dimensions (Emotional, Physical, Mental, Social, Work, Creative, Spiritual, Rest), drag or tap spokes to set scores
- **Vertical state sliders** — Energy level and nervous system regulation, with emoji markers that track your position
- **Lock / unlock sessions** — Capture point-in-time mood snapshots throughout the day; the radar locks between sessions to preserve each reading
- **Mood timeline** — Scatter plot of all today's sessions from 8am to midnight
- **Daily checklist** — Log medication, meals, gym, alone time, and sleep with timestamps; pencil button to edit when each item was logged
- **Guided routine cards** — Morning, lunch, and bedtime routines triggered by emoji buttons or auto-shown at configurable times

### Cycle Tracker
- **Phase strip** — Visual bar showing menstrual → follicular → ovulation → luteal phases with boundary dates
- **10-day warning zone** — Amber segment with pink protruding border marks the high-stress pre-period window
- **Cycle settings** — Configurable cycle length (21–35 days) and period duration (3–8 days)

### Dashboard
- Mood trends and session history over time

### Calendar
- Day-by-day view of past records

### Settings
- Cycle length and period duration sliders
- Export all data as JSON (sessions, daily records, cycle history, settings)
- Google Drive sync (scaffolded, coming soon)

---

## Tech Stack

| | |
|---|---|
| Framework | React 19 + Vite + TypeScript |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Charts | Custom SVG radar + Recharts |
| State | Zustand with localStorage persistence |
| Fonts | Press Start 2P + Nunito |

---

## Data & Privacy

Everything is stored in your browser's `localStorage`. Nothing is sent to a server. Five stores are persisted:

| Key | Contents |
|---|---|
| `selene_sessions` | All mood session snapshots |
| `selene_day` | Today's live daily record |
| `selene_day_history` | Archived daily records (rolled over at midnight) |
| `selene_cycles` | Cycle history |
| `selene_settings` | Cycle length, period duration, routine times |

Use **Settings → Export data** to download a full JSON backup at any time.

---

## Running Locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

```bash
npm run build   # production build
npm run preview # preview the production build
```

---

## Layout

Selene is a full-viewport desktop browser app — not a mobile app. The Today screen uses a 3-column grid that fills the entire browser window with no page-level scroll. Tablet (≥768px) is supported; mobile degrades gracefully.
