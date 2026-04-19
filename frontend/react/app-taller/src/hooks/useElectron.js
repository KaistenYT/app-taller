import { useState, useEffect } from 'react';

export function useElectron() {
  const [appVersion, setAppVersion] = useState(null);
  const [appPath, setAppPath] = useState(null);
  const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron;

  useEffect(() => {
    if (isElectron) {
      window.electronAPI.getAppVersion().then(setAppVersion).catch(console.error);
      window.electronAPI.getAppPath().then(setAppPath).catch(console.error);
    }
  }, [isElectron]);

  const showNotification = async (options) => {
    if (!isElectron) {
      console.warn('Notifications only available in Electron mode');
      return;
    }
    return window.electronAPI.showNotification(options);
  };

  const openFileDialog = async (options = {}) => {
    if (!isElectron) {
      console.warn('File dialogs only available in Electron mode');
      return;
    }
    return window.electronAPI.openFileDialog(options);
  };

  const openExternal = async (url) => {
    if (!isElectron) {
      window.open(url, '_blank');
      return;
    }
    return window.electronAPI.openExternal(url);
  };

  const minimizeWindow = () => {
    if (!isElectron) return;
    window.electronAPI.minimizeWindow();
  };

  const maximizeWindow = () => {
    if (!isElectron) return;
    window.electronAPI.maximizeWindow();
  };

  const closeWindow = () => {
    if (!isElectron) return;
    window.electronAPI.closeWindow();
  };

  return {
    isElectron,
    appVersion,
    appPath,
    showNotification,
    openFileDialog,
    openExternal,
    minimizeWindow,
    maximizeWindow,
    closeWindow,
  };
}
