import { timerStore, useTimer } from '@/entities/timer';
import { NumberStepper } from '@/shared/ui/NumberStepper';

type SettingsSheetProps = {
  onClose: () => void;
};

export function SettingsSheet({ onClose }: SettingsSheetProps) {
  const {
    workDuration,
    breakDuration,
    longBreakDuration,
    sessionsBeforeLongBreak,
    soundEnabled,
    volume,
    autoStartWork,
    notificationsEnabled,
    alwaysOnTop,
  } = useTimer();

  return (
    <div className="settings-overlay">
      <div className="settings-sheet">
        <button type="button" className="settings-sheet__close" onClick={onClose}>
          ×
        </button>
        <h2 className="settings-sheet__title">Settings</h2>
        <div className="settings-sheet__scroll">
          <div className="settings-sheet__row">
            <span>Work, min</span>
            <NumberStepper
              value={Math.round(workDuration / 60)}
              min={1}
              max={60}
              onChange={(minutes) => timerStore.setWorkDuration(minutes * 60)}
            />
          </div>
          <div className="settings-sheet__row">
            <span>Break, min</span>
            <NumberStepper
              value={Math.round(breakDuration / 60)}
              min={1}
              max={60}
              onChange={(minutes) => timerStore.setBreakDuration(minutes * 60)}
            />
          </div>
          <div className="settings-sheet__row">
            <span>Long break, min</span>
            <NumberStepper
              value={Math.round(longBreakDuration / 60)}
              min={1}
              max={60}
              onChange={(minutes) => timerStore.setLongBreakDuration(minutes * 60)}
            />
          </div>
          <div className="settings-sheet__row">
            <span>Sessions</span>
            <NumberStepper
              value={sessionsBeforeLongBreak}
              min={1}
              max={10}
              onChange={(count) => timerStore.setSessionsBeforeLongBreak(count)}
            />
          </div>
          <label className="settings-sheet__row">
            <span>Auto next</span>
            <input
              type="checkbox"
              checked={autoStartWork}
              onChange={() => timerStore.toggleAutoStartWork()}
            />
          </label>
          <label className="settings-sheet__row">
            <span>Sound</span>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={() => timerStore.toggleSound()}
            />
          </label>
          <label className="settings-sheet__row">
            <span>Volume</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(volume * 100)}
              onChange={(e) => timerStore.setVolume(Number(e.target.value) / 100)}
            />
          </label>
          <label className="settings-sheet__row">
            <span>Notify</span>
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={() => timerStore.toggleNotifications()}
            />
          </label>
          <label className="settings-sheet__row">
            <span>On top</span>
            <input
              type="checkbox"
              checked={alwaysOnTop}
              onChange={() => timerStore.toggleAlwaysOnTop()}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
