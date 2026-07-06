import { playerStore, usePlayer } from '@/entities/player';
import { timerStore, useTimer } from '@/entities/timer';
import { i18n, t, useLang } from '@/shared/lib/i18n';
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
  const { repeatPlaylist } = usePlayer();
  const lang = useLang();

  return (
    <div className="settings-overlay">
      <div className="settings-sheet">
        <button type="button" className="settings-sheet__close" onClick={onClose}>
          ×
        </button>
        <h2 className="settings-sheet__title">{t('settingsTitle')}</h2>
        <div className="settings-sheet__scroll">
          <div className="settings-sheet__row">
            <span>{t('workMin')}</span>
            <NumberStepper
              value={Math.round(workDuration / 60)}
              min={1}
              max={60}
              onChange={(minutes) => timerStore.setWorkDuration(minutes * 60)}
            />
          </div>
          <div className="settings-sheet__row">
            <span>{t('breakMin')}</span>
            <NumberStepper
              value={Math.round(breakDuration / 60)}
              min={1}
              max={60}
              onChange={(minutes) => timerStore.setBreakDuration(minutes * 60)}
            />
          </div>
          <div className="settings-sheet__row">
            <span>{t('longBreak')}</span>
            <NumberStepper
              value={Math.round(longBreakDuration / 60)}
              min={1}
              max={60}
              onChange={(minutes) => timerStore.setLongBreakDuration(minutes * 60)}
            />
          </div>
          <div className="settings-sheet__row">
            <span>{t('sessions')}</span>
            <NumberStepper
              value={sessionsBeforeLongBreak}
              min={1}
              max={10}
              onChange={(count) => timerStore.setSessionsBeforeLongBreak(count)}
            />
          </div>
          <label className="settings-sheet__row">
            <span>{t('autoNext')}</span>
            <input
              type="checkbox"
              checked={autoStartWork}
              onChange={() => timerStore.toggleAutoStartWork()}
            />
          </label>
          <label className="settings-sheet__row">
            <span>{t('sound')}</span>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={() => timerStore.toggleSound()}
            />
          </label>
          <label className="settings-sheet__row">
            <span>{t('volume')}</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(volume * 100)}
              onChange={(e) => timerStore.setVolume(Number(e.target.value) / 100)}
            />
          </label>
          <label className="settings-sheet__row">
            <span>{t('notify')}</span>
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={() => timerStore.toggleNotifications()}
            />
          </label>
          <label className="settings-sheet__row">
            <span>{t('onTop')}</span>
            <input
              type="checkbox"
              checked={alwaysOnTop}
              onChange={() => timerStore.toggleAlwaysOnTop()}
            />
          </label>
          <label className="settings-sheet__row">
            <span>{t('repeat')}</span>
            <input
              type="checkbox"
              checked={repeatPlaylist}
              onChange={() => playerStore.toggleRepeat()}
            />
          </label>
          <div className="settings-sheet__row">
            <span>{t('language')}</span>
            <button
              type="button"
              className="settings-sheet__lang"
              onClick={() => i18n.setLang(lang === 'en' ? 'ru' : 'en')}
            >
              {lang === 'en' ? 'EN' : 'RU'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
