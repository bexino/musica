const {app, BrowserWindow, dialog, screen} = require('electron');
const path = require('path');

let mainWindow;

// Acquire the lock before creating a window or starting to load song assets.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });

  app.whenReady().then(() => {
    const available = screen.getPrimaryDisplay().workAreaSize;
    const width = Math.min(1280, Math.floor(available.width * 0.92));
    const height = Math.min(800, Math.floor(available.height * 0.92));
    mainWindow = new BrowserWindow({
      width, height, minWidth: Math.min(640, width), minHeight: Math.min(360, height),
      center: true,
      title: '舞台歌词播放器 · 正在加载',
      backgroundColor: '#211a28', show: true, autoHideMenuBar: true,
      webPreferences: {nodeIntegration: false, contextIsolation: true, sandbox: true}
    });
    mainWindow.webContents.setWindowOpenHandler(() => ({action: 'deny'}));
    mainWindow.webContents.on('will-navigate', (event, url) => {
      if (!url.startsWith('file:')) event.preventDefault();
    });
    // Show immediately; the HTML loading message appears before React is ready.
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html')).catch(() => {
      if (!mainWindow || mainWindow.isDestroyed()) return;
      dialog.showErrorBox('加载失败', '播放器加载失败，请关闭后重新打开程序。');
      mainWindow.close();
    });
    mainWindow.on('closed', () => { mainWindow = null; });
  });
  app.on('window-all-closed', () => app.quit());
}
