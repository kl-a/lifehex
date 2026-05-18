import { useState, useMemo, useEffect } from 'react';
import { BottomNav } from './components/BottomNav';
import { Today } from './pages/Today';
import { Calendar } from './pages/Calendar';
import { Cycle } from './pages/Cycle';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';
import { useCycleStore } from './store/cycleStore';
import { useSettingsStore } from './store/settingsStore';
import { useDayStore } from './store/dayStore';
import { getCyclePhase, isoDate } from './utils/cyclePredictor';
import { useDriveSync } from './hooks/useDriveSync';

type Tab = 'today' | 'calendar' | 'cycle' | 'dashboard';

export default function App() {
  const [tab, setTab] = useState<Tab>('today');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { ensureToday } = useDayStore();
  useDriveSync();

  // Archive yesterday and reset checklist on mount and every minute (catches midnight rollover)
  useEffect(() => {
    ensureToday();
    const interval = setInterval(ensureToday, 60_000);
    return () => clearInterval(interval);
  }, []);

  const { cycles } = useCycleStore();
  const { expectedCycleLength: cycleLen, expectedPeriodLength: periodLen } = useSettingsStore();

  const today = useMemo(() => new Date(), []);
  const cycleStartISO = cycles.length ? cycles[0].cycleStartDate : isoDate(today);
  const phaseInfo = useMemo(
    () => getCyclePhase(cycleStartISO, cycleLen, periodLen, today),
    [cycleStartISO, cycleLen, periodLen, today]
  );

  return (
    <div className="min-h-screen bg-night-sky text-cloud-white">
      <div className="w-full px-6 pt-6 pb-20 max-w-[1400px] mx-auto">
        {tab === 'today' && (
          <Today
            phaseInfo={phaseInfo}
            periodLen={periodLen}
            goCycle={() => setTab('cycle')}
          />
        )}
        {tab === 'calendar' && (
          <Calendar cycleStartISO={cycleStartISO} cycleLen={cycleLen} periodLen={periodLen} />
        )}
        {tab === 'cycle' && <Cycle />}
        {tab === 'dashboard' && <Dashboard />}
      </div>

      <BottomNav active={tab} onChange={setTab} onSettings={() => setSettingsOpen(true)} />

      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
