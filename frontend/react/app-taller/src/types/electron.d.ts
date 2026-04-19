/**
 * TypeScript definitions for Electron API
 * Add this file to your project for better IDE support
 */

interface ElectronAPI {
  // App info
  getAppVersion: () => Promise<string>;
  getAppPath: () => Promise<string>;
  
  // Notifications
  showNotification: (options: {
    title: string;
    body: string;
    icon?: string;
  }) => Promise<boolean>;
  
  // File dialogs
  openFileDialog: (options?: {
    title?: string;
    defaultPath?: string;
    buttonLabel?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
    properties?: Array<'openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles' | 'createDirectory' | 'promptToCreate' | 'noResolveAliases' | 'treatPackageAsDirectory' | 'dontAddToRecent'>;
  }) => Promise<{
    canceled: boolean;
    filePaths: string[];
    bookmarks?: string[];
  }>;
  
  // External links
  openExternal: (url: string) => Promise<void>;
  
  // Window controls
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  
  // Backend logs
  onBackendLog: (callback: (data: string) => void) => () => void;
  onBackendError: (callback: (data: string) => void) => () => void;
  
  // Check if running in Electron
  isElectron: boolean;
}

interface Window {
  electronAPI: ElectronAPI;
}
