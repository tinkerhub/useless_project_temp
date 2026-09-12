import { app, BrowserWindow, ipcMain, screen } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import isDev from 'electron-is-dev';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 250,
    height: 250,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Start at bottom right
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  mainWindow.setPosition(width - 300, height - 300);

  const url = isDev 
    ? 'http://localhost:5173?mode=desktop' 
    : `file://${path.join(__dirname, '../dist/index.html')}?mode=desktop`;

  mainWindow.loadURL(url);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC handlers for Desktop Pet
ipcMain.on('pet-quit', () => {
  app.quit();
});

ipcMain.on('pet-hide', () => {
  if (mainWindow) {
    mainWindow.hide();
  }
});

ipcMain.on('pet-open-main', () => {
  import('electron').then(({ shell }) => {
    shell.openExternal('http://localhost:5173');
  });
});
