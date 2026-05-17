// Bottom nav + modals for dimension editor / day detail / settings

function BottomNav({ active, onChange, onSettings }) {
  const tabs = [
    { id: 'today', label: 'Today', icon: <TodayIcon /> },
    { id: 'calendar', label: 'Calendar', icon: <CalendarIcon /> },
    { id: 'cycle', label: 'Cycle', icon: <MoonCrescentIcon /> },
    { id: 'dashboard', label: 'Stats', icon: <ChartIcon /> },
  ];
  return (
    <nav className="bottom-nav">
      {tabs.map(t => (
        <button
          key={t.id}
          className={`nav-item ${active === t.id ? 'active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          <span className="nav-icon">{t.icon}</span>
          <span className="nav-label">{t.label}</span>
        </button>
      ))}
      <button className="nav-item" onClick={onSettings}>
        <span className="nav-icon"><SettingsIcon /></span>
        <span className="nav-label">Settings</span>
      </button>
    </nav>
  );
}

// Clean outline SVG icons
function TodayIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="11" cy="11" r="4" />
      <path d="M11 2v2M11 18v2M2 11h2M18 11h2M4.93 4.93l1.41 1.41M15.66 15.66l1.41 1.41M4.93 17.07l1.41-1.41M15.66 6.34l1.41-1.41" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="16" height="16" rx="3" />
      <path d="M3 9h16" />
      <path d="M8 2v4M14 2v4" />
    </svg>
  );
}
function MoonCrescentIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M18.5 13.5A8.5 8.5 0 0 1 9 4a7.5 7.5 0 1 0 9.5 9.5z" />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 19h18" />
      <path d="M5 19V12M9 19V7M13 19V10M17 19V4" />
    </svg>
  );
}
function SettingsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="3" />
      <path d="M11 2v3M11 17v3M4.22 4.22l2.12 2.12M15.66 15.66l2.12 2.12M2 11h3M17 11h3M4.22 17.78l2.12-2.12M15.66 6.34l2.12-2.12" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Modal shell
// ─────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, width = 560 }) {
  return (
    <div className="backdrop" onClick={onClose}>
      <div className="modal" style={{ width }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span className="title-px">{title}</span>
          <button className="x" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

// Dimension modal
function DimensionSheet({ dimKey, value, onChange, onClose }) {
  const dim = DIMENSIONS.find(d => d.key === dimKey);
  if (!dim) return null;
  return (
    <Modal title={dim.label} onClose={onClose} width={560}>
      <p className="body" style={{ color: 'var(--cloud-white)', marginTop: 0, opacity: 0.75, marginBottom: 18 }}>{dim.desc}</p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 6 }}>
        <span style={{ fontSize: 40, fontWeight: 700, color: 'var(--butter-yellow)', minWidth: 56, textAlign: 'right' }}>{value}</span>
        <input
          type="range" min="0" max="10" step="1"
          className="pixslider"
          value={value}
          onChange={(e) => onChange(dimKey, parseInt(e.target.value, 10))}
          style={{ flex: 1 }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: 'var(--text-soft)', padding: '0 0 0 72px' }}>
        <span>0</span><span>5</span><span>10</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 22 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--mint-green)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>Adds +</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {dim.adds.map(a => (
              <span key={a} className="chip readonly" style={{ borderColor: 'rgba(106,171,144,0.4)' }}>
                <span style={{ fontSize: 12, color: 'var(--mint-green)' }}>+ {a}</span>
              </span>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--blush-pink)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>Detracts −</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {dim.detracts.map(a => (
              <span key={a} className="chip readonly" style={{ borderColor: 'rgba(201,138,136,0.4)' }}>
                <span style={{ fontSize: 12, color: 'var(--blush-pink)' }}>− {a}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <button className="pbtn butter" style={{ marginTop: 22, width: '100%', justifyContent: 'center' }} onClick={onClose}>
        Done
      </button>
    </Modal>
  );
}

// Day detail modal
function DayDetailSheet({ date, sessions, phase, onClose }) {
  const dayLabel = new Date(date + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const avg = sessions.length ? (sessions.reduce((s, x) => s + x.mood, 0) / sessions.length).toFixed(1) : '—';
  return (
    <Modal title={dayLabel} onClose={onClose} width={640}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, margin: '0 0 18px' }}>
        <div>
          <div className="eyebrow gold" style={{ marginBottom: 4 }}>Mood Avg</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--cloud-white)' }}>{avg}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <MoonIcon phase={phase} size={28} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Phase</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--cloud-white)', marginTop: 3 }}>{PHASE_COLOR[phase].label}</div>
          </div>
        </div>
      </div>

      {sessions.length === 0 ? (
        <p className="body" style={{ color: 'var(--text-soft)' }}>No sessions logged.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sessions.map(s => {
            const time = new Date(s.timestamp).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false });
            return (
              <div key={s.id} className="card" style={{ padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--cloud-white)' }}>{time}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>{MOOD_EMOJI(s.mood)}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--cloud-white)' }}>{s.mood}/10</span>
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4 }}>
                  {DIMENSIONS.map(d => (
                    <div key={d.key} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-soft)', letterSpacing: 0.3, textTransform: 'uppercase' }}>{d.short}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--cloud-white)', marginTop: 4 }}>{s.dimensions[d.key]}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button className="pbtn ghost" style={{ marginTop: 18, width: '100%', justifyContent: 'center' }} onClick={onClose}>
        Close
      </button>
    </Modal>
  );
}

Object.assign(window, {
  BottomNav, Modal, DimensionSheet, DayDetailSheet,
  TodayIcon, CalendarIcon, MoonCrescentIcon, ChartIcon, SettingsIcon,
});
