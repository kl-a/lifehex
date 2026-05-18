import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

type Tab = 'today' | 'calendar' | 'cycle' | 'dashboard';

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
  onSettings: () => void;
}

const tabs: { id: Tab; label: string; icon: ReactElement }[] = [
  { id: 'today',     label: 'Today',    icon: <TodayIcon /> },
  { id: 'calendar',  label: 'Calendar', icon: <CalendarIcon /> },
  { id: 'cycle',     label: 'Cycle',    icon: <CycleIcon /> },
  { id: 'dashboard', label: 'Stats',    icon: <ChartIcon /> },
];

export function BottomNav({ active, onChange, onSettings }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 flex justify-around items-center bg-deep-indigo z-50 border-t border-muted-purple/20" style={{ height: 56 }}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`flex flex-col items-center gap-0.5 flex-1 py-2 transition-colors ${active === t.id ? 'text-butter' : 'text-muted-purple'}`}
        >
          {t.icon}
          <span className={`font-bold text-[10px] tracking-wide ${active === t.id ? 'text-butter' : 'text-muted-purple'}`}>{t.label}</span>
        </button>
      ))}
      <button
        onClick={onSettings}
        className="flex flex-col items-center gap-0.5 flex-1 py-2 text-muted-purple hover:text-cloud-white transition-colors"
      >
        <SettingsIcon />
        <span className="font-bold text-[10px] tracking-wide">Settings</span>
      </button>
      <Link
        to="/mobile"
        className="flex flex-col items-center gap-0.5 flex-1 py-2 text-muted-purple hover:text-cloud-white transition-colors"
      >
        <MobileIcon />
        <span className="font-bold text-[10px] tracking-wide">Mobile</span>
      </Link>
    </nav>
  );
}

function TodayIcon() {
  return <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="4" /><path d="M11 2v2M11 18v2M2 11h2M18 11h2M4.93 4.93l1.41 1.41M15.66 15.66l1.41 1.41M4.93 17.07l1.41-1.41M15.66 6.34l1.41-1.41" /></svg>;
}
function CalendarIcon() {
  return <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="16" height="16" rx="3" /><path d="M3 9h16M8 2v4M14 2v4" /></svg>;
}
function CycleIcon() {
  return <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18.5 13.5A8.5 8.5 0 0 1 9 4a7.5 7.5 0 1 0 9.5 9.5z" /></svg>;
}
function ChartIcon() {
  return <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 19h18M5 19V12M9 19V7M13 19V10M17 19V4" /></svg>;
}
function MobileIcon() {
  return <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="2" width="10" height="18" rx="2" /><circle cx="11" cy="17" r="0.8" fill="currentColor" stroke="none" /></svg>;
}
function SettingsIcon() {
  return <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="3" /><path d="M11 2v3M11 17v3M4.22 4.22l2.12 2.12M15.66 15.66l2.12 2.12M2 11h3M17 11h3M4.22 17.78l2.12-2.12M15.66 6.34l2.12-2.12" /></svg>;
}
