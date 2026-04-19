const { app, dialog } = require('electron');
const log = require('electron-log');

// Simple auto-update manager
class UpdateManager {
  constructor() {
    this.autoUpdateEnabled = process.env.ENABLE_AUTO_UPDATE === 'true';
    this.updateURL = process.env.UPDATE_SERVER_URL;
    this.currentVersion = app.getVersion();
  }

  async init() {
    if (!this.autoUpdateEnabled || !this.updateURL) {
      log.info('[UpdateManager] Auto-update disabled');
      return;
    }

    log.info('[UpdateManager] Initializing auto-update');
    
    // Note: For production, you should use electron-updater package
    // This is a placeholder for the update mechanism
    
    try {
      await this.checkForUpdates();
    } catch (error) {
      log.error('[UpdateManager] Failed to initialize:', error);
    }
  }

  async checkForUpdates() {
    if (!this.autoUpdateEnabled) return;

    log.info('[UpdateManager] Checking for updates...');

    try {
      // Fetch update manifest
      const response = await fetch(`${this.updateURL}/updates.json`);
      const manifest = await response.json();

      const latestVersion = manifest.version;
      const downloadURL = manifest.downloadURL;

      if (this.isNewerVersion(latestVersion, this.currentVersion)) {
        log.info(`[UpdateManager] Update available: ${latestVersion}`);
        await this.promptUpdate(latestVersion, downloadURL);
      } else {
        log.info('[UpdateManager] Already up to date');
      }
    } catch (error) {
      log.error('[UpdateManager] Failed to check for updates:', error);
    }
  }

  isNewerVersion(latest, current) {
    const latestParts = latest.split('.').map(Number);
    const currentParts = current.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      if (latestParts[i] > currentParts[i]) return true;
      if (latestParts[i] < currentParts[i]) return false;
    }

    return false;
  }

  async promptUpdate(version, downloadURL) {
    const result = await dialog.showMessageBox({
      type: 'info',
      buttons: ['Download', 'Later'],
      defaultId: 0,
      title: 'Update Available',
      message: `A new version (${version}) is available!`,
      detail: `Current version: ${this.currentVersion}\n\nWould you like to download the update now?`,
    });

    if (result.response === 0) {
      await this.downloadUpdate(version, downloadURL);
    }
  }

  async downloadUpdate(version, downloadURL) {
    log.info(`[UpdateManager] Downloading update ${version}...`);
    
    // For production, use electron-updater or implement proper download logic
    // This is a simplified version
    
    dialog.showMessageBox({
      type: 'info',
      buttons: ['OK'],
      title: 'Download Started',
      message: 'Please visit the download page to get the latest version.',
      detail: downloadURL,
    });

    const { shell } = require('electron');
    await shell.openExternal(downloadURL);
  }

  async installUpdate() {
    log.info('[UpdateManager] Installing update...');
    
    // Quit and install update
    app.quit();
  }
}

module.exports = UpdateManager;
