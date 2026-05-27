import { contextBridge, ipcRenderer } from 'electron';

console.log('[preload] script loaded');

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => {
    console.log('[preload] minimize called');
    ipcRenderer.send('window:minimize');
  },
  close: () => {
    console.log('[preload] close called');
    ipcRenderer.send('window:close');
  },
});

console.log('[preload] electronAPI exposed');
