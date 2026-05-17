// Period strip + lock toggle + mood slider + tag chips + news ticker

function PeriodStrip({ phaseInfo, periodLen, onTap }) {
  const { phase, cyclePos, totalLen } = phaseInfo;
  const c = PHASE_COLOR[phase];
  const daysUntilNext = totalLen - cyclePos;
  const subline = phase === 'menstrual'
    ? `Period in progress · day ${cyclePos} of ${periodLen}`
    : `Next period in ${daysUntilNext} day${daysUntilNext === 1 ? '' : 's'}`;

  // Compute dates for each phase boundary from current cycle start
  const today = new Date(TODAY);
  const cycleStart = new Date(today);
  cycleStart.setDate(today.getDate() - (cyclePos - 1));
  const addD = (base, n) => { const d = new Date(base); d.setDate(d.getDate() + n); return d; };
  const fmt = (d) => d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });

  const ovulationDay = Math.floor(totalLen / 2) - 1;
  const lutealDay = Math.floor(totalLen / 2) + 1;
  const boundaries = [
    { pct: 0,                                      label: 'M', date: fmt(cycleStart) },
    { pct: (periodLen / totalLen) * 100,            label: 'F', date: fmt(addD(cycleStart, periodLen)) },
    { pct: (ovulationDay / totalLen) * 100,         label: 'O', date: fmt(addD(cycleStart, ovulationDay)) },
    { pct: (lutealDay / totalLen) * 100,            label: 'L', date: fmt(addD(cycleStart, lutealDay)) },
    { pct: 100,                                     label: '',  date: fmt(addD(cycleStart, totalLen)) },
  ];

  return (
    <div
      onClick={onTap}
      style={{
        background: `${c.bg}22`,
        border: `1.5px solid ${c.shadow}66`,
        borderRadius: 14,
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
        padding: '14px 18px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <MoonIcon phase={phase} size={28} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: c.bg, letterSpacing: 0.4 }}>
            {c.label} · Day {cyclePos}
          </div>
          <div style={{ fontSize: 13, color: 'var(--cloud-white)', marginTop: 4, opacity: 0.8 }}>
            {subline}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="phase-bar-wrap">
          <div className="phase-bar">
            <div className="seg" style={{ left: 0, width: `${(periodLen / totalLen) * 100}%`, background: '#f7cac9' }} />
            <div className="seg" style={{ left: `${(periodLen / totalLen) * 100}%`, width: `${((ovulationDay - periodLen) / totalLen) * 100}%`, background: '#b5ead7' }} />
            <div className="seg" style={{ left: `${(ovulationDay / totalLen) * 100}%`, width: `${(2 / totalLen) * 100}%`, background: '#ffeaa7' }} />
            <div className="seg" style={{ left: `${(lutealDay / totalLen) * 100}%`, right: 0, background: '#c9b8f0' }} />
          </div>
          <div className="marker" style={{ left: `calc(${(cyclePos / totalLen) * 100}% - 1.5px)` }} />
        </div>

        {/* Phase boundary dates */}
        <div style={{ position: 'relative', height: 28, marginTop: 4 }}>
          {boundaries.map((b, i) => {
            const isFirst = i === 0;
            const isLast = i === boundaries.length - 1;
            return (
              <div key={b.label + b.date} style={{
                position: 'absolute',
                left: isLast ? 'auto' : `${b.pct}%`,
                right: isLast ? 0 : 'auto',
                transform: isFirst ? 'none' : isLast ? 'none' : 'translateX(-50%)',
                textAlign: isFirst ? 'left' : isLast ? 'right' : 'center',
                fontSize: 9,
                fontWeight: 700,
                color: 'var(--cloud-white)',
                opacity: 0.5,
                lineHeight: 1.4,
                letterSpacing: 0.3,
              }}>
                {b.label && <div style={{ textTransform: 'uppercase' }}>{b.label}</div>}
                <div>{b.date}</div>
              </div>
            );
          })}
        </div>
      </div>

      <span style={{ fontSize: 18, color: 'var(--cloud-white)', opacity: 0.5, flexShrink: 0 }}>›</span>
    </div>
  );
}

function PadlockSVG({ locked, size = 16 }) {
  const c = locked ? '#9b89c4' : '#b5ead7';
  const h = Math.round(size * 18 / 16);
  return (
    <svg width={size} height={h} viewBox="0 0 16 18" fill="none">
      {locked ? (
        <path d="M4 8 V5.5 a4 4 0 0 1 8 0 V8" stroke={c} strokeWidth="2" strokeLinecap="round" />
      ) : (
        <path d="M4 8 V5.5 a4 4 0 0 1 7.5 -1.5" stroke={c} strokeWidth="2" strokeLinecap="round" />
      )}
      <rect x="2" y="8" width="12" height="9" rx="2.5" fill={c} />
      <rect x="7" y="11" width="2" height="3" rx="1" fill="#0f0f1a" />
    </svg>
  );
}

function LockToggle({ locked, onToggle, lastSavedISO }) {
  const lastSavedLabel = lastSavedISO
    ? new Date(lastSavedISO).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false })
    : null;
  return (
    <div className="card indigo" style={{
      display: 'flex', alignItems: 'center', gap: 18,
      padding: '14px 18px',
    }}>
      <button
        onClick={onToggle}
        className={`pbtn ${locked ? 'ghost' : 'mint'} ${!locked ? 'lock-pulse' : ''}`}
        style={{ minWidth: 200, justifyContent: 'center', padding: '12px 18px' }}
      >
        <PadlockSVG locked={locked} />
        <span>{locked ? 'Unlock Session' : 'Lock & Save'}</span>
      </button>
      <div style={{ flex: 1 }}>
        <div className="eyebrow" style={{ color: locked ? 'var(--text-soft)' : 'var(--mint-green)' }}>
          {locked ? 'Session Locked' : 'Session Open'}
        </div>
        <div style={{ fontSize: 13, color: 'var(--cloud-white)', marginTop: 4, opacity: 0.8 }}>
          {locked
            ? <>All inputs read-only. {lastSavedLabel && <>Last saved <strong style={{ color: 'var(--butter-yellow)' }}>{lastSavedLabel}</strong>.</>}</>
            : <>Adjust your radar, mood and tags. Lock to snapshot your state.</>
          }
        </div>
      </div>
    </div>
  );
}

