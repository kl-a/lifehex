// Cycle + Dashboard + Settings

// ─────────────────────────────────────────────────────────────
// Cycle
// ─────────────────────────────────────────────────────────────
function CycleScreen({ cycleLog, cycleLen, periodLen, setCycleLen, setPeriodLen, onLogStart, onLogEnd }) {
  const today = new Date(TODAY);
  const startISO = cycleLog.length ? cycleLog[0].start : isoDate(today);
  const phaseInfo = getCyclePhase(startISO, cycleLen, periodLen, today);
  const periodActive = cycleLog.length > 0 && !cycleLog[0].end;

  const size = 360, cx = size / 2, cy = size / 2, R = size / 2 - 16, r = R - 42;
  const total = cycleLen;
  const arcs = [
    { from: 1, to: periodLen, color: '#f7cac9', stroke: '#c98a88', key: 'menstrual' },
    { from: periodLen + 1, to: total / 2 - 1, color: '#b5ead7', stroke: '#6aab90', key: 'follicular' },
    { from: total / 2 - 1, to: total / 2 + 1, color: '#ffeaa7', stroke: '#c9a84c', key: 'ovulation' },
    { from: total / 2 + 1, to: total, color: '#c9b8f0', stroke: '#7a6fa0', key: 'luteal' },
  ];
  const dayAngle = (d) => -Math.PI / 2 + ((d - 1) / total) * 2 * Math.PI;
  const arcPath = (start, end, rad) => {
    const a0 = dayAngle(start), a1 = dayAngle(end);
    const x0 = cx + Math.cos(a0) * rad, y0 = cy + Math.sin(a0) * rad;
    const x1 = cx + Math.cos(a1) * rad, y1 = cy + Math.sin(a1) * rad;
    const large = (end - start) / total > 0.5 ? 1 : 0;
    return { x0, y0, x1, y1, large };
  };
  const ringPath = (a) => {
    const o = arcPath(a.from, a.to, R);
    const i = arcPath(a.to, a.from, r);
    return `M ${o.x0} ${o.y0} A ${R} ${R} 0 ${o.large} 1 ${o.x1} ${o.y1} L ${i.x0} ${i.y0} A ${r} ${r} 0 ${o.large} 0 ${i.x1} ${i.y1} Z`;
  };
  const markerAngle = dayAngle(phaseInfo.cyclePos);
  const mx = cx + Math.cos(markerAngle) * ((R + r) / 2);
  const my = cy + Math.sin(markerAngle) * ((R + r) / 2);

  return (
    <React.Fragment>
      <div className="page-head">
        <div>
          <div className="title">Cycle</div>
          <div className="crumbs" style={{ marginTop: 6 }}>{PHASE_COLOR[phaseInfo.phase].label} · Day {phaseInfo.cyclePos} of {total}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Next Period</div>
          <div style={{ color: 'var(--butter-yellow)', marginTop: 6, fontSize: 15, fontWeight: 700 }}>
            {phaseInfo.phase === 'menstrual' ? 'In progress' : `In ${total - phaseInfo.cyclePos} days`}
          </div>
        </div>
      </div>

      <div className="cycle-grid">
        <div className="card indigo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 22 }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} shapeRendering="geometricPrecision" style={{ maxWidth: '100%', height: 'auto' }}>
            {arcs.map((a) => (
              <path
                key={a.key}
                d={ringPath(a)}
                fill={a.color}
                stroke={a.stroke}
                strokeWidth="1.5"
                opacity={phaseInfo.phase === a.key ? 1 : 0.45}
              />
            ))}
            {/* Day ticks */}
            {Array.from({ length: total }).map((_, i) => {
              const ang = dayAngle(i + 1);
              const x1 = cx + Math.cos(ang) * R;
              const y1 = cy + Math.sin(ang) * R;
              const x2 = cx + Math.cos(ang) * (R - 5);
              const y2 = cy + Math.sin(ang) * (R - 5);
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(22,33,62,0.8)" strokeWidth="1" />;
            })}
            {/* Day markers inside hub */}
            {[7, 14, 21, total].map(d => {
              const ang = dayAngle(d);
              const rad = r - 14;
              const lx = cx + Math.cos(ang) * rad;
              const ly = cy + Math.sin(ang) * rad;
              return (
                <text
                  key={'d-' + d}
                  x={lx} y={ly + 4}
                  textAnchor="middle"
                  fontFamily="Nunito, sans-serif"
                  fontWeight="700"
                  fontSize="11"
                  fill="#7a6fa0"
                >D{d}</text>
              );
            })}
            {/* Position marker */}
            <circle cx={mx} cy={my} r="6" fill="var(--butter-yellow)" stroke="var(--deep-indigo)" strokeWidth="2" />
            {/* Center label */}
            <g>
              <text x={cx} y={cy - 28} textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="700" fontSize="13" fill="#9b89c4">DAY</text>
              <text x={cx} y={cy + 22} textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="700" fontSize="52" fill="var(--butter-yellow)">{phaseInfo.cyclePos}</text>
              <text x={cx} y={cy + 46} textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="700" fontSize="13" fill="var(--cloud-white)">OF {total}</text>
            </g>
          </svg>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
            <MoonIcon phase={phaseInfo.phase} size={28} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--cloud-white)' }}>
                {PHASE_COLOR[phaseInfo.phase].label}
              </div>
              <div className="body" style={{ fontSize: 13, color: 'var(--text-soft)', marginTop: 4 }}>
                {phaseInfo.phase === 'menstrual'
                  ? `Day ${phaseInfo.cyclePos} of ${periodLen} period days`
                  : `Next period predicted in ${total - phaseInfo.cyclePos} days`}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="card indigo">
            <div className="eyebrow gold" style={{ marginBottom: 12 }}>Log Period</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className={`pbtn ${periodActive ? 'ghost' : 'blush'}`}
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={onLogStart}
                disabled={periodActive}
              >
                {periodActive ? 'Currently active' : 'Started today'}
              </button>
              <button
                className="pbtn ghost"
                style={{ flex: 1, justifyContent: 'center' }}
                disabled={!periodActive}
                onClick={onLogEnd}
              >
                Ended today
              </button>
            </div>
          </div>

          <div className="card indigo">
            <div className="eyebrow gold" style={{ marginBottom: 14 }}>Expected Lengths</div>
            <SettingSlider label="Cycle length" min={21} max={35} value={cycleLen} onChange={setCycleLen} unit="days" />
            <div style={{ height: 18 }} />
            <SettingSlider label="Period duration" min={3} max={8} value={periodLen} onChange={setPeriodLen} unit="days" />
            <div className="body" style={{ fontSize: 12, color: 'var(--text-soft)', marginTop: 14, lineHeight: 1.5 }}>
              Predictions rebase from your most recent confirmed start date. Past cycles are never modified.
            </div>
          </div>
        </div>
      </div>

      <div className="subhead">Cycle Log</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
        {cycleLog.map((c, i) => (
          <div key={c.id} className="card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--cloud-white)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {i === 0 ? 'Current' : `Cycle −${i}`}
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-soft)' }}>{c.length} days</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--cloud-white)', marginBottom: 10, fontWeight: 700 }}>
              {fmtDate(c.start)} → {c.end ? fmtDate(c.end) : 'in progress'}
            </div>
            <div className="pill-bar" />
          </div>
        ))}
      </div>
    </React.Fragment>
  );
}

function fmtDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

function SettingSlider({ label, min, max, value, onChange, unit }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--cloud-white)' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--butter-yellow)' }}>{value} {unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step="1" className="pixslider"
        value={value} onChange={(e) => onChange(parseInt(e.target.value, 10))}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────
function DashboardScreen({ sessions }) {
  const [range, setRange] = React.useState(30);
  const cutoff = new Date(TODAY); cutoff.setDate(cutoff.getDate() - range);
  const inRange = sessions.filter(s => new Date(s.timestamp) >= cutoff)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const cut7 = new Date(TODAY); cut7.setDate(cut7.getDate() - 7);
  const sess7 = sessions.filter(s => new Date(s.timestamp) >= cut7);
  const avg = (list) => {
    const out = {};
    for (const d of DIMENSIONS) {
      const vals = list.map(s => s.dimensions[d.key]);
      out[d.key] = vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : 0;
    }
    return out;
  };
  const avg7 = avg(sess7);
  const avg30 = avg(inRange);
  const moodAvg = inRange.length ? (inRange.reduce((s, x) => s + x.mood, 0) / inRange.length).toFixed(1) : '—';
  const tagCounts = {};
  inRange.forEach(s => s.tags && s.tags.forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const setOfDates = new Set(sessions.map(s => s.timestamp.slice(0, 10)));
  const todayISO = isoDate(new Date(TODAY));
  const startIdx = setOfDates.has(todayISO) ? 0 : 1;
  let streak = 0;
  for (let i = startIdx; i < 120; i++) {
    const d = new Date(TODAY); d.setDate(d.getDate() - i);
    if (setOfDates.has(isoDate(d))) streak++;
    else break;
  }

  return (
    <React.Fragment>
      <div className="page-head">
        <div>
          <div className="title">Dashboard</div>
          <div className="crumbs" style={{ marginTop: 6 }}>Trends · History · Drift</div>
        </div>
        <div className="seg">
          <button className={range === 30 ? 'active' : ''} onClick={() => setRange(30)}>30 days</button>
          <button className={range === 90 ? 'active' : ''} onClick={() => setRange(90)}>90 days</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
        <StatTile label="Sessions" value={inRange.length} color="var(--butter-yellow)" />
        <StatTile label="Avg Mood" value={moodAvg} color="var(--mint-green)" />
        <StatTile label="Day Streak" value={`${streak}d`} color="var(--peach)" />
        <StatTile label="Days Logged" value={new Set(inRange.map(s => s.timestamp.slice(0, 10))).size} color="var(--soft-lilac)" />
      </div>

      <div className="dash-grid">
        <div className="card indigo full">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
            <div>
              <div className="eyebrow gold">Mood Over Time</div>
              <div className="body" style={{ fontSize: 12, color: 'var(--text-soft)', marginTop: 4 }}>Smoothed line · {range} day window</div>
            </div>
          </div>
          <MoodLineChart sessions={inRange} />
        </div>

        <div className="card indigo">
          <div className="eyebrow gold" style={{ marginBottom: 6 }}>Balance Drift</div>
          <div className="body" style={{ fontSize: 12, color: 'var(--text-soft)', marginBottom: 14 }}>Last 7 days vs last 30 days</div>
          <OverlayRadar values7={avg7} values30={avg30} />
          <div style={{ display: 'flex', gap: 18, marginTop: 8, justifyContent: 'center' }}>
            <Legend label="7 days" color="var(--butter-yellow)" />
            <Legend label="30 days" color="var(--soft-lilac)" />
          </div>
        </div>

        <div className="card indigo">
          <div className="eyebrow gold" style={{ marginBottom: 14 }}>Top Tags</div>
          {topTags.length === 0 ? (
            <div className="body" style={{ color: 'var(--text-soft)', fontSize: 13 }}>No tags logged in this range yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {topTags.map(([id, count]) => {
                const tag = TAGS.find(t => t.id === id);
                const max = topTags[0][1];
                return (
                  <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18, width: 24 }}>{tag ? tag.em : '·'}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--cloud-white)', minWidth: 100 }}>{tag ? tag.label : id}</span>
                    <div style={{ flex: 1, height: 8, background: 'rgba(155,137,196,0.15)', border: '1px solid var(--border)', borderRadius: 4 }}>
                      <div style={{ width: `${(count / max) * 100}%`, height: '100%', background: 'var(--butter-yellow)', borderRadius: 4 }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--butter-yellow)', width: 28, textAlign: 'right' }}>{count}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="body" style={{ fontSize: 11, color: 'var(--text-soft)', marginTop: 14, fontStyle: 'italic' }}>
            (Seeded sessions have no tags — your real tags will populate here.)
          </div>
        </div>

        <div className="card full" style={{ background: 'transparent', border: '1.5px dashed var(--border)', boxShadow: 'none', color: 'var(--text-soft)', padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--cloud-white)' }}>Mood Heatmap</span>
            <span className="coming-soon">Coming Soon</span>
          </div>
          <div className="body" style={{ fontSize: 13 }}>
            Year-at-a-glance grid showing daily mood density. Also planned: push-notification alert when 7-day mood average drops below a threshold.
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

function StatTile({ label, value, color }) {
  return (
    <div className="stat-tile">
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-soft)', marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
    </div>
  );
}

function Legend({ label, color }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 16, height: 4, background: color, borderRadius: 2 }} />
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--cloud-white)' }}>{label}</span>
    </span>
  );
}

function MoodLineChart({ sessions }) {
  const W = 920, H = 220, padL = 40, padR = 16, padT = 18, padB = 30;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  if (sessions.length < 2) {
    return (
      <div style={{ height: H, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="hint">Log a few sessions to see your trend.</span>
      </div>
    );
  }
  const xs = sessions.map(s => new Date(s.timestamp).getTime());
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const px = (t) => padL + ((t - minX) / (maxX - minX || 1)) * innerW;
  const py = (m) => padT + (1 - (m - 1) / 9) * innerH;
  const points = sessions.map(s => [px(new Date(s.timestamp).getTime()), py(s.mood)]);
  const smooth = points.map((p, i, arr) => {
    if (i === 0) return `M ${p[0]} ${p[1]}`;
    const prev = arr[i - 1];
    const mx = (prev[0] + p[0]) / 2;
    return `Q ${mx} ${prev[1]}, ${mx} ${(prev[1] + p[1]) / 2} T ${p[0]} ${p[1]}`;
  }).join(' ');

  const tickN = 6;
  const dateTicks = Array.from({ length: tickN }).map((_, i) => {
    const t = minX + (i / (tickN - 1)) * (maxX - minX);
    return { x: px(t), label: new Date(t).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) };
  });

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      {[2, 4, 6, 8, 10].map(g => (
        <g key={g}>
          <line x1={padL} y1={py(g)} x2={W - padR} y2={py(g)} stroke="#7a6fa0" strokeWidth="1" strokeOpacity="0.2" strokeDasharray="3 4" />
          <text x={padL - 8} y={py(g) + 4} textAnchor="end" fontFamily="Nunito, sans-serif" fontWeight="700" fontSize="11" fill="#7a6fa0">{g}</text>
        </g>
      ))}
      <rect x={padL} y={py(10)} width={innerW} height={py(7) - py(10)} fill="#b5ead7" opacity="0.05" />
      <rect x={padL} y={py(4)} width={innerW} height={py(1) - py(4)} fill="#f7cac9" opacity="0.05" />

      <path d={smooth} fill="none" stroke="var(--butter-yellow)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="4" fill="var(--butter-yellow)" stroke="var(--deep-indigo)" strokeWidth="1.5" />
      ))}

      {dateTicks.map((t, i) => (
        <text key={i} x={t.x} y={H - 8} textAnchor={i === 0 ? 'start' : (i === tickN - 1 ? 'end' : 'middle')} fontFamily="Nunito, sans-serif" fontWeight="700" fontSize="11" fill="#7a6fa0">
          {t.label}
        </text>
      ))}
    </svg>
  );
}

