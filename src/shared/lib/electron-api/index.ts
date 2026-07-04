/**
 * Thin wrapper around `window.electronAPI` exposed by `electron/preload.ts`.
 *
 * In the browser (npm run dev:web) `window.electronAPI` is `undefined`, so
 * each method is a no-op. In Electron it dispatches the right IPC event.
 */

export type WidgetTimerState = {
  mode: 'work' | 'break';
  status: 'idle' | 'running' | 'paused';
  progress: number;
};

declare global {
  interface Window {
    electronAPI?: {
      minimize: () => void;
      close: () => void;
      setAlwaysOnTop: (flag: boolean) => void;
      updateTrayIcon: (dataUrl: string) => void;
      onTrayToggle: (callback: () => void) => void;
      sendTimerState: (state: WidgetTimerState) => void;
      onTimerState: (callback: (state: WidgetTimerState) => void) => void;
      widgetToggle: () => void;
      widgetRestore: () => void;
    };
  }
}

let trayToggleRegistered = false;

export const electronApi = {
  minimize: () => window.electronAPI?.minimize(),
  close: () => window.electronAPI?.close(),
  setAlwaysOnTop: (flag: boolean) => window.electronAPI?.setAlwaysOnTop(flag),
  updateTrayIcon: (dataUrl: string) =>
    window.electronAPI?.updateTrayIcon(dataUrl),
  onTrayToggle: (callback: () => void) => {
    if (trayToggleRegistered) return;
    trayToggleRegistered = true;
    window.electronAPI?.onTrayToggle(callback);
  },
  sendTimerState: (state: WidgetTimerState) =>
    window.electronAPI?.sendTimerState(state),
  onTimerState: (callback: (state: WidgetTimerState) => void) =>
    window.electronAPI?.onTimerState(callback),
  widgetToggle: () => window.electronAPI?.widgetToggle(),
  widgetRestore: () => window.electronAPI?.widgetRestore(),
};
