import { app, BrowserWindow, ipcMain, ipcRenderer } from "electron";
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
});

//IPC handlers para cada función del servicio

//Device
ipcMain.handle("list-devices", async () => {
  return await DeviceService.listDevices();
});

ipcMain.handle("get-device", async (event, id) => {
  return await DeviceService.getDevice(id);
});

ipcMain.handle("create-device", async (event, deviceData) => {
  return await DeviceService.createDevice(deviceData);
});

ipcMain.handle("update-device", async (event, id, deviceData) => {
  return await DeviceService.updateDevice(id, deviceData);
});
ipcMain.handle("delete-device", async (event, id) => {
  return await DeviceService.deleteDevice(id);
});

//Client
ipcMain.handle("list-clients", async () => {
  return await ClientService.listClients();
});

ipcMain.handle("get-client", async (event, id) => {
  return await ClientService.getClient(id);
});

ipcMain.handle("create-client", async (event, clientData) => {
  return await ClientService.createClient(clientData);
});

ipcMain.handle("update-client", async (event, id, clientData) => {
  return await ClientService.updateClient(id, clientData);
});

ipcMain.handle("delete-client", async (event, id) => {
  return await ClientService.deleteClient(id);
});

//Receptions
ipcMain.handle("list-receptions", async () => {
  return await ReceptionService.listReceptions();
});

ipcMain.handle("list-archived-receptions", async () => {
  return await ReceptionService.listArchivedReceptions();
});

ipcMain.handle("restore-reception", async (event, id) => {
  return await ReceptionService.restoreReception(id);
});
ipcMain.handle("archive-reception", async (event, id) => {
  return await ReceptionService.archiveReception(id);
});

ipcMain.handle("get-reception", async (event, id) => {
  return await ReceptionService.getReception(id);
});
ipcMain.handle("create-reception", async (event, receptionData) => {
  return await ReceptionService.createReception(receptionData);
});
ipcMain.handle("update-reception", async (event, id, receptionData) => {
  return await ReceptionService.updateReception(id, receptionData);
});
ipcMain.handle("delete-reception", async (event, id) => {
  return await ReceptionService.deleteReception(id);
});
//Reports