function MoodSlider({ value, onChange, disabled, vertical = false }) {
  const pct = ((value - 1) / 9) * 100;

  if (vertical) {
    const TRACK_H = 240;
    // writing-mode: vertical-lr puts min at top, then scaleY(-1) flips visually.
    // Thumb DOM center from top (before flip) = 11 + pct/100 * 218
    // After flip, visual center from top = 240 - (11 + pct/100 * 218) = 229 - pct/100 * 218
    // Emoji top (center 20px emoji on thumb visual center) = that - 10
    const emojiTop = Math.round(219 - (pct / 100) * 218);

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0,
        opacity: disabled ? 0.65 : 1,
        userSelect: 'none',
        flexShrink: 0,
        padding: '4px 6px 4px 0',
      }}>
        <div className="eyebrow gold" style={{ marginBottom: 6 }}>Mood</div>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--butter-yellow)', marginBottom: 4 }}>10</span>

        {/* Track + emoji wrapper */}
        <div style={{ position: 'relative', width: 44, height: TRACK_H }}>
          {/* Emoji tracks the thumb on the left side */}
          <span style={{
            position: 'absolute',
            top: emojiTop,
            left: 2,
            fontSize: 18,
            lineHeight: 1,
            pointerEvents: 'none',
            transition: 'top 60ms ease',
          }}>{MOOD_EMOJI(value)}</span>
          {/* Vertical track — positioned at right of wrapper */}
          <input
            type="range" min="1" max="10" step="1"
            className="pixslider-vert"
            value={value}
            disabled={disabled}
            style={{ position: 'absolute', right: 0, top: 0 }}
            onChange={(e) => onChange(parseInt(e.target.value, 10))}
          />
        </div>

        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-soft)', marginTop: 4 }}>1</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--butter-yellow)', marginTop: 6 }}>{value}</span>
      </div>
    );
  }

  // Horizontal (used elsewhere if needed)
  const emojiLeft = `calc(${pct}% - ${(22 * pct / 100).toFixed(1)}px + 11px)`;
  return (
    <div className="card indigo" style={{ opacity: disabled ? 0.65 : 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span className="eyebrow gold">Mood</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--butter-yellow)' }}>{value}/10</span>
      </div>
      <div style={{ position: 'relative', paddingTop: 30 }}>
        <span style={{
          position: 'absolute',
          top: 0,
          left: emojiLeft,
          fontSize: 22,
          lineHeight: 1,
          pointerEvents: 'none',
          userSelect: 'none',
          transition: 'left 60ms ease',
        }}>{MOOD_EMOJI(value)}</span>
        <input
          type="range" min="1" max="10" step="1"
          className="pixslider"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: 'var(--text-soft)', marginTop: 6 }}>
        <span>awful</span><span>okay</span><span>great</span>
      </div>
    </div>
  );
}

