const { app, BrowserWindow, ipcMain, session, Notification } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const log = require('electron-log');
const { setupApiHandlers } = require('./ipcHandlers.cjs');
const { createSystemTray } = require('./systemTray.cjs');
const UpdateManager = require('./updateManager.cjs');

let mainWindow;
let systemTray;
let updateManager;
let serverInstance; // Nueva variable para guardar la instancia del servidor

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

  // Quitamos el evento 'close' que escondía la ventana. 
  // Al no prevenir el cierre, se disparará 'window-all-closed' automáticamente.
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function startBackendServer() {
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  
  log.info(`[Main] Iniciando servidor backend integrado (Modo: ${isDev ? 'Desarrollo' : 'Producción'})`);

  try {
    // Aseguramos que las variables de entorno estén listas para el backend
    process.env.PORT = process.env.BACKEND_PORT || 3001;
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = isDev ? 'development' : 'production';
    }

    // Al ser el proceso principal, podemos importar directamente
    const serverModule = await import(serverPath);
    serverInstance = serverModule.httpServer; // Guardamos la instancia para cerrarla después
    
    log.info('[Main] Servidor backend cargado exitosamente en el proceso principal');
  } catch (err) {
    log.error(`[Main] Error fatal al cargar el backend integrado: ${err.message}`);
    log.error(err.stack);
  }
}

app.whenReady().then(async () => {
  // En producción, forzar NODE_ENV a production si no está definido
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = app.isPackaged ? 'production' : 'development';
  }

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
  if (serverInstance) {
    log.info('[Main] Cerrando servidor HTTP...');
    serverInstance.close();
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
