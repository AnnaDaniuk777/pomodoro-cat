import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window:minimize'),
  close: () => ipcRenderer.send('window:close'),
  setAlwaysOnTop: (flag: boolean) =>
    ipcRenderer.send('window:set-always-on-top', flag),
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
});
