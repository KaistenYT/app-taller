const { app, BrowserWindow, ipcMain, session, Notification } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const log = require('electron-log');
const { setupApiHandlers } = require('./ipcHandlers.cjs');
const { createSystemTray } = require('./systemTray.cjs');
const UpdateManager = require('./updateManager.cjs');

let mainWindow;
let backendProcess;
let systemTray;
let updateManager;

// Bandera para controlar el cierre real de la aplicación
app.isQuitting = false;

// Configure logging
log.transports.file.level = 'info';
log.transports.console.level = 'debug';

function createWindow() {
  const isDev = process.env.NODE_ENV === 'development';
  const appPath = app.getAppPath();

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
    backgroundColor: '#0f172a',
    icon: path.join(appPath, isDev ? 'frontend/react/app-taller/public/icon.png' : 'frontend/react/app-taller/dist/icon.png'),
    titleBarStyle: 'hidden',
    title: 'Sistema de Gestión de Taller',
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(appPath, 'frontend/react/app-taller/dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // Create system tray
    systemTray = createSystemTray(mainWindow);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Minimizar a la bandeja en lugar de cerrar (Solo en producción)
  mainWindow.on('close', (event) => {
    if (!isDev && process.platform !== 'darwin' && !app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
    // En desarrollo (isDev), no prevenimos el cierre, 
    // por lo que window-all-closed se disparará y llamará a app.quit()
  });
}

async function startBackendServer() {
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  const appPath = app.getAppPath();
  const backendPath = path.join(appPath, 'backend/server.js');
  const port = process.env.BACKEND_PORT || 3001;

  log.info(`[Main] Starting backend from: ${backendPath}`);

  backendProcess = spawn('node', [backendPath], {
    env: {
      ...process.env,
      PORT: port,
      NODE_ENV: 'production',
    },
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  backendProcess.stdout.on('data', (data) => {
    log.info(`[Backend] ${data.toString()}`);
    if (mainWindow) {
      mainWindow.webContents.send('backend-log', data.toString());
    }
  });

  backendProcess.stderr.on('data', (data) => {
    log.error(`[Backend Error] ${data.toString()}`);
    if (mainWindow) {
      mainWindow.webContents.send('backend-error', data.toString());
    }
  });

  backendProcess.on('error', (error) => {
    log.error('[Backend] Failed to start:', error);
  });

  backendProcess.on('exit', (code, signal) => {
    log.info(`[Backend] Process exited with code ${code}, signal ${signal}`);
  });

  // Wait for backend to be ready
  await new Promise((resolve) => setTimeout(resolve, 2000));
}

app.whenReady().then(async () => {
  // Setup IPC handlers
  setupApiHandlers();

  // Initialize update manager
  updateManager = new UpdateManager();
  await updateManager.init();

  // Start backend server only in production
  if (process.env.NODE_ENV !== 'development') {
    try {
      await startBackendServer();
      log.info('[Main] Backend server started');
    } catch (error) {
      log.error('[Main] Failed to start backend:', error);
    }
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
  if (backendProcess) {
    backendProcess.kill();
  }
});

// IPC Handlers
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-app-path', () => {
  return app.getPath('userData');
});

ipcMain.handle('show-notification', async (event, options) => {
  const { title, body, icon } = options;
  return new Promise((resolve) => {
    const notification = new Notification({
      title,
      body,
      icon,
    });
    notification.show();
    resolve(true);
  });
});

ipcMain.handle('open-file-dialog', async (event, options) => {
  const { dialog } = require('electron');
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

ipcMain.handle('save-file-dialog', async (event, options) => {
  const { dialog } = require('electron');
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle('restart-app', () => {
  app.relaunch();
  app.exit(0);
});

ipcMain.handle('open-external', async (event, url) => {
  const { shell } = require('electron');
  await shell.openExternal(url);
});

// Handle window controls
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});
