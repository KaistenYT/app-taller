const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  
  // Notifications
  showNotification: (options) => ipcRenderer.invoke('show-notification', options),
  
  // File dialogs
  openFileDialog: (options) => ipcRenderer.invoke('open-file-dialog', options),
  saveFileDialog: (options) => ipcRenderer.invoke('save-file-dialog', options),
  
  // App Control
  restartApp: () => ipcRenderer.invoke('restart-app'),

  // External links
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  
  // Window controls
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  
  // Backend logs
  onBackendLog: (callback) => {
    const subscription = (_event, data) => callback(data);
    ipcRenderer.on('backend-log', subscription);
    return () => ipcRenderer.removeListener('backend-log', subscription);
  },
  onBackendError: (callback) => {
    const subscription = (_event, data) => callback(data);
    ipcRenderer.on('backend-error', subscription);
    return () => ipcRenderer.removeListener('backend-error', subscription);
  },
  
  // Check if running in Electron
  isElectron: true,
});
