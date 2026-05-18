import { useState } from 'react';
import { BottomSheet } from '../components/BottomSheet';
import { useSettingsStore } from '../store/settingsStore';
import { useHistoryStore } from '../store/historyStore';
import { useCycleStore } from '../store/cycleStore';
import { useDayStore } from '../store/dayStore';
import { useDayHistoryStore } from '../store/dayHistoryStore';
import { useDriveStore } from '../store/driveStore';
import { exportJSON } from '../utils/moodAggregate';
import { connectAndSync, disconnectDrive, syncToDrive, syncFromDrive } from '../utils/driveSync';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function Settings({ open, onClose }: Props) {
  const { expectedCycleLength, expectedPeriodLength, driveConnected, lastSyncedAt } = useSettingsStore();
  const { sessions } = useHistoryStore();
  const { cycles } = useCycleStore();
  const { dayRecord } = useDayStore();
  const { dayRecords: dayHistory } = useDayHistoryStore();
  const { connected, syncStatus, syncError, lastSyncedAt: driveLastSync } = useDriveStore();
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  // Keep legacy driveConnected flag in sync with real drive store
  const isConnected = connected || driveConnected;

  function handleExport() {
    const allDayRecords = [
      dayRecord,
      ...dayHistory.filter((r) => r.date !== dayRecord.date),
    ].sort((a, b) => b.date.localeCompare(a.date));
    exportJSON(sessions, allDayRecords, cycles, { expectedCycleLength, expectedPeriodLength, driveConnected: isConnected });
  }

  async function handleConnect() {
    setConnecting(true);
    setConnectError(null);
    try {
      await connectAndSync();
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    await disconnectDrive();
  }

  async function handleSyncNow() {
    setSyncing(true);
    try {
      await syncFromDrive();
      await syncToDrive();
    } catch {
      // syncStatus in store will reflect the error
    } finally {
      setSyncing(false);
    }
  }

  const syncedAt = driveLastSync ?? lastSyncedAt;
  const syncedLabel = syncedAt
    ? `Synced ${new Date(syncedAt).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false })}`
    : null;

  const statusLabel = () => {
    if (syncing || syncStatus === 'syncing') return '⟳ syncing…';
    if (syncStatus === 'error') return `⚠ ${syncError ?? 'error'}`;
    if (syncedLabel) return syncedLabel;
    return null;
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Settings">
      <div className="flex flex-col gap-5">
        {/* Sync */}
        <section>
          <div className="font-bold text-[13px] text-star-gold mb-3">Sync</div>
          <div className="bg-muted-purple/5 border border-muted-purple/20 rounded divide-y divide-muted-purple/20">
            {/* Google Drive row */}
            <div className="flex justify-between items-center p-3">
              <div>
                <div className="font-body text-[15px] font-bold text-cloud-white">Google Drive</div>
                <div className="font-body text-[13px] text-lilac-shadow mt-0.5">
                  {isConnected
                    ? (statusLabel() ?? 'Auto-sync on lock · 3s debounce')
                    : 'Sync your data across devices'}
                </div>
                {connectError && (
                  <div className="font-body text-[13px] text-blush-pink mt-1">{connectError}</div>
                )}
              </div>
              {isConnected ? (
                <button
                  className="font-bold text-[11px] px-3 py-2 rounded border border-blush-shadow/50 text-blush-pink"
                  onClick={handleDisconnect}
                >
                  Disconnect
                </button>
              ) : (
                <button
                  className={`font-bold text-[11px] px-3 py-2 rounded border border-butter-shadow/50 text-butter ${connecting ? 'opacity-50' : ''}`}
                  onClick={handleConnect}
                  disabled={connecting}
                >
                  {connecting ? 'Opening…' : 'Connect'}
                </button>
              )}
            </div>

            {/* Manual sync */}
            <div className="flex justify-between items-center p-3">
              <span className="font-body text-[15px] text-cloud-white">Manual sync</span>
              <button
                className="btn-ghost font-bold text-[11px] px-3 py-2"
                disabled={!isConnected || syncing}
                onClick={handleSyncNow}
              >
                {syncing ? 'Syncing…' : 'Sync Now'}
              </button>
            </div>

            {/* Export */}
            <div className="flex justify-between items-center p-3">
              <span className="font-body text-[15px] text-cloud-white">Export data</span>
              <button className="btn-butter font-bold text-[11px] px-3 py-2" onClick={handleExport}>
                Download JSON
              </button>
            </div>
          </div>
        </section>

        {/* Alerts (coming soon) */}
        <section>
          <div className="font-bold text-[13px] text-star-gold mb-3">Alerts</div>
          <div className="bg-muted-purple/5 border border-muted-purple/20 rounded divide-y divide-muted-purple/20 opacity-60">
            <div className="flex justify-between items-center p-3">
              <div>
                <div className="font-body text-[15px] text-cloud-white">Mood alert threshold</div>
                <div className="font-body text-[13px] text-lilac-shadow mt-0.5">Notify when 7-day avg drops below 5.</div>
              </div>
              <span className="font-bold text-[11px] text-lilac-shadow border border-muted-purple/40 rounded px-2 py-1">Soon</span>
            </div>
            <div className="flex justify-between items-center p-3">
              <span className="font-body text-[15px] text-cloud-white">Push notifications</span>
              <span className="font-bold text-[11px] text-lilac-shadow border border-muted-purple/40 rounded px-2 py-1">Soon</span>
            </div>
          </div>
        </section>
      </div>
    </BottomSheet>
  );
}
