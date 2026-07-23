import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  nativeImage,
  screen,
  Tray,
} from 'electron';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { WINDOW_WIDTH, WINDOW_HEIGHT } from '../shared/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

app.setName('Catodoro');
app.setAppUserModelId('Catodoro');
Menu.setApplicationMenu(null);

function enforceContentSize(
  target: BrowserWindow,
  width: number,
  height: number,
) {
  const [w, h] = target.getContentSize();
  if (w !== width || h !== height) {
    target.setResizable(true);
    target.setContentSize(width, height);
    target.setResizable(false);
  }
}

function lockZoom(target: BrowserWindow) {
  target.webContents.on('did-finish-load', () => {
    target.webContents.setZoomFactor(1);
    void target.webContents.setVisualZoomLevelLimits(1, 1);
  });
  target.webContents.on('zoom-changed', (event) => {
    event.preventDefault();
    target.webContents.setZoomFactor(1);
  });
  target.webContents.on('before-input-event', (event, input) => {
    const zoomKeys = ['+', '-', '=', '0'];
    if ((input.control || input.meta) && zoomKeys.includes(input.key)) {
      event.preventDefault();
    }
  });
}

const WIDGET_SIZE = 84;
const WIDGET_MARGIN = 16;
const PLAYER_WIDGET_WIDTH = 314;
const PLAYER_WIDGET_HEIGHT = 240;

let win: BrowserWindow | null = null;
let widgetWin: BrowserWindow | null = null;
let playerWidgetWin: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;
let playerHasTrack = false;

type SolidZone = { x: number; y: number; w: number; h: number };
let playerWidgetZones: SolidZone[] = [];
let playerWidgetDragging = false;
let playerWidgetIgnoring = false;

function pollPlayerWidgetMouse() {
  const target = playerWidgetWin;
  if (!target || target.isDestroyed() || !target.isVisible()) {
    playerWidgetIgnoring = false;
    return;
  }
  let ignore = false;
  if (!playerWidgetDragging) {
    const pt = screen.getCursorScreenPoint();
    const b = target.getBounds();
    const lx = pt.x - b.x;
    const ly = pt.y - b.y;
    const inside = lx >= 0 && ly >= 0 && lx < b.width && ly < b.height;
    const solid = playerWidgetZones.some(
      (z) => lx >= z.x && lx <= z.x + z.w && ly >= z.y && ly <= z.y + z.h,
    );
    ignore = inside && !solid;
  }
  if (ignore !== playerWidgetIgnoring) {
    playerWidgetIgnoring = ignore;
    target.setIgnoreMouseEvents(ignore);
  }
}

function isMainHidden(): boolean {
  return !!win && (!win.isVisible() || win.isMinimized());
}

function createTray() {
  const iconPath = path.join(__dirname, '../../build/app-icon.png');
  const icon = nativeImage
    .createFromPath(iconPath)
    .resize({ width: 16, height: 16 });
  tray = new Tray(icon);
  tray.setToolTip('Catodoro');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Show', click: () => win?.show() },
      {
        label: 'Quit',
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ]),
  );
  tray.on('click', () => win?.webContents.send('tray:toggle-timer'));
  tray.on('double-click', () => win?.show());
}

function createWidget() {
  widgetWin = new BrowserWindow({
    width: WIDGET_SIZE,
    height: WIDGET_SIZE,
    useContentSize: true,
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false,
    },
  });

  enforceContentSize(widgetWin, WIDGET_SIZE, WIDGET_SIZE);
  const { workArea } = screen.getPrimaryDisplay();
  widgetWin.setPosition(
    workArea.x + workArea.width - WIDGET_SIZE - WIDGET_MARGIN,
    workArea.y + workArea.height - WIDGET_SIZE - WIDGET_MARGIN,
  );

  lockZoom(widgetWin);
  if (VITE_DEV_SERVER_URL) {
    widgetWin.loadURL(`${VITE_DEV_SERVER_URL}#widget`);
  } else {
    widgetWin.loadFile(path.join(__dirname, '../../dist/index.html'), {
      hash: 'widget',
    });
  }
}

function createPlayerWidget() {
  playerWidgetWin = new BrowserWindow({
    width: PLAYER_WIDGET_WIDTH,
    height: PLAYER_WIDGET_HEIGHT,
    useContentSize: true,
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false,
    },
  });

  enforceContentSize(playerWidgetWin, PLAYER_WIDGET_WIDTH, PLAYER_WIDGET_HEIGHT);
  lockZoom(playerWidgetWin);
  const { workArea } = screen.getPrimaryDisplay();
  playerWidgetWin.setPosition(
    workArea.x + workArea.width - PLAYER_WIDGET_WIDTH - WIDGET_MARGIN,
    workArea.y +
      workArea.height -
      WIDGET_SIZE -
      WIDGET_MARGIN -
      PLAYER_WIDGET_HEIGHT -
      8,
  );

  if (VITE_DEV_SERVER_URL) {
    playerWidgetWin.loadURL(`${VITE_DEV_SERVER_URL}#player-widget`);
  } else {
    playerWidgetWin.loadFile(path.join(__dirname, '../../dist/index.html'), {
      hash: 'player-widget',
    });
  }

  setInterval(pollPlayerWidgetMouse, 80);
}

