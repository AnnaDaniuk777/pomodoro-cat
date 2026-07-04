import { useEffect, useRef } from 'react';
import { MainScreen } from '@/pages/main';
import { timerStore, useTimer } from '@/entities/timer';
import { electronApi } from '@/shared/lib/electron-api';
import { renderTrayIcon } from '@/shared/lib/tray-icon';

function useTrayIcon() {
  const { mode, status, timeLeft, workDuration, breakTotal } = useTimer();
  const frameRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    frameRef.current += 1;
    const total = mode === 'work' ? workDuration : breakTotal;
    const progress = total > 0 ? 1 - timeLeft / total : 0;

    void renderTrayIcon({
      mode,
      frame: frameRef.current,
      progress,
      running: status === 'running',
    }).then((dataUrl) => {
      if (!cancelled && dataUrl) {
        electronApi.updateTrayIcon(dataUrl);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [mode, status, timeLeft, workDuration, breakTotal]);
}

function useAlwaysOnTop() {
  const { alwaysOnTop } = useTimer();
  useEffect(() => {
    electronApi.setAlwaysOnTop(alwaysOnTop);
  }, [alwaysOnTop]);
}

function useTrayToggle() {
  useEffect(() => {
    electronApi.onTrayToggle(() => {
      if (timerStore.getState().status === 'running') {
        timerStore.pause();
      } else {
        timerStore.start();
      }
    });
  }, []);
}

function useWidgetSync() {
  const { mode, status, timeLeft, workDuration, breakTotal } = useTimer();
  useEffect(() => {
    const total = mode === 'work' ? workDuration : breakTotal;
    electronApi.sendTimerState({
      mode,
      status,
      progress: total > 0 ? 1 - timeLeft / total : 0,
    });
  }, [mode, status, timeLeft, workDuration, breakTotal]);
}

export function App() {
  useTrayIcon();
  useAlwaysOnTop();
  useTrayToggle();
  useWidgetSync();
  return <MainScreen />;
}
