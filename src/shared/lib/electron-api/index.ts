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

export type WidgetPlayerState = {
  hasTrack: boolean;
  isPlaying: boolean;
  progress: number;
  volume: number;
};

export type PlayerCommand =
  | 'toggle'
  | 'next'
  | 'prev'
  | 'volume'
  | 'seek'
  | 'scrub';

export type SolidZone = { x: number; y: number; w: number; h: number };

declare global {
  interface Window {
    electronAPI?: {
      minimize: () => void;
      close: () => void;
      setAlwaysOnTop: (flag: boolean) => void;
      playerWidgetSetSolidZones: (zones: SolidZone[]) => void;
      playerWidgetSetDragging: (flag: boolean) => void;
      getFilePath: (file: File) => string | null;
      updateTrayIcon: (dataUrl: string) => void;
      onTrayToggle: (callback: () => void) => void;
      sendTimerState: (state: WidgetTimerState) => void;
      onTimerState: (callback: (state: WidgetTimerState) => void) => void;
      widgetToggle: () => void;
      widgetRestore: () => void;
      widgetSetPosition: (x: number, y: number) => void;
      sendPlayerState: (state: WidgetPlayerState) => void;
      onPlayerState: (callback: (state: WidgetPlayerState) => void) => void;
      playerCmd: (cmd: PlayerCommand, value?: number) => void;
      onPlayerCmd: (
        callback: (cmd: PlayerCommand, value?: number) => void,
      ) => void;
      playerWidgetHide: () => void;
      playerWidgetSetPosition: (x: number, y: number) => void;
      openAddFilesDialog: () => void;
      onAddPaths: (callback: (paths: string[]) => void) => void;
      readAudioFile: (filePath: string) => Promise<Uint8Array | null>;
    };
  }
}

let trayToggleRegistered = false;
let playerCmdRegistered = false;
let addPathsRegistered = false;

export const electronApi = {
  minimize: () => window.electronAPI?.minimize(),
  close: () => window.electronAPI?.close(),
  setAlwaysOnTop: (flag: boolean) => window.electronAPI?.setAlwaysOnTop(flag),
  playerWidgetSetSolidZones: (zones: SolidZone[]) =>
    window.electronAPI?.playerWidgetSetSolidZones(zones),
  playerWidgetSetDragging: (flag: boolean) =>
    window.electronAPI?.playerWidgetSetDragging(flag),
  getFilePath: (file: File) => window.electronAPI?.getFilePath(file) ?? null,
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
  widgetSetPosition: (x: number, y: number) =>
    window.electronAPI?.widgetSetPosition(x, y),
  sendPlayerState: (state: WidgetPlayerState) =>
    window.electronAPI?.sendPlayerState(state),
  onPlayerState: (callback: (state: WidgetPlayerState) => void) =>
    window.electronAPI?.onPlayerState(callback),
  playerCmd: (cmd: PlayerCommand, value?: number) =>
    window.electronAPI?.playerCmd(cmd, value),
  onPlayerCmd: (callback: (cmd: PlayerCommand, value?: number) => void) => {
    if (playerCmdRegistered) return;
    playerCmdRegistered = true;
    window.electronAPI?.onPlayerCmd(callback);
  },
  playerWidgetHide: () => window.electronAPI?.playerWidgetHide(),
  playerWidgetSetPosition: (x: number, y: number) =>
    window.electronAPI?.playerWidgetSetPosition(x, y),
  openAddFilesDialog: () => window.electronAPI?.openAddFilesDialog(),
  onAddPaths: (callback: (paths: string[]) => void) => {
    if (addPathsRegistered) return;
    addPathsRegistered = true;
    window.electronAPI?.onAddPaths(callback);
  },
  readAudioFile: (filePath: string) =>
    window.electronAPI?.readAudioFile(filePath) ?? Promise.resolve(null),
};