function createWindow() {
  win = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    useContentSize: true,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    frame: false,
    thickFrame: false,
    icon: path.join(__dirname, '../../build/app-icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false,
    },
  });

  enforceContentSize(win, WINDOW_WIDTH, WINDOW_HEIGHT);
  lockZoom(win);
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  win.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      win?.hide();
    }
  });

  const onMainHidden = () => {
    widgetWin?.showInactive();
    if (playerHasTrack) playerWidgetWin?.showInactive();
  };
  const onMainShown = () => {
    widgetWin?.hide();
    playerWidgetWin?.hide();
    if (win) enforceContentSize(win, WINDOW_WIDTH, WINDOW_HEIGHT);
  };
  win.on('hide', onMainHidden);
  win.on('minimize', onMainHidden);
  win.on('show', onMainShown);
  win.on('restore', onMainShown);

  ipcMain.on('window:minimize', () => win?.minimize());
  ipcMain.on('window:close', () => win?.close());
  ipcMain.on('window:set-always-on-top', (_event, flag: boolean) => {
    win?.setAlwaysOnTop(Boolean(flag));
  });
  ipcMain.on(
    'player-widget:solid-zones',
    (_event, zones: SolidZone[]) => {
      if (Array.isArray(zones)) {
        playerWidgetZones = zones.filter(
          (z) =>
            z &&
            typeof z.x === 'number' &&
            typeof z.y === 'number' &&
            typeof z.w === 'number' &&
            typeof z.h === 'number',
        );
      }
    },
  );
  ipcMain.on('player-widget:dragging', (_event, flag: boolean) => {
    playerWidgetDragging = Boolean(flag);
  });
  ipcMain.on('tray:update', (_event, dataUrl: string) => {
    if (tray && typeof dataUrl === 'string' && dataUrl.startsWith('data:image')) {
      tray.setImage(nativeImage.createFromDataURL(dataUrl));
    }
  });
  ipcMain.on('timer:state', (_event, state: unknown) => {
    widgetWin?.webContents.send('timer:state', state);
  });
  ipcMain.on('widget:toggle-timer', () => {
    win?.webContents.send('tray:toggle-timer');
  });
  ipcMain.on('widget:restore', () => win?.show());
  ipcMain.on('widget:set-position', (_event, x: number, y: number) => {
    if (typeof x === 'number' && typeof y === 'number') {
      widgetWin?.setPosition(Math.round(x), Math.round(y));
    }
  });
  ipcMain.on('player:state', (_event, state: { hasTrack?: boolean }) => {
    playerHasTrack = !!state?.hasTrack;
    playerWidgetWin?.webContents.send('player:state', state);
    if (isMainHidden()) {
      if (playerHasTrack && !playerWidgetWin?.isVisible()) {
        playerWidgetWin?.showInactive();
      }
      if (!playerHasTrack && playerWidgetWin?.isVisible()) {
        playerWidgetWin.hide();
      }
    }
  });
  ipcMain.on('player:cmd', (_event, cmd: string, value?: number) => {
    win?.webContents.send('player:cmd', cmd, value);
  });
  ipcMain.on('player-widget:hide', () => playerWidgetWin?.hide());
  ipcMain.on('player:open-add-dialog', () => {
    void dialog
      .showOpenDialog({
        properties: ['openFile', 'multiSelections'],
        filters: [
          { name: 'Audio', extensions: ['mp3', 'wav', 'ogg', 'm4a', 'flac'] },
        ],
      })
      .then(({ canceled, filePaths }) => {
        if (!canceled && filePaths.length > 0) {
          win?.webContents.send('player:add-paths', filePaths);
        }
      });
  });
  ipcMain.handle('file:read', async (_event, filePath: string) => {
    if (typeof filePath !== 'string') return null;
    if (!/\.(mp3|wav|ogg|m4a|flac)$/i.test(filePath)) return null;
    try {
      return await readFile(filePath);
    } catch {
      return null;
    }
  });
  ipcMain.on('player-widget:set-position', (_event, x: number, y: number) => {
    if (typeof x === 'number' && typeof y === 'number') {
      playerWidgetWin?.setPosition(Math.round(x), Math.round(y));
    }
  });
}

app.whenReady().then(() => {
  createTray();
  createWindow();
  createWidget();
  createPlayerWidget();
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
