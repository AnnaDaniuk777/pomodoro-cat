import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  nativeImage,
  screen,
  Tray,
} from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WINDOW_WIDTH, WINDOW_HEIGHT } from '../shared/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

app.setName('Catodoro');
app.setAppUserModelId('Catodoro');

const WIDGET_SIZE = 84;
const WIDGET_MARGIN = 16;

let win: BrowserWindow | null = null;
let widgetWin: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

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
    },
  });

  const { workArea } = screen.getPrimaryDisplay();
  widgetWin.setPosition(
    workArea.x + workArea.width - WIDGET_SIZE - WIDGET_MARGIN,
    workArea.y + workArea.height - WIDGET_SIZE - WIDGET_MARGIN,
  );

  if (VITE_DEV_SERVER_URL) {
    widgetWin.loadURL(`${VITE_DEV_SERVER_URL}#widget`);
  } else {
    widgetWin.loadFile(path.join(__dirname, '../../dist/index.html'), {
      hash: 'widget',
    });
  }
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
    icon: path.join(__dirname, '../../build/app-icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

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

  win.on('hide', () => widgetWin?.showInactive());
  win.on('minimize', () => widgetWin?.showInactive());
  win.on('show', () => widgetWin?.hide());
  win.on('restore', () => widgetWin?.hide());

  ipcMain.on('window:minimize', () => win?.minimize());
  ipcMain.on('window:close', () => win?.close());
  ipcMain.on('window:set-always-on-top', (_event, flag: boolean) => {
    win?.setAlwaysOnTop(Boolean(flag));
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
}

app.whenReady().then(() => {
  createTray();
  createWindow();
  createWidget();
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