const TAG_GROUP_ORDER = ['Body', 'Creative', 'Social', 'Work', 'Rest', 'Mind', 'Life'];

function TagChips({ tags, selected, onToggle }) {
  const grouped = TAG_GROUP_ORDER.map(g => ({
    group: g,
    tags: tags.filter(t => t.group === g),
  })).filter(g => g.tags.length > 0);

  return (
    <div className="card indigo">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span className="eyebrow gold">What happened?</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-soft)' }}>
          {selected.length} selected
        </span>
      </div>
      {/* CSS multi-column: browser packs groups into 3 cols, max ~7 tags each */}
      <div style={{ columns: 3, columnGap: '24px' }}>
        {grouped.map(g => (
          <div key={g.group} style={{
            breakInside: 'avoid',
            WebkitColumnBreakInside: 'avoid',
            marginBottom: 18,
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: 'var(--text-soft)',
              textTransform: 'uppercase', letterSpacing: 0.8,
              paddingBottom: 5, marginBottom: 8,
              borderBottom: '1px solid var(--border)',
            }}>
              {g.group}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {g.tags.map(t => (
                <button
                  key={t.id}
                  className={`chip ${selected.includes(t.id) ? 'on' : ''}`}
                  onClick={() => onToggle(t.id)}
                  style={{ font: 'inherit', width: '100%', justifyContent: 'flex-start' }}
                >
                  <span className="em">{t.em}</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewsTicker({ dimensions }) {
  const items = DIMENSIONS.flatMap(d => {
    const val = dimensions[d.key];
    if (val >= 7) return [{ text: `${d.label}: Stable`, color: '#86efac' }];
    if (val >= 4)  return d.adds.slice(0, 2).map(a => ({ text: `${d.label}: ${a}`, color: '#fcd34d' }));
    return         d.adds.slice(0, 2).map(a => ({ text: `${d.label}: ${a}`, color: '#f87171' }));
  });

  const SEP = <span style={{ color: 'rgba(155,137,196,0.35)', padding: '0 20px' }}>·</span>;

  const renderCopy = (prefix) => items.map((item, i) => (
    <React.Fragment key={`${prefix}-${i}`}>
      <span style={{ fontSize: 12, fontWeight: 700, color: item.color }}>{item.text}</span>
      {SEP}
    </React.Fragment>
  ));

  return (
    <div className="ticker-wrap" style={{ marginBottom: 16 }}>
      <span className="ticker-inner">
        {renderCopy('a')}
        {renderCopy('b')}
      </span>
    </div>
  );
}

Object.assign(window, { PeriodStrip, PadlockSVG, LockToggle, MoodSlider, TagChips, NewsTicker });
