import { useState, useEffect } from 'react';
import { SyncBadge } from './SyncBadge';

interface Props {
  title: string;
  right?: React.ReactNode; // optional override for right side (e.g. month nav, range buttons)
}

export function PageHeader({ title, right }: Props) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const dateStr = now.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' });
  const timeStr = now.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <div>
        <h1 className="text-2xl font-bold text-cloud-white tracking-tight leading-tight">{title}</h1>
        <p className="text-xs text-muted-purple mt-0.5">{dateStr} · {timeStr}</p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {right}
        <SyncBadge />
      </div>
    </div>
  );
}
