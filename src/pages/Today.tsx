import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PadlockIcon } from '../components/PadlockIcon';
import { PeriodStrip } from '../components/PeriodStrip';
import { RadarChart } from '../components/RadarChart';
import { MoodSlider } from '../components/MoodSlider';
import { TagChips } from '../components/TagChips';
import { NewsTicker } from '../components/NewsTicker';
import { DIMENSIONS, MOOD_EMOJI, TAGS } from '../data/constants';
import { useSessionStore } from '../store/sessionStore';
import { useHistoryStore } from '../store/historyStore';
import type { Dimension, DimensionScores, PhaseInfo, Session } from '../types';
import { isoDate } from '../utils/cyclePredictor';
import { v4 as uuid } from 'uuid';

interface Props {
  phaseInfo: PhaseInfo;
  periodLen: number;
  goCycle: () => void;
}

interface DimPanelProps {
  dim: Dimension;
  dimensions: DimensionScores;
  onClose: () => void;
}

function DimPanel({ dim, dimensions, onClose }: DimPanelProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-star-gold">{dim.short}</div>
          <div className="text-lg font-bold text-cloud-white mt-0.5">{dim.label}</div>
        </div>
        <button
          onClick={onClose}
          className="text-muted-purple hover:text-cloud-white transition-colors text-xl leading-none"
        >×</button>
      </div>

      <p className="text-sm text-muted-purple leading-relaxed">{dim.desc}</p>

      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-mint-green mb-2">Adds</div>
        <ul className="flex flex-col gap-1.5">
          {dim.adds.map((a) => (
            <li key={a} className="flex items-start gap-2 text-xs text-cloud-white/80">
              <span className="text-mint-green flex-shrink-0 mt-0.5">+</span>
              <span>{a}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-blush-pink mb-2">Detracts</div>
        <ul className="flex flex-col gap-1.5">
          {dim.detracts.map((d) => (
            <li key={d} className="flex items-start gap-2 text-xs text-cloud-white/80">
              <span className="text-blush-pink flex-shrink-0 mt-0.5">−</span>
              <span>{d}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const TL_W = 400;
const TL_H = 100;
const TL_PAD = { l: 4, r: 4, t: 6, b: 6 };
const TL_PLOT_W = TL_W - TL_PAD.l - TL_PAD.r;
const TL_PLOT_H = TL_H - TL_PAD.t - TL_PAD.b;
const TL_MID_Y = TL_PAD.t + TL_PLOT_H / 2;
const TL_START_H = 8;
const TL_END_H = 26; // 2am next day
const TL_RANGE_MS = (TL_END_H - TL_START_H) * 60 * 60 * 1000;

function tlMoodY(mood: number) {
  return TL_PAD.t + ((10 - mood) / 10) * TL_PLOT_H;
}

const TL_BAR_W = 6;
const TL_Y_LABEL_W = 20; // px width reserved for y-axis labels
const TL_Y_MARKS = [10, 7, 5, 3, 1];
const TL_X_HOURS = [8, 11, 14, 17, 20, 23, 26]; // every 3h, 8am–2am

function tlXtoSvg(h: number) {
  return TL_PAD.l + ((h - TL_START_H) / (TL_END_H - TL_START_H)) * TL_PLOT_W;
}

function tlFormatHour(h: number) {
  const a = h % 24;
  if (a === 0) return '12am';
  if (a === 12) return '12pm';
  return a < 12 ? `${a}am` : `${a - 12}pm`;
}

function MoodTimeline({ sessions }: { sessions: Session[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverPt, setHoverPt] = useState<{ x: number; y: number; mood: number; time: string } | null>(null);

  const now = new Date();
  const windowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), TL_START_H).getTime();

  const pts = sessions.map((s) => {
    const t = new Date(s.timestamp).getTime();
    const x = TL_PAD.l + Math.max(0, Math.min(1, (t - windowStart) / TL_RANGE_MS)) * TL_PLOT_W;
    const y = tlMoodY(s.mood);
    const time = new Date(s.timestamp).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false });
    return { x, y, mood: s.mood, time };
  });

  const linePath = pts.length > 1
    ? 'M ' + pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')
    : null;

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = containerRef.current;
    if (!el || pts.length === 0) return;
    const rect = el.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * TL_W;
    let nearest = pts[0];
    let minDist = Infinity;
    for (const p of pts) {
      const d = Math.abs(p.x - svgX);
      if (d < minDist) { minDist = d; nearest = p; }
    }
    setHoverPt(nearest);
  }

  return (
    <div className="w-full">
      <div className="flex" style={{ gap: 4 }}>
        {/* Y-axis labels (HTML, no SVG stretch issues) */}
        <div className="relative flex-shrink-0" style={{ width: TL_Y_LABEL_W, height: TL_H }}>
          {TL_Y_MARKS.map((m) => (
            <span key={m} style={{
              position: 'absolute',
              right: 2,
              top: `${(tlMoodY(m) / TL_H) * 100}%`,
              transform: 'translateY(-50%)',
              fontSize: 9,
              fontWeight: 700,
              fontFamily: 'Nunito, sans-serif',
              color: m === 5 ? 'rgba(155,137,196,0.85)' : 'rgba(155,137,196,0.45)',
            }}>{m}</span>
          ))}
        </div>

        {/* Chart */}
        {sessions.length === 0 ? (
          <div className="flex-1 flex items-center text-[10px] text-muted-purple/60">No sessions yet</div>
        ) : (
          <div
            ref={containerRef}
            style={{ flex: 1, height: TL_H, position: 'relative' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverPt(null)}
          >
            <svg
              viewBox={`0 0 ${TL_W} ${TL_H}`}
              preserveAspectRatio="none"
              style={{ width: '100%', height: '100%', display: 'block' }}
            >
              {/* Y gridlines */}
              {TL_Y_MARKS.map((m) => {
                const y = tlMoodY(m);
                return (
                  <line key={m}
                    x1={TL_PAD.l} y1={y} x2={TL_W - TL_PAD.r} y2={y}
                    stroke="#9b89c4"
                    strokeOpacity={m === 5 ? 0.45 : 0.18}
                    strokeWidth={m === 5 ? 1 : 0.6}
                    strokeDasharray={m === 5 ? '4,3' : '2,4'}
                  />
                );
              })}

              {/* X gridlines (inner ticks only) */}
              {TL_X_HOURS.slice(1, -1).map((h) => {
                const x = tlXtoSvg(h);
                return (
                  <line key={h}
                    x1={x} y1={TL_PAD.t} x2={x} y2={TL_H - TL_PAD.b}
                    stroke="#9b89c4" strokeOpacity={0.15} strokeWidth={0.6}
                  />
                );
              })}

              {/* Histogram bars */}
              {pts.map((p, i) => {
                const above = p.y <= TL_MID_Y;
                return (
                  <rect key={i}
                    x={p.x - TL_BAR_W / 2} y={above ? p.y : TL_MID_Y}
                    width={TL_BAR_W} height={Math.max(2, Math.abs(TL_MID_Y - p.y))}
                    fill={above ? 'rgba(181,234,215,0.55)' : 'rgba(247,202,201,0.55)'}
                    stroke={above ? '#6aab90' : '#c98a88'} strokeWidth="0.5"
                  />
                );
              })}

              {/* Connecting line */}
              {linePath && (
                <path d={linePath} fill="none" stroke="#ffe066" strokeWidth="1.5"
                  strokeLinejoin="round" strokeLinecap="round" />
              )}

              {/* Dots */}
              {pts.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="3" fill="#ffe066" stroke="#16213e" strokeWidth="1" />
              ))}

              {/* Hover crosshair */}
              {hoverPt && (
                <line x1={hoverPt.x} y1={TL_PAD.t} x2={hoverPt.x} y2={TL_H - TL_PAD.b}
                  stroke="#ffe066" strokeOpacity={0.5} strokeWidth={0.8} strokeDasharray="2,2" />
              )}
            </svg>

            {/* Hover tooltip */}
            {hoverPt && (
              <div style={{
                position: 'absolute',
                top: -26,
                left: `${(hoverPt.x / TL_W) * 100}%`,
                transform: 'translateX(-50%)',
                pointerEvents: 'none',
                zIndex: 10,
              }}
                className="bg-deep-indigo border border-muted-purple/50 rounded px-2 py-0.5 text-[9px] font-bold text-star-gold whitespace-nowrap"
              >
                {hoverPt.mood}/10 · {hoverPt.time}
              </div>
            )}
          </div>
        )}
      </div>

      {/* X-axis time labels (HTML) */}
      <div className="relative mt-1" style={{ marginLeft: TL_Y_LABEL_W + 4, height: 14 }}>
        {TL_X_HOURS.map((h, i) => {
          const pct = ((h - TL_START_H) / (TL_END_H - TL_START_H)) * 100;
          const isFirst = i === 0;
          const isLast = i === TL_X_HOURS.length - 1;
          return (
            <span key={h} style={{
              position: 'absolute',
              left: `${pct}%`,
              transform: isFirst ? 'none' : isLast ? 'translateX(-100%)' : 'translateX(-50%)',
              fontSize: 10,
              fontWeight: 600,
              fontFamily: 'Nunito, sans-serif',
              color: 'rgba(155,137,196,0.6)',
            }}>{tlFormatHour(h)}</span>
          );
        })}
      </div>
    </div>
  );
}

export function Today({ phaseInfo, periodLen, goCycle }: Props) {
  const { locked, dimensions, mood, tags, lastSavedISO, unlock, lock, setDimension, setMood, toggleTag } = useSessionStore();
  const { sessions, addSession, removeSession, updateSession } = useHistoryStore();
  const [activeDimKey, setActiveDimKey] = useState<keyof DimensionScores | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editMood, setEditMood] = useState(5);
  const [editTags, setEditTags] = useState<string[]>([]);

  function startEdit(s: typeof sessions[number]) {
    setEditingSessionId(s.id);
    setEditMood(s.mood);
    setEditTags([...(s.tags ?? [])]);
  }

  function saveEdit() {
    if (!editingSessionId) return;
    updateSession(editingSessionId, { mood: editMood, tags: editTags });
    setEditingSessionId(null);
  }

  function toggleEditTag(id: string) {
    setEditTags((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]);
  }

  const now = new Date();
  const dateLabel = now.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' });
  const time = now.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false });
  const lastSavedLabel = lastSavedISO
    ? new Date(lastSavedISO).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false })
    : null;

  const todaySessions = sessions.filter((s) => s.timestamp.slice(0, 10) === isoDate(now));
  const activeDim = activeDimKey ? DIMENSIONS.find((d) => d.key === activeDimKey) ?? null : null;

  function handleAxisTap(key: keyof DimensionScores) {
    setActiveDimKey((prev) => (prev === key ? null : key));
  }

  function handleToggleLock() {
    if (locked) {
      const lastSession = sessions[sessions.length - 1];
      unlock(lastSession?.dimensions ?? dimensions, lastSession?.mood ?? mood);
    } else {
      const newSession = {
        id: uuid(),
        timestamp: new Date().toISOString(),
        dimensions: { ...dimensions },
        mood,
        tags: [...tags],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      addSession(newSession);
      useSessionStore.setState({ lastSavedISO: newSession.timestamp });
      lock();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header — grid so lock button is always truly centred */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center">
        <div>
          <h1 className="text-3xl font-bold text-cloud-white tracking-tight">Today</h1>
          <p className="text-sm text-muted-purple mt-0.5">{dateLabel}</p>
        </div>

        <button
          onClick={handleToggleLock}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full border transition-all font-semibold text-sm ${
            locked
              ? 'border-muted-purple/40 text-muted-purple hover:border-muted-purple/70'
              : 'border-mint-shadow/50 text-mint-green bg-mint-green/5'
          }`}
        >
          <PadlockIcon locked={locked} size={14} />
          <span>{locked ? 'Locked' : 'Open — tap to save'}</span>
          {lastSavedLabel && (
            <span className="text-[11px] text-muted-purple ml-1">· saved {lastSavedLabel}</span>
          )}
        </button>

        <div className="flex justify-end text-xl font-bold text-star-gold">{time}</div>
      </div>

      <NewsTicker dimensions={dimensions} />
      <PeriodStrip phaseInfo={phaseInfo} periodLen={periodLen} onTap={goCycle} />

      {/* Main: 3-column on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px_1fr] gap-4 items-start">

        {/* Left: Dimension info panel (desktop only) */}
        <div className="hidden lg:block">
          <AnimatePresence mode="wait">
            {activeDim ? (
              <motion.div
                key={activeDim.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.18 }}
                className="card-indigo"
              >
                <DimPanel
                  dim={activeDim}
                  dimensions={dimensions}
                  onClose={() => setActiveDimKey(null)}
                />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="card-indigo text-center py-10"
              >
                <div className="text-muted-purple/40 text-sm">Tap a dimension<br />to see its details</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Center: Wheel of Life */}
        <div className="card-indigo">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-star-gold">Wheel of Life</span>
            <span className="text-xs text-muted-purple">tap axis to {locked ? 'inspect' : 'adjust'}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <RadarChart values={dimensions} locked={locked} onAxisTap={handleAxisTap} onChange={locked ? undefined : setDimension} activeKey={activeDimKey} />
            </div>
            <MoodSlider value={mood} onChange={setMood} disabled={locked} />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center mt-3">
            {DIMENSIONS.map((d) => (
              <span key={d.key} className="text-xs text-muted-purple">
                {d.short} <span className="text-cloud-white font-bold">{dimensions[d.key]}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Right: Tags + Sessions */}
        <div className="flex flex-col gap-4">
          <AnimatePresence>
            {!locked && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <TagChips selected={tags} onToggle={toggleTag} />
              </motion.div>
            )}
          </AnimatePresence>
          {locked && (
            <div className="card-indigo">
              <div className="text-[11px] font-bold uppercase tracking-widest text-star-gold mb-3">Mood Today</div>
              <MoodTimeline sessions={todaySessions} />
            </div>
          )}

          <div className="card-indigo">
            <div className="text-[11px] font-bold uppercase tracking-widest text-star-gold mb-3">
              Today's Sessions
            </div>
            {todaySessions.length === 0 ? (
              <div className="text-sm text-muted-purple">No sessions yet. Open → adjust → save.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {todaySessions.map((s) => {
                  const t = new Date(s.timestamp).toLocaleTimeString('en-AU', {
                    hour: '2-digit', minute: '2-digit', hour12: false,
                  });
                  const isEditing = editingSessionId === s.id;
                  const tagObjs = (s.tags ?? [])
                    .map((tid) => TAGS.find((tg) => tg.id === tid))
                    .filter(Boolean);

                  return (
                    <div
                      key={s.id}
                      className={`flex flex-col gap-1.5 px-3 py-2.5 rounded-xl border transition-colors ${
                        isEditing
                          ? 'border-star-gold/30 bg-star-gold/5'
                          : 'border-muted-purple/15 bg-muted-purple/5 cursor-pointer hover:border-muted-purple/30'
                      }`}
                      onClick={() => !isEditing && startEdit(s)}
                    >
                      {/* Summary row */}
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-star-gold w-10 flex-shrink-0">{t}</span>
                        <span className="text-lg leading-none">{MOOD_EMOJI(isEditing ? editMood : s.mood)}</span>
                        <span className="text-sm font-bold text-cloud-white">{isEditing ? editMood : s.mood}/10</span>
                        <span className="flex-1" />
                        {!isEditing && (
                          <button
                            onClick={(e) => { e.stopPropagation(); removeSession(s.id); }}
                            className="text-muted-purple/40 hover:text-blush-pink transition-colors text-xs px-2 py-0.5 rounded border border-transparent hover:border-blush-pink/30"
                            title="Delete session"
                          >✕</button>
                        )}
                      </div>

                      {/* View mode: tags */}
                      {!isEditing && tagObjs.length > 0 && (
                        <div className="flex flex-wrap gap-1 pl-[52px]">
                          {tagObjs.map((tag) => tag && (
                            <span key={tag.id} className="flex items-center gap-1 text-[11px] text-muted-purple bg-muted-purple/10 px-2 py-0.5 rounded-full border border-muted-purple/20">
                              <span>{tag.em}</span>
                              <span>{tag.label}</span>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Edit mode */}
                      {isEditing && (
                        <div className="flex flex-col gap-3 pt-1" onClick={(e) => e.stopPropagation()}>
                          {/* Mood slider */}
                          <div>
                            <div className="flex justify-between text-xs text-muted-purple mb-1.5">
                              <span>Mood</span>
                              <span className="text-cloud-white font-bold">{editMood}/10</span>
                            </div>
                            <input
                              type="range" min={1} max={10}
                              value={editMood}
                              onChange={(e) => setEditMood(Number(e.target.value))}
                              className="pixslider w-full"
                            />
                          </div>

                          {/* Tag chips */}
                          <div>
                            <div className="text-xs text-muted-purple mb-2">Tags</div>
                            <div className="flex flex-wrap gap-1.5">
                              {TAGS.map((tag) => (
                                <button
                                  key={tag.id}
                                  onClick={() => toggleEditTag(tag.id)}
                                  className={`chip ${editTags.includes(tag.id) ? 'chip-on' : ''}`}
                                >
                                  <span className="text-base leading-none">{tag.em}</span>
                                  <span className="font-body text-[11px] font-semibold">{tag.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => setEditingSessionId(null)}
                              className="btn-ghost text-xs px-3 py-1.5"
                            >Cancel</button>
                            <button
                              onClick={saveEdit}
                              className="btn-butter text-xs px-3 py-1.5"
                            >Save</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile dim card — fixed centered overlay (< lg) */}
      <AnimatePresence>
        {activeDim && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="lg:hidden fixed inset-0 z-40 flex items-center justify-center p-6"
            style={{ background: 'rgba(26,26,46,0.85)', backdropFilter: 'blur(4px)' }}
            onClick={() => setActiveDimKey(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.18 }}
              className="card-indigo w-full max-w-sm max-h-[70vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <DimPanel
                dim={activeDim}
                dimensions={dimensions}
                onClose={() => setActiveDimKey(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
