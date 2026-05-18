import { useState } from 'react';
import { useDriveStore } from '../store/driveStore';
import { connectAndSync } from '../utils/driveSync';

export function SyncBadge() {
  const { connected, syncStatus } = useDriveStore();
  const [working, setWorking] = useState(false);

  async function handleClick() {
    if (!connected && !working) {
      setWorking(true);
      try { await connectAndSync(); } catch { /* error shown in store */ }
      finally { setWorking(false); }
    }
  }

  let bg: string, border: string, color: string, label: string;

  if (!connected) {
    bg = 'rgba(26,26,46,0.9)';
    border = 'rgba(155,137,196,0.35)';
    color = '#9b89c4';
    label = working ? 'Opening…' : 'Offline · Sign In';
  } else if (syncStatus === 'syncing') {
    bg = 'rgba(255,234,167,0.08)';
    border = 'rgba(201,168,76,0.35)';
    color = '#ffeaa7';
    label = 'Syncing…';
  } else if (syncStatus === 'error') {
    bg = 'rgba(247,202,201,0.08)';
    border = 'rgba(201,138,136,0.35)';
    color = '#f7cac9';
    label = 'Sync error';
  } else {
    bg = 'rgba(181,234,215,0.1)';
    border = 'rgba(106,171,144,0.35)';
    color = '#b5ead7';
    label = 'Synced';
  }

  return (
    <button
      onClick={handleClick}
      disabled={connected || working}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '6px 14px', borderRadius: 9999,
        background: bg, border: `1px solid ${border}`, color,
        fontSize: 11, fontWeight: 600, fontFamily: 'Nunito, sans-serif',
        cursor: !connected && !working ? 'pointer' : 'default',
        whiteSpace: 'nowrap', flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 10 }}>✦</span>
      {label}
    </button>
  );
}
