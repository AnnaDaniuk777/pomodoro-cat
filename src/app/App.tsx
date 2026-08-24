import { useEffect, useRef, useState } from 'react';
import { MainScreen } from '@/pages/main';
import { PlayerScreen } from '@/pages/player';
import { TodoScreen } from '@/pages/todo';
import { playerStore, usePlayer } from '@/entities/player';
import { timerStore, useTimer } from '@/entities/timer';
import { electronApi } from '@/shared/lib/electron-api';
import { renderTrayIcon } from '@/shared/lib/tray-icon';
import playerScreenBg from '@/shared/assets/player/player-screen-background.png';
import musicScreenBg from '@/shared/assets/player/music-screen-background.png';
import musicIconImg from '@/shared/assets/player/music-icon.png';
import todoHeaderImg from '@/shared/assets/todo/header.png';

function usePreloadAssets() {
  useEffect(() => {
    [playerScreenBg, musicScreenBg, musicIconImg, todoHeaderImg].forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);
}

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
  const alwaysOnTop = useTimer((state) => state.alwaysOnTop);
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

function usePlayerWidgetSync() {
  const { tracks, isPlaying, currentTime, duration, volume, repeatTrack } =
    usePlayer();

  useEffect(() => {
    electronApi.sendPlayerState({
      hasTrack: tracks.length > 0,
      isPlaying,
      progress: duration > 0 ? currentTime / duration : 0,
      volume,
      repeat: repeatTrack,
    });
  }, [tracks.length, isPlaying, currentTime, duration, volume, repeatTrack]);

  useEffect(() => {
    void playerStore.restorePlaylist();
  }, []);

  useEffect(() => {
    electronApi.onAddPaths((paths) => {
      void (async () => {
        for (const filePath of paths) {
          const data = await electronApi.readAudioFile(filePath);
          if (!data) continue;
          const name =
            filePath.split(/[\\/]/).pop()?.replace(/\.[^.]+$/, '') ?? filePath;
          playerStore.addTrackFromData(name, data, filePath);
        }
      })();
    });
  }, []);

  useEffect(() => {
    electronApi.onPlayerCmd((cmd, value) => {
      if (cmd === 'toggle') playerStore.toggle();
      else if (cmd === 'next') playerStore.next();
      else if (cmd === 'prev') playerStore.prev();
      else if (cmd === 'volume' && typeof value === 'number') {
        playerStore.setVolume(value);
      } else if (cmd === 'seek' && typeof value === 'number') {
        const { duration: total } = playerStore.getState();
        if (total > 0) playerStore.seek(value * total);
      } else if (cmd === 'scrub' && typeof value === 'number') {
        playerStore.scrub(value);
      } else if (cmd === 'repeat') {
        playerStore.toggleRepeat();
      }
    });
  }, []);
}

type Screen = 'main' | 'player' | 'todo';

export function App() {
  const [screen, setScreen] = useState<Screen>('main');
  useTrayIcon();
  useAlwaysOnTop();
  useTrayToggle();
  useWidgetSync();
  usePlayerWidgetSync();
  usePreloadAssets();

  const slot = (name: Screen) =>
    screen === name ? 'screen-slot' : 'screen-slot screen-slot--hidden';

  return (
    <>
      <div className={slot('main')}>
        <MainScreen
          onOpenPlayer={() => setScreen('player')}
          onOpenTodo={() => setScreen('todo')}
        />
      </div>
      <div className={slot('player')}>
        <PlayerScreen
          visible={screen === 'player'}
          onBack={() => setScreen('main')}
        />
      </div>
      <div className={slot('todo')}>
        <TodoScreen onBack={() => setScreen('main')} />
      </div>
    </>
  );
}
