import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { DeviceService } from "../backend/service/deviceService.js";
import { ReceptionService } from "../backend/service/receptionService.js";
import { ClientService } from "../backend/service/clientService.js";
import { ReportService } from "../backend/service/reportService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  win.loadFile(path.join(__dirname, "../frontend/views/index.html"));
};

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

/*
  Helper to standardize handlers: valida entrada, ejecuta la acción y captura errores.
  Devuelve el resultado directo (objeto o valores) o relanza el error para que el frontend lo maneje.
*/
const safeHandler = (fn) => async (event, ...args) => {
  try {
    return await fn(event, ...args);
  } catch (err) {
    console.error("IPC Error:", err);
    // re-lanzar para que el renderer reciba el error y pueda mostrarlo
    throw err;
  }
};

/* Devices */
ipcMain.handle(
  "list-devices",
  safeHandler(async () => {
    return await DeviceService.listDevices();
  })
);

ipcMain.handle(
  "get-device",
  safeHandler(async (event, id) => {
    if (!id) throw new Error("get-device: id is required");
    return await DeviceService.getDevice(id);
  })
);

ipcMain.handle(
  "get-device-by-serial",
  safeHandler(async (event, serial) => {
    if (!serial) throw new Error("get-device-by-serial: serial is required");
    return await DeviceService.getDeviceBySerial(serial);
  })
);

ipcMain.handle(
  "create-device",
  safeHandler(async (event, deviceData) => {
    if (!deviceData || typeof deviceData !== "object")
      throw new Error("create-device: deviceData is required");
    return await DeviceService.createDevice(deviceData);
  })
);

ipcMain.handle(
  "upsert-device-by-serial",
  safeHandler(async (event, deviceData) => {
    if (!deviceData || typeof deviceData !== "object")
      throw new Error("upsert-device-by-serial: deviceData is required");
    return await DeviceService.upsertDeviceBySerial(deviceData);
  })
);

ipcMain.handle(
  "update-device",
  safeHandler(async (event, id, deviceData) => {
    if (!id) throw new Error("update-device: id is required");
    if (!deviceData || typeof deviceData !== "object")
      throw new Error("update-device: deviceData is required");
    return await DeviceService.updateDevice(id, deviceData);
  })
);

ipcMain.handle(
  "delete-device",
  safeHandler(async (event, id) => {
    if (!id) throw new Error("delete-device: id is required");
    return await DeviceService.deleteDevice(id);
  })
);

/* Clients */
ipcMain.handle(
  "list-clients",
  safeHandler(async () => {
    return await ClientService.listClients();
  })
);

ipcMain.handle(
  "get-client",
  safeHandler(async (event, id) => {
    if (!id) throw new Error("get-client: id is required");
    return await ClientService.getClient(id);
  })
);

ipcMain.handle(
  "create-client",
  safeHandler(async (event, clientData) => {
    if (!clientData || typeof clientData !== "object")
      throw new Error("create-client: clientData is required");
    return await ClientService.createClient(clientData);
  })
);

ipcMain.handle(
  "update-client",
  safeHandler(async (event, id, clientData) => {
    if (!id) throw new Error("update-client: id is required");
    if (!clientData || typeof clientData !== "object")
      throw new Error("update-client: clientData is required");
    return await ClientService.updateClient(id, clientData);
  })
);

ipcMain.handle(
  "delete-client",
  safeHandler(async (event, id) => {
    if (!id) throw new Error("delete-client: id is required");
    return await ClientService.deleteClient(id);
  })
);

/* Receptions */
ipcMain.handle(
  "list-receptions",
  safeHandler(async () => {
    return await ReceptionService.listReceptions();
  })
);

ipcMain.handle(
  "list-archived-receptions",
  safeHandler(async () => {
    return await ReceptionService.listArchivedReceptions();
  })
);

ipcMain.handle(
  "get-reception",
  safeHandler(async (event, id) => {
    if (!id) throw new Error("get-reception: id is required");
    return await ReceptionService.getReception(id);
  })
);

ipcMain.handle("create-reception", async (event, data) => {
  try {
    console.log("📥 create-reception:", data);
    const result = await ReceptionService.createReception(data);
    console.log("✅ recepción creada:", result);
    return result;
  } catch (err) {
    console.error("❌ IPC Error [create-reception]:", err);
    throw err;
  }
});


ipcMain.handle(
  "update-reception",
  safeHandler(async (event, id, receptionData) => {
    if (!id) throw new Error("update-reception: id is required");
    if (!receptionData || typeof receptionData !== "object")
      throw new Error("update-reception: receptionData is required");
    return await ReceptionService.updateReception(id, receptionData);
  })
);

ipcMain.handle(
  "delete-reception",
  safeHandler(async (event, id) => {
    if (!id) throw new Error("delete-reception: id is required");
    return await ReceptionService.deleteReception(id);
  })
);

ipcMain.handle(
  "archive-reception",
  safeHandler(async (event, id) => {
    if (!id) throw new Error("archive-reception: id is required");
    return await ReceptionService.archiveReception(id);
  })
);

ipcMain.handle(
  "restore-reception",
  safeHandler(async (event, id) => {
    if (!id) throw new Error("restore-reception: id is required");
    return await ReceptionService.restoreReception(id);
  })
);

ipcMain.handle(
  "reception-details",
  safeHandler(async (event, id) => {
    if (!id) throw new Error("reception-details: id is required");
    return await ReceptionService.getReceptionDetails(id);
  })
);

/* Reports */
ipcMain.handle(
  "list-reports",
  safeHandler(async () => {
    return await ReportService.listReports();
  })
);

ipcMain.handle(
  "get-report",
  safeHandler(async (event, id) => {
    if (!id) throw new Error("get-report: id is required");
    return await ReportService.getReport(id);
  })
);

ipcMain.handle(
  "create-report",
  safeHandler(async (event, reportData) => {
    if (!reportData || typeof reportData !== "object")
      throw new Error("create-report: reportData is required");
    return await ReportService.createReport(reportData);
  })
);

ipcMain.handle(
  "update-report",
  safeHandler(async (event, id, reportData) => {
    if (!id) throw new Error("update-report: id is required");
    if (!reportData || typeof reportData !== "object")
      throw new Error("update-report: reportData is required");
    return await ReportService.updateReport(id, reportData);
  })
);

ipcMain.handle(
  "delete-report",
  safeHandler(async (event, id) => {
    if (!id) throw new Error("delete-report: id is required");
    return await ReportService.deleteReport(id);
  })
);