function OverlayRadar({ values7, values30 }) {
  const size = 320, cx = size / 2, cy = size / 2, radius = size / 2 - 52;
  const axes = DIMENSIONS;
  const n = axes.length;
  const angle = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const pts = (values) => axes.map((a, i) => {
    const r = (values[a.key] / 10) * radius;
    return [cx + Math.cos(angle(i)) * r, cy + Math.sin(angle(i)) * r].join(',');
  }).join(' ');

  return (
    <svg width="100%" height={size} viewBox={`0 0 ${size} ${size}`} style={{ maxWidth: '100%' }}>
      {[2, 4, 6, 8, 10].map(v => {
        const pp = axes.map((_, i) => {
          const r = (v / 10) * radius;
          return [cx + Math.cos(angle(i)) * r, cy + Math.sin(angle(i)) * r].join(',');
        }).join(' ');
        return <polygon key={v} points={pp} fill="none" stroke="#7a6fa0" strokeOpacity={v === 10 ? 0.5 : 0.2} strokeWidth={v === 10 ? 1.5 : 1} strokeDasharray={v === 10 ? '0' : '2 3'} />;
      })}
      {axes.map((a, i) => {
        const r = radius;
        const [x, y] = [cx + Math.cos(angle(i)) * r, cy + Math.sin(angle(i)) * r];
        return <line key={a.key} x1={cx} y1={cy} x2={x} y2={y} stroke="#7a6fa0" strokeOpacity="0.25" />;
      })}
      <polygon points={pts(values30)} fill="rgba(201,184,240,0.25)" stroke="var(--soft-lilac)" strokeWidth="2" />
      <polygon points={pts(values7)} fill="rgba(255,224,102,0.2)" stroke="var(--butter-yellow)" strokeWidth="2" />
      {axes.map((a, i) => {
        const r = radius + 22;
        const [lx, ly] = [cx + Math.cos(angle(i)) * r, cy + Math.sin(angle(i)) * r];
        const anchor = Math.abs(lx - cx) < 8 ? 'middle' : (lx < cx ? 'end' : 'start');
        return (
          <text key={a.key} x={lx} y={ly + 4} textAnchor={anchor} fontFamily="Nunito, sans-serif" fontWeight="700" fontSize="12" fill="#9b89c4">{a.short}</text>
        );
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Settings modal
// ─────────────────────────────────────────────────────────────
function SettingsSheet({
  cycleLen, periodLen, setCycleLen, setPeriodLen,
  driveConnected, toggleDrive, onExport, onClose,
}) {
  return (
    <Modal title="Settings" onClose={onClose} width={620}>
      <div className="eyebrow gold" style={{ marginBottom: 12 }}>Cycle</div>
      <div style={{ padding: 16, background: 'rgba(155,137,196,0.06)', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 22 }}>
        <SettingSlider label="Cycle length" min={21} max={35} value={cycleLen} onChange={setCycleLen} unit="days" />
        <div style={{ height: 16 }} />
        <SettingSlider label="Period duration" min={3} max={8} value={periodLen} onChange={setPeriodLen} unit="days" />
      </div>

      <div className="eyebrow gold" style={{ marginBottom: 12 }}>Sync</div>
      <div style={{ background: 'rgba(155,137,196,0.06)', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 22 }}>
        <div className="row" style={{ padding: '12px 16px' }}>
          <div>
            <div className="lab" style={{ color: 'var(--cloud-white)', fontWeight: 700 }}>Google Drive</div>
            <div style={{ fontSize: 12, color: 'var(--text-soft)', marginTop: 2 }}>Last-write-wins per item, 3s debounce after lock.</div>
          </div>
          <button className={`pbtn ${driveConnected ? 'mint' : 'butter'}`} onClick={toggleDrive} style={{ padding: '8px 14px', fontSize: 12 }}>
            {driveConnected ? 'Connected' : 'Connect'}
          </button>
        </div>
        <div className="row" style={{ padding: '12px 16px' }}>
          <div className="lab" style={{ color: 'var(--cloud-white)' }}>Last synced</div>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--butter-yellow)' }}>{driveConnected ? '09:28' : '—'}</span>
        </div>
        <div className="row" style={{ padding: '12px 16px' }}>
          <div className="lab" style={{ color: 'var(--cloud-white)' }}>Manual sync</div>
          <button className="pbtn ghost" style={{ padding: '8px 14px', fontSize: 12 }} disabled={!driveConnected}>Sync Now</button>
        </div>
        <div className="row" style={{ padding: '12px 16px' }}>
          <div className="lab" style={{ color: 'var(--cloud-white)' }}>Export data</div>
          <button className="pbtn butter" style={{ padding: '8px 14px', fontSize: 12 }} onClick={onExport}>Download JSON</button>
        </div>
      </div>

      <div className="eyebrow gold" style={{ marginBottom: 12 }}>Alerts</div>
      <div style={{ background: 'rgba(155,137,196,0.06)', border: '1px solid var(--border)', borderRadius: 12, opacity: 0.8 }}>
        <div className="row" style={{ padding: '12px 16px' }}>
          <div>
            <div className="lab" style={{ color: 'var(--cloud-white)' }}>Mood alert threshold</div>
            <div style={{ fontSize: 12, color: 'var(--text-soft)', marginTop: 2 }}>Notify when 7-day avg drops below 5.</div>
          </div>
          <span className="coming-soon">Soon</span>
        </div>
        <div className="row" style={{ padding: '12px 16px' }}>
          <div className="lab" style={{ color: 'var(--cloud-white)' }}>Push notifications</div>
          <span className="coming-soon">Soon</span>
        </div>
      </div>
    </Modal>
  );
}

Object.assign(window, { CycleScreen, DashboardScreen, SettingsSheet });
