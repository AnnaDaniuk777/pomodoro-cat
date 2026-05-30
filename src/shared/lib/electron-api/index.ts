/**
 * Thin wrapper around `window.electronAPI` exposed by `electron/preload.ts`.
 *
 * In the browser (npm run dev:web) `window.electronAPI` is `undefined`, so
 * each method is a no-op. In Electron it dispatches the right IPC event.
 */

declare global {
  interface Window {
    electronAPI?: {
      minimize: () => void;
      close: () => void;
    };
  }
}

export const electronApi = {
  minimize: () => window.electronAPI?.minimize(),
  close: () => window.electronAPI?.close(),
};
