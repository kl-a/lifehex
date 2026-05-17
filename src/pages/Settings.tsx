import { BottomSheet } from '../components/BottomSheet';
import { useSettingsStore } from '../store/settingsStore';
import { useHistoryStore } from '../store/historyStore';
import { useCycleStore } from '../store/cycleStore';
import { exportJSON } from '../utils/moodAggregate';

interface Props {
  open: boolean;
  onClose: () => void;
}

function SettingSlider({ label, min, max, value, onChange, unit }: { label: string; min: number; max: number; value: number; onChange: (n: number) => void; unit: string }) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="font-body text-[13px] font-semibold text-cloud-white">{label}</span>
        <span className="font-bold text-[9px] text-butter">{value} {unit}</span>
      </div>
      <input type="range" min={min} max={max} step="1" className="pixslider w-full" value={value} onChange={(e) => onChange(parseInt(e.target.value, 10))} />
    </div>
  );
}

export function Settings({ open, onClose }: Props) {
  const { expectedCycleLength, expectedPeriodLength, driveConnected, setExpectedCycleLength, setExpectedPeriodLength, setDriveConnected } = useSettingsStore();
  const { sessions } = useHistoryStore();
  const { cycles } = useCycleStore();

  function handleExport() {
    exportJSON(sessions, cycles, { expectedCycleLength, expectedPeriodLength, driveConnected });
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Settings">
      <div className="flex flex-col gap-5">
        {/* Cycle */}
        <section>
          <div className="font-bold text-[8px] text-star-gold mb-3">Cycle</div>
          <div className="bg-muted-purple/5 border border-muted-purple/20 rounded p-3 flex flex-col gap-4">
            <SettingSlider label="Cycle length" min={21} max={35} value={expectedCycleLength} onChange={setExpectedCycleLength} unit="days" />
            <SettingSlider label="Period duration" min={3} max={8} value={expectedPeriodLength} onChange={setExpectedPeriodLength} unit="days" />
          </div>
        </section>

        {/* Sync */}
        <section>
          <div className="font-bold text-[8px] text-star-gold mb-3">Sync</div>
          <div className="bg-muted-purple/5 border border-muted-purple/20 rounded divide-y divide-muted-purple/20">
            <div className="flex justify-between items-center p-3">
              <div>
                <div className="font-body text-[13px] font-bold text-cloud-white">Google Drive</div>
                <div className="font-body text-[11px] text-lilac-shadow mt-0.5">Last-write-wins, 3s debounce after lock.</div>
              </div>
              <button
                className={`font-bold text-[7px] px-3 py-2 rounded border ${driveConnected ? 'border-mint-shadow/50 text-mint-green' : 'border-butter-shadow/50 text-butter'}`}
                onClick={() => setDriveConnected(!driveConnected)}
              >
                {driveConnected ? 'Connected' : 'Connect'}
              </button>
            </div>
            <div className="flex justify-between items-center p-3">
              <span className="font-body text-[13px] text-cloud-white">Manual sync</span>
              <button className="btn-ghost font-bold text-[7px] px-3 py-2" disabled={!driveConnected}>Sync Now</button>
            </div>
            <div className="flex justify-between items-center p-3">
              <span className="font-body text-[13px] text-cloud-white">Export data</span>
              <button className="btn-butter font-bold text-[7px] px-3 py-2" onClick={handleExport}>Download JSON</button>
            </div>
          </div>
        </section>

        {/* Alerts (coming soon) */}
        <section>
          <div className="font-bold text-[8px] text-star-gold mb-3">Alerts</div>
          <div className="bg-muted-purple/5 border border-muted-purple/20 rounded divide-y divide-muted-purple/20 opacity-60">
            <div className="flex justify-between items-center p-3">
              <div>
                <div className="font-body text-[13px] text-cloud-white">Mood alert threshold</div>
                <div className="font-body text-[11px] text-lilac-shadow mt-0.5">Notify when 7-day avg drops below 5.</div>
              </div>
              <span className="font-bold text-[7px] text-lilac-shadow border border-muted-purple/40 rounded px-2 py-1">Soon</span>
            </div>
            <div className="flex justify-between items-center p-3">
              <span className="font-body text-[13px] text-cloud-white">Push notifications</span>
              <span className="font-bold text-[7px] text-lilac-shadow border border-muted-purple/40 rounded px-2 py-1">Soon</span>
            </div>
          </div>
        </section>
      </div>
    </BottomSheet>
  );
}
