import { useSyncExternalStore } from 'react';
import { playBreakEndChime, playWorkEndChime } from '@/shared/lib/audio';

export type TimerMode = 'work' | 'break';
export type TimerStatus = 'idle' | 'running' | 'paused';

export type TimerState = {
  mode: TimerMode;
  status: TimerStatus;
  timeLeft: number;
  breakTotal: number;
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
  completedSessions: number;
  todayCount: number;
  soundEnabled: boolean;
  volume: number;
  autoStartWork: boolean;
  notificationsEnabled: boolean;
  alwaysOnTop: boolean;
};

export const DEFAULT_WORK_DURATION = 25 * 60;
export const DEFAULT_BREAK_DURATION = 5 * 60;
export const DEFAULT_LONG_BREAK_DURATION = 15 * 60;

const STORAGE_KEY = 'pomodoro-cat-settings';

function loadPersisted(): Partial<TimerState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw) as Record<string, unknown>;
    const patch: Partial<TimerState> = {};
    if (typeof data.workDuration === 'number') patch.workDuration = data.workDuration;
    if (typeof data.breakDuration === 'number') patch.breakDuration = data.breakDuration;
    if (typeof data.longBreakDuration === 'number') patch.longBreakDuration = data.longBreakDuration;
    if (typeof data.sessionsBeforeLongBreak === 'number') patch.sessionsBeforeLongBreak = data.sessionsBeforeLongBreak;
    if (typeof data.soundEnabled === 'boolean') patch.soundEnabled = data.soundEnabled;
    if (typeof data.volume === 'number') patch.volume = data.volume;
    if (typeof data.autoStartWork === 'boolean') patch.autoStartWork = data.autoStartWork;
    if (typeof data.notificationsEnabled === 'boolean') patch.notificationsEnabled = data.notificationsEnabled;
    if (typeof data.alwaysOnTop === 'boolean') patch.alwaysOnTop = data.alwaysOnTop;
    if (data.todayDate === new Date().toDateString() && typeof data.todayCount === 'number') {
      patch.todayCount = data.todayCount;
    }
    return patch;
  } catch {
    return {};
  }
}

const persisted = loadPersisted();

let state: TimerState = {
  mode: 'work',
  status: 'idle',
  timeLeft: persisted.workDuration ?? DEFAULT_WORK_DURATION,
  breakTotal: persisted.breakDuration ?? DEFAULT_BREAK_DURATION,
  workDuration: DEFAULT_WORK_DURATION,
  breakDuration: DEFAULT_BREAK_DURATION,
  longBreakDuration: DEFAULT_LONG_BREAK_DURATION,
  sessionsBeforeLongBreak: 4,
  completedSessions: 0,
  todayCount: 0,
  soundEnabled: true,
  volume: 0.5,
  autoStartWork: false,
  notificationsEnabled: true,
  alwaysOnTop: false,
  ...persisted,
};

const listeners = new Set<() => void>();
let intervalId: ReturnType<typeof setInterval> | null = null;

function setState(patch: Partial<TimerState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

function persist() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        workDuration: state.workDuration,
        breakDuration: state.breakDuration,
        longBreakDuration: state.longBreakDuration,
        sessionsBeforeLongBreak: state.sessionsBeforeLongBreak,
        soundEnabled: state.soundEnabled,
        volume: state.volume,
        autoStartWork: state.autoStartWork,
        notificationsEnabled: state.notificationsEnabled,
        alwaysOnTop: state.alwaysOnTop,
        todayDate: new Date().toDateString(),
        todayCount: state.todayCount,
      }),
    );
  } catch {
    /* storage unavailable */
  }
}

function notify(body: string) {
  if (!state.notificationsEnabled) return;
  try {
    new Notification('Catodoro', { body });
  } catch {
    /* notifications unavailable */
  }
}

function stopTicking() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function tick() {
  if (state.timeLeft > 1) {
    setState({ timeLeft: state.timeLeft - 1 });
    return;
  }
  if (state.mode === 'work') {
    if (state.soundEnabled) playWorkEndChime(state.volume);
    const sessions = state.completedSessions + 1;
    const isLongBreak = sessions % state.sessionsBeforeLongBreak === 0;
    const total = isLongBreak ? state.longBreakDuration : state.breakDuration;
    notify(isLongBreak ? 'Session done — time for a long break!' : 'Session done — break time!');
    setState({
      mode: 'break',
      timeLeft: total,
      breakTotal: total,
      completedSessions: sessions,
      todayCount: state.todayCount + 1,
    });
    persist();
  } else {
    if (state.soundEnabled) playBreakEndChime(state.volume);
    if (state.autoStartWork) {
      notify('Break over — back to work!');
      setState({ mode: 'work', timeLeft: state.workDuration });
    } else {
      notify('Break over!');
      stopTicking();
      setState({ mode: 'work', status: 'idle', timeLeft: state.workDuration });
    }
  }
}

function startTicking() {
  if (intervalId === null) {
    intervalId = setInterval(tick, 1000);
  }
}

export const timerStore = {
  start() {
    startTicking();
    setState({ status: 'running' });
  },
  pause() {
    stopTicking();
    setState({ status: 'paused' });
  },
  reset() {
    stopTicking();
    setState({ mode: 'work', status: 'idle', timeLeft: state.workDuration });
  },
  setWorkDuration(seconds: number) {
    const patch: Partial<TimerState> = { workDuration: seconds };
    if (state.status === 'idle' && state.mode === 'work') {
      patch.timeLeft = seconds;
    }
    setState(patch);
    persist();
  },
  setBreakDuration(seconds: number) {
    setState({ breakDuration: seconds });
    persist();
  },
  setLongBreakDuration(seconds: number) {
    setState({ longBreakDuration: seconds });
    persist();
  },
  setSessionsBeforeLongBreak(count: number) {
    setState({ sessionsBeforeLongBreak: Math.max(1, count) });
    persist();
  },
  toggleSound() {
    setState({ soundEnabled: !state.soundEnabled });
    persist();
  },
  setVolume(volume: number) {
    setState({ volume: Math.min(1, Math.max(0, volume)) });
    persist();
  },
  toggleAutoStartWork() {
    setState({ autoStartWork: !state.autoStartWork });
    persist();
  },
  toggleNotifications() {
    setState({ notificationsEnabled: !state.notificationsEnabled });
    persist();
  },
  toggleAlwaysOnTop() {
    setState({ alwaysOnTop: !state.alwaysOnTop });
    persist();
  },
  getState: () => state,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export function useTimer(): TimerState {
  return useSyncExternalStore(timerStore.subscribe, timerStore.getState);
}
