// Today + Calendar screens

// ─────────────────────────────────────────────────────────────
// Today
// ─────────────────────────────────────────────────────────────
function TodayScreen({
  locked, setLocked, dimensions, setDimension, mood, setMood,
  sessionTags, toggleTag, lastSavedISO, phaseInfo, periodLen, goCycle,
  onAxisTap, sessions,
}) {
  const dateLabel = new Date(TODAY).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
  const time = new Date(TODAY).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false });
  const lastSavedLabel = lastSavedISO
    ? new Date(lastSavedISO).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false })
    : null;

  const todaysSessions = sessions.filter(s => s.timestamp.slice(0, 10) === isoDate(new Date(TODAY)));
  return (
    <React.Fragment>
      {/* 3-col header: title | lock toggle | date+time */}
      <div className="page-head" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 16 }}>
        <div>
          <div className="title">Today</div>
          <div className="crumbs" style={{ marginTop: 4 }}>How are you right now?</div>
        </div>

        {/* Compact lock toggle */}
        <button
          onClick={setLocked}
          className={`pbtn ${locked ? 'ghost' : 'mint'} ${!locked ? 'lock-pulse' : ''}`}
          style={{ flexDirection: 'column', alignItems: 'center', gap: 3, padding: '8px 14px', lineHeight: 1 }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <PadlockSVG locked={locked} />
            <span style={{ fontSize: 12, fontWeight: 700 }}>{locked ? 'Locked' : 'Open'}</span>
          </span>
          {lastSavedLabel && (
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-soft)', opacity: 0.8 }}>
              saved {lastSavedLabel}
            </span>
          )}
        </button>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{dateLabel}</div>
          <div style={{ color: 'var(--butter-yellow)', marginTop: 4, fontSize: 14, fontWeight: 700 }}>{time}</div>
        </div>
      </div>

      <NewsTicker dimensions={dimensions} />
      <PeriodStrip phaseInfo={phaseInfo} periodLen={periodLen} onTap={goCycle} />

      {/* Wheel of Life — full width */}
      <div className="card indigo" style={{ padding: 18, marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span className="eyebrow gold">Wheel of Life</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-soft)' }}>
            {locked ? 'read-only' : 'drag to adjust'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <RadarChart values={dimensions} locked={locked} onAxisTap={onAxisTap} onChange={locked ? null : setDimension} />
          </div>
          <MoodSlider value={mood} onChange={setMood} disabled={locked} vertical />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-soft)', marginTop: 4 }}>
          {DIMENSIONS.map(d => (
            <span key={d.key}>{d.short} · <span style={{ color: 'var(--cloud-white)' }}>{dimensions[d.key]}</span></span>
          ))}
        </div>
      </div>

      {/* What Happened — full width, groups in columns */}
      <div style={{ marginTop: 16 }}>
        {!locked ? (
          <TagChips tags={TAGS} selected={sessionTags} onToggle={toggleTag} />
        ) : (
          <div className="card" style={{ background: 'transparent', border: '1.5px dashed var(--border)', boxShadow: 'none', color: 'var(--text-soft)', textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.5, marginBottom: 6 }}>Session Locked</div>
            <div className="body" style={{ fontSize: 12 }}>Unlock to add tags for the next snapshot.</div>
          </div>
        )}
      </div>

      {/* Today's Sessions — full width */}
      <div className="card indigo" style={{ marginTop: 16 }}>
        <div className="eyebrow gold" style={{ marginBottom: 10 }}>Today's Sessions</div>
        {todaysSessions.length === 0 ? (
          <div className="body" style={{ fontSize: 13, color: 'var(--text-soft)' }}>No locked sessions yet. Lock to save your first one.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {todaysSessions.map(s => {
              const t = new Date(s.timestamp).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false });
              return (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', background: 'rgba(155,137,196,0.08)',
                  border: '1px solid var(--border)', borderRadius: 10,
                }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--butter-yellow)', minWidth: 44 }}>{t}</span>
                  <span style={{ fontSize: 18 }}>{MOOD_EMOJI(s.mood)}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--cloud-white)' }}>{s.mood}/10</span>
                  <span style={{ flex: 1 }} />
                  {s.tags.slice(0, 4).map(tid => {
                    const tag = TAGS.find(t => t.id === tid);
                    return tag ? <span key={tid} title={tag.label}>{tag.em}</span> : null;
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </React.Fragment>
  );
}

// ─────────────────────────────────────────────────────────────
// Calendar
// ─────────────────────────────────────────────────────────────
function CalendarScreen({ sessions, monthOffset, setMonthOffset, cycleStartISO, cycleLen, periodLen, onDayTap }) {
  const today = new Date(TODAY);
  const target = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const monthName = target.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
  const firstDow = (target.getDay() + 6) % 7;
  const daysInMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();

  const byDate = {};
  for (const s of sessions) {
    const k = s.timestamp.slice(0, 10);
    (byDate[k] = byDate[k] || []).push(s);
  }

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push({ empty: true });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(target.getFullYear(), target.getMonth(), d) });
  }
  while (cells.length % 7 !== 0) cells.push({ empty: true });

  const monthSessions = sessions.filter(s => {
    const d = new Date(s.timestamp);
    return d.getMonth() === target.getMonth() && d.getFullYear() === target.getFullYear();
  });
  const monthAvg = monthSessions.length
    ? (monthSessions.reduce((a, b) => a + b.mood, 0) / monthSessions.length).toFixed(1)
    : '—';
  const daysLogged = new Set(monthSessions.map(s => s.timestamp.slice(0, 10))).size;

  return (
    <React.Fragment>
      <div className="page-head">
        <div>
          <div className="title">Calendar</div>
          <div className="crumbs" style={{ marginTop: 6 }}>Mood map · Moon phases</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="pbtn ghost" style={{ padding: '8px 14px' }} onClick={() => setMonthOffset(monthOffset - 1)}>‹</button>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--cloud-white)', minWidth: 160, textAlign: 'center' }}>
            {monthName}
          </span>
          <button
            className="pbtn ghost"
            style={{ padding: '8px 14px' }}
            disabled={monthOffset >= 0}
            onClick={() => setMonthOffset(monthOffset + 1)}
          >›</button>
        </div>
      </div>

      <div className="calendar-layout">
        {/* Calendar grid — full width */}
        <div>
          <div className="cal-grid" style={{ marginBottom: 6 }}>
            {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-soft)', padding: 6, letterSpacing: 0.4 }}>{d}</div>
            ))}
          </div>

          <div className="cal-grid">
            {cells.map((c, i) => {
              if (c.empty) return <div key={i} className="cal-cell empty" />;
              const iso = isoDate(c.date);
              const ss = byDate[iso] || [];
              const avg = ss.length ? ss.reduce((s, x) => s + x.mood, 0) / ss.length : null;
              const isToday = iso === isoDate(today);
              const isFuture = c.date > today;
              let bg = 'var(--deep-indigo)', border = 'var(--border)';
              if (avg !== null) {
                if (avg > 7) { bg = 'rgba(181,234,215,0.2)'; border = 'rgba(106,171,144,0.6)'; }
                else if (avg >= 4) { bg = 'rgba(255,234,167,0.2)'; border = 'rgba(201,168,76,0.6)'; }
                else { bg = 'rgba(247,202,201,0.2)'; border = 'rgba(201,138,136,0.6)'; }
              }
              const phaseInfo = getCyclePhase(cycleStartISO, cycleLen, periodLen, c.date);
              return (
                <div
                  key={i}
                  className={`cal-cell ${isToday ? 'today' : ''}`}
                  style={{
                    background: isFuture ? 'rgba(22,21,46,0.5)' : bg,
                    border: `1px solid ${border}`,
                    opacity: isFuture ? 0.5 : 1,
                    cursor: !isFuture ? 'pointer' : 'default',
                  }}
                  onClick={() => { if (!isFuture) onDayTap(iso, ss, phaseInfo.phase); }}
                >
                  <span className="daynum">{c.date.getDate()}</span>
                  {avg !== null && <span className="mini-mood">{MOOD_EMOJI(Math.round(avg))}</span>}
                  {ss.length > 0 && <span className="dot" />}
                  <span className="moon"><MoonIcon phase={phaseInfo.phase} size={18} ghost={isFuture} /></span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats row — below calendar */}
        <div className="calendar-stats-row">
          <div className="card indigo">
            <div className="eyebrow gold" style={{ marginBottom: 14 }}>Month at a Glance</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--butter-yellow)' }}>{monthAvg}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-soft)', marginTop: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Avg Mood</div>
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--mint-green)' }}>{daysLogged}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-soft)', marginTop: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Days Logged</div>
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--blush-pink)' }}>{monthSessions.length}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-soft)', marginTop: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Sessions</div>
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--soft-lilac)' }}>
                  {monthSessions.length ? Math.max(...monthSessions.map(s => s.mood)) : '—'}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-soft)', marginTop: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Peak Mood</div>
              </div>
            </div>
          </div>

          <div className="card indigo">
            <div className="eyebrow gold" style={{ marginBottom: 14 }}>Legend</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <LegendRow color="rgba(106,171,144,0.8)" bg="rgba(181,234,215,0.2)" label="Mood &gt; 7" sub="great day" />
              <LegendRow color="rgba(201,168,76,0.8)" bg="rgba(255,234,167,0.2)" label="Mood 4 – 7" sub="middling" />
              <LegendRow color="rgba(201,138,136,0.8)" bg="rgba(247,202,201,0.2)" label="Mood &lt; 4" sub="rough" />
              <LegendRow color="var(--soft-lilac)" bg="rgba(201,184,240,0.1)" label="Today" sub="lilac border" />
            </div>
            <div className="eyebrow gold" style={{ margin: '16px 0 10px' }}>Moon Phases</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {['menstrual','follicular','ovulation','luteal'].map(p => (
                <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MoonIcon phase={p} size={18} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--cloud-white)' }}>
                    {PHASE_COLOR[p].label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

function LegendRow({ color, bg, label, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ width: 18, height: 18, background: bg, border: `2px solid ${color}`, flexShrink: 0, borderRadius: 4, display: 'inline-block' }} />
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cloud-white)' }} dangerouslySetInnerHTML={{ __html: label }} />
        <div style={{ fontSize: 11, color: 'var(--text-soft)', marginTop: 2 }}>{sub}</div>
      </div>
    </div>
  );
}

Object.assign(window, { TodayScreen, CalendarScreen });
