import { contextBridge, ipcRenderer, webUtils } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window:minimize'),
  close: () => ipcRenderer.send('window:close'),
  setAlwaysOnTop: (flag: boolean) =>
    ipcRenderer.send('window:set-always-on-top', flag),
  playerWidgetSetSolidZones: (
    zones: Array<{ x: number; y: number; w: number; h: number }>,
  ) => ipcRenderer.send('player-widget:solid-zones', zones),
  playerWidgetSetDragging: (flag: boolean) =>
    ipcRenderer.send('player-widget:dragging', flag),
  getFilePath: (file: File) => {
    try {
      return webUtils.getPathForFile(file);
    } catch {
      return null;
    }
  },
  updateTrayIcon: (dataUrl: string) => ipcRenderer.send('tray:update', dataUrl),
  onTrayToggle: (callback: () => void) => {
    ipcRenderer.on('tray:toggle-timer', callback);
  },
  sendTimerState: (state: unknown) => ipcRenderer.send('timer:state', state),
  onTimerState: (callback: (state: unknown) => void) => {
    ipcRenderer.on('timer:state', (_event, state) => callback(state));
  },
  widgetToggle: () => ipcRenderer.send('widget:toggle-timer'),
  widgetRestore: () => ipcRenderer.send('widget:restore'),
  widgetSetPosition: (x: number, y: number) =>
    ipcRenderer.send('widget:set-position', x, y),
  sendPlayerState: (state: unknown) => ipcRenderer.send('player:state', state),
  onPlayerState: (callback: (state: unknown) => void) => {
    ipcRenderer.on('player:state', (_event, state) => callback(state));
  },
  playerCmd: (cmd: string, value?: number) =>
    ipcRenderer.send('player:cmd', cmd, value),
  onPlayerCmd: (callback: (cmd: string, value?: number) => void) => {
    ipcRenderer.on('player:cmd', (_event, cmd, value) => callback(cmd, value));
  },
  playerWidgetHide: () => ipcRenderer.send('player-widget:hide'),
  openAddFilesDialog: () => ipcRenderer.send('player:open-add-dialog'),
  onAddPaths: (callback: (paths: string[]) => void) => {
    ipcRenderer.on('player:add-paths', (_event, paths) => callback(paths));
  },
  readAudioFile: (filePath: string) => ipcRenderer.invoke('file:read', filePath),
  playerWidgetSetPosition: (x: number, y: number) =>
    ipcRenderer.send('player-widget:set-position', x, y),
});
