const { Tray, Menu, nativeImage } = require('electron');
const path = require('path');

let tray;

function createSystemTray(mainWindow) {
  // Try to load icon, fallback to default
  let iconPath;
  const possiblePaths = [
    path.join(__dirname, '../frontend/react/app-taller/public/icon.png'),
    path.join(__dirname, '../icon.png'),
  ];

  for (const p of possiblePaths) {
    try {
      const icon = nativeImage.createFromPath(p);
      if (!icon.isEmpty()) {
        iconPath = p;
        break;
      }
    } catch (e) {
      // Continue to next path
    }
  }

  tray = new Tray(iconPath || nativeImage.createEmpty());

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Abrir NanoLogic',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    {
      label: 'Minimizar a Bandeja',
      click: () => {
        if (mainWindow) {
          mainWindow.hide();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Reiniciar Backend',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('restart-backend');
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Salir',
      click: () => {
        const { app } = require('electron');
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip('NanoLogic - Sistema de Gestión de Taller');
  tray.setContextMenu(contextMenu);

  // Click to show/hide
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  return tray;
}

function updateTrayTooltip(text) {
  if (tray) {
    tray.setToolTip(text);
  }
}

function showTrayNotification(title, body) {
  if (tray) {
    // Display balloon notification
    tray.displayBalloon({
      title,
      content: body,
      icon: nativeImage.createEmpty(),
    });
  }
}

module.exports = {
  createSystemTray,
  updateTrayTooltip,
  showTrayNotification,
};
