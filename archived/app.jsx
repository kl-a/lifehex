// LifeHex main app

const { useState, useEffect, useMemo } = React;

const DEFAULT_DIMENSIONS = { creative: 5, connection: 5, restoration: 5, boundaries: 5, meaningfulWork: 5, physicalHealth: 5 };

function App() {
  const [tab, setTab] = useState('today');
  const [locked, setLockedState] = useState(true);

  // Load sessions once at mount — pre-fill dimensions/mood from the most recent session
  const [sessions, setSessions] = useState(() => loadSessions());
  const [cycleLog, setCycleLog] = useState(() => loadCycles());
  const [cycleLen, setCycleLen] = useState(() => loadSettings().cycleLen);
  const [periodLen, setPeriodLen] = useState(() => loadSettings().periodLen);
  const [driveConnected, setDriveConnected] = useState(() => loadSettings().driveConnected);

  const [dimensions, setDimensions] = useState(() => {
    const ss = loadSessions();
    return ss.length ? { ...ss[ss.length - 1].dimensions } : { ...DEFAULT_DIMENSIONS };
  });
  const [mood, setMood] = useState(() => {
    const ss = loadSessions();
    return ss.length ? ss[ss.length - 1].mood : 5;
  });
  const [lastSavedISO, setLastSavedISO] = useState(() => {
    const ss = loadSessions();
    return ss.length ? ss[ss.length - 1].timestamp : null;
  });
  const [sessionTags, setSessionTags] = useState([]);

  const [activeDim, setActiveDim] = useState(null);
  const [dayDetail, setDayDetail] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);

  // Persist to localStorage on every relevant change
  useEffect(() => { saveSessions(sessions); }, [sessions]);
  useEffect(() => { saveCycles(cycleLog); }, [cycleLog]);
  useEffect(() => {
    saveSettings({ cycleLen, periodLen, driveConnected, lastSyncedAt: null });
  }, [cycleLen, periodLen, driveConnected]);

  const today = useMemo(() => new Date(TODAY), []);
  const cycleStartISO = cycleLog.length ? cycleLog[0].start : isoDate(today);
  const phaseInfo = useMemo(
    () => getCyclePhase(cycleStartISO, cycleLen, periodLen, today),
    [cycleStartISO, cycleLen, periodLen, today]
  );

  function toggleLock() {
    if (locked) {
      setSessionTags([]);
      setLockedState(false);
    } else {
      const newSession = {
        id: `s-${Date.now()}`,
        timestamp: new Date().toISOString(),
        dimensions: { ...dimensions },
        mood,
        tags: [...sessionTags],
      };
      setSessions(prev => [...prev, newSession]);
      setLastSavedISO(newSession.timestamp);
      setLockedState(true);
    }
  }

  function setDimension(key, value) {
    setDimensions(prev => ({ ...prev, [key]: value }));
  }
  function toggleTag(id) {
    setSessionTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  }

  function onLogStart() {
    if (cycleLog[0] && !cycleLog[0].end) return;
    setCycleLog(prev => [{
      id: `c-${Date.now()}`,
      start: isoDate(today),
      end: null,
      length: cycleLen,
    }, ...prev]);
  }
  function onLogEnd() {
    setCycleLog(prev => {
      const [head, ...rest] = prev;
      if (!head) return prev;
      return [{ ...head, end: isoDate(today) }, ...rest];
    });
  }

  return (
    <div className="app">
      <main className="main">
        {tab === 'today' && (
          <TodayScreen
            locked={locked}
            setLocked={toggleLock}
            dimensions={dimensions}
            setDimension={setDimension}
            mood={mood}
            setMood={setMood}
            sessionTags={sessionTags}
            toggleTag={toggleTag}
            lastSavedISO={lastSavedISO}
            phaseInfo={phaseInfo}
            periodLen={periodLen}
            goCycle={() => setTab('cycle')}
            onAxisTap={(k) => setActiveDim(k)}
            sessions={sessions}
          />
        )}
        {tab === 'calendar' && (
          <CalendarScreen
            sessions={sessions}
            monthOffset={monthOffset}
            setMonthOffset={setMonthOffset}
            cycleStartISO={cycleStartISO}
            cycleLen={cycleLen}
            periodLen={periodLen}
            onDayTap={(date, ss, phase) => setDayDetail({ date, sessions: ss, phase })}
          />
        )}
        {tab === 'cycle' && (
          <CycleScreen
            cycleLog={cycleLog}
            cycleLen={cycleLen}
            periodLen={periodLen}
            setCycleLen={setCycleLen}
            setPeriodLen={setPeriodLen}
            onLogStart={onLogStart}
            onLogEnd={onLogEnd}
          />
        )}
        {tab === 'dashboard' && (
          <DashboardScreen sessions={sessions} />
        )}
      </main>

      <BottomNav
        active={tab}
        onChange={setTab}
        onSettings={() => setSettingsOpen(true)}
      />

      {activeDim && (
        <DimensionSheet
          dimKey={activeDim}
          value={dimensions[activeDim]}
          onChange={setDimension}
          onClose={() => setActiveDim(null)}
        />
      )}
      {dayDetail && (
        <DayDetailSheet
          date={dayDetail.date}
          sessions={dayDetail.sessions}
          phase={dayDetail.phase}
          onClose={() => setDayDetail(null)}
        />
      )}
      {settingsOpen && (
        <SettingsSheet
          cycleLen={cycleLen}
          periodLen={periodLen}
          setCycleLen={setCycleLen}
          setPeriodLen={setPeriodLen}
          driveConnected={driveConnected}
          toggleDrive={() => setDriveConnected(v => !v)}
          onExport={() => exportData(sessions, cycleLog, { cycleLen, periodLen, driveConnected, lastSyncedAt: null })}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
