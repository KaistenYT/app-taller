import { app, BrowserWindow, ipcMain } from "electron";
//require('update-electron-app')();
import path from "path";
import { fileURLToPath } from "url";
import { DeviceService } from "../backend/service/deviceService.js";
import { ReceptionService } from "../backend/service/receptionService.js";
import { ClientService } from "../backend/service/clientService.js";
import { ReportService } from "../backend/service/reportService.js";
import { ReceptionHistory } from "../backend/model/receptionHistory.js";

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

const safeHandler = (fn) => async (event, ...args) => {
  try {
    return await fn(event, ...args);
  } catch (err) {
    console.error("IPC Error:", err);
    throw err;
  }
};

await ReceptionHistory.init();

const registerHandlers = () => {
  const handlers = {
    // Devices
    "list-devices": () => DeviceService.listDevices(),
    "get-device": (event, id) => {
      if (!id) throw new Error("get-device: id is required");
      return DeviceService.getDevice(id);
    },
    "get-device-by-serial": (event, serial) => {
      if (!serial) throw new Error("get-device-by-serial: serial is required");
      return DeviceService.getDeviceBySerial(serial);
    },
    "create-device": (event, data) => {
      if (!data || typeof data !== "object") throw new Error("create-device: deviceData is required");
      return DeviceService.createDevice(data);
    },
    "upsert-device-by-serial": (event, data) => {
      if (!data || typeof data !== "object") throw new Error("upsert-device-by-serial: deviceData is required");
      return DeviceService.upsertDeviceBySerial(data);
    },
    "update-device": (event, id, data) => {
      if (!id || !data || typeof data !== "object") throw new Error("update-device: id and deviceData are required");
      return DeviceService.updateDevice(id, data);
    },
    "delete-device": (event, id) => {
      if (!id) throw new Error("delete-device: id is required");
      return DeviceService.deleteDevice(id);
    },

    // Clients
    "list-clients": () => ClientService.listClients(),
    "get-client": (event, id) => {
      if (!id) throw new Error("get-client: id is required");
      return ClientService.getClient(id);
    },
    "create-client": (event, data) => {
      if (!data || typeof data !== "object") throw new Error("create-client: clientData is required");
      return ClientService.createClient(data);
    },
    "update-client": (event, id, data) => {
      if (!id || !data || typeof data !== "object") throw new Error("update-client: id and clientData are required");
      return ClientService.updateClient(id, data);
    },
    "delete-client": (event, id) => {
      if (!id) throw new Error("delete-client: id is required");
      return ClientService.deleteClient(id);
    },

    // Receptions
    "list-receptions": () => ReceptionService.listReceptions(),
      
    "list-archived-receptions": () => ReceptionService.listArchivedReceptions(),
    "get-reception": (event, id) => {
      if (!id) throw new Error("get-reception: id is required");
      return ReceptionService.getReception(id);
    },
    "create-reception": async (event, data) => {
      console.log("create-reception:", data);
      const result = await ReceptionService.createReception(data);
      console.log("reception created:", result);
      return result;
    },
    "update-reception": async (event, { id, data }) => {
      console.log("update-reception:", { id, data });
      const result = await ReceptionService.updateReception(id, data);
      console.log("reception updated:", result);
      return result;
    },
    "delete-reception": (event, id) => {
      if (!id) throw new Error("delete-reception: id is required");
      return ReceptionService.deleteReception(id);
    },
    "archive-reception": (event, id) => {
      if (!id) throw new Error("archive-reception: id is required");
      return ReceptionService.archiveReception(id);
    },
    "restore-reception": (event, id) => {
      if (!id) throw new Error("restore-reception: id is required");
      return ReceptionService.restoreReception(id);
    },
    "reception-details": (event, id) => {
      if (!id) throw new Error("reception-details: id is required");
      return ReceptionService.getReceptionDetails(id);
    },

    // Reports
    "list-reports": () => ReportService.listReports(),
    "get-report": (event, id) => {
      if (!id) throw new Error("get-report: id is required");
      return ReportService.getReport(id);
    },
    "create-report": (event, data) => {
      if (!data || typeof data !== "object") throw new Error("create-report: reportData is required");
      return ReportService.createReport(data);
    },
    "update-report": (event, id, data) => {
      if (!id || !data || typeof data !== "object") throw new Error("update-report: id and reportData are required");
      return ReportService.updateReport(id, data);
    },
    "delete-report": (event, id) => {
      if (!id) throw new Error("delete-report: id is required");
      return ReportService.deleteReport(id);
    },
    "get-report-by-reception": async (event, receptionId) => {
      return await ReportService.getReportsByReception(receptionId);
    },
  };

  for (const [channel, handler] of Object.entries(handlers)) {
    ipcMain.handle(channel, safeHandler(handler));
  }
};

registerHandlers();
