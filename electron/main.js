import { app, BrowserWindow, ipcMain, dialog } from "electron";
import fs from "fs";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import db from "../backend/db/dbConfig.js";
import { DeviceService } from "../backend/service/deviceService.js";
import { ReceptionService } from "../backend/service/receptionService.js";
import { ClientService } from "../backend/service/clientService.js";
import { ReportService } from "../backend/service/reportService.js";
import { UserService } from "../backend/service/userService.js";
import { ReceptionHistoryService } from "../backend/service/receptionHistoryService.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.DEV === "true";

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

  win.removeMenu();

  if (isDev) {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(
      path.join(__dirname, "../frontend/react/app-taller/dist/index.html"),
    );
  }
};

// Primer arranque: crea un admin con contraseña aleatoria y la muestra al usuario.
// Si ya existen usuarios en la DB, no hace nada.
async function adminUserGen() {
  try {
    const result = await db("user").count({ count: "*" }).first();
    if (result && result.count > 0) return;

    const generatedPassword = crypto.randomBytes(6).toString("hex");
    await UserService.registerUser({
      username: "Admin",
      password: generatedPassword,
      role: "admin",
    });

    console.log("[adminUserGen] Admin inicial creado");

    // Guardar credenciales en el escritorio
    const desktopPath = app.getPath("desktop");
    const credentialsPath = path.join(
      desktopPath,
      "NanoLogic_Credenciales.txt",
    );
    const content = `CREDENCIALES DE ADMINISTRADOR - NANOLOGIC\n\nUsuario: Admin\nContraseña: ${generatedPassword}\n\nGuarde este archivo en un lugar seguro y borrelo de aquí.`;

    try {
      fs.writeFileSync(credentialsPath, content);
    } catch (fsErr) {
      console.error("Error escribiendo credenciales en escritorio:", fsErr);
    }

    dialog.showMessageBoxSync({
      type: "info",
      title: "Primer inicio — Credenciales de administrador",
      message:
        `Se ha creado el usuario administrador inicial.\n\n` +
        `Usuario: Admin\n` +
        `Contraseña: ${generatedPassword}\n\n` +
        `IMPORTANTE: Se ha guardado un archivo "NanoLogic_Credenciales.txt" en su Escritorio con esta información.`,
      buttons: ["Entendido"],
    });
  } catch (error) {
    console.error("[adminUserGen] Error:", error.message);
  }
}

app.whenReady().then(async () => {
  await adminUserGen();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// Envuelve cada handler IPC para capturar y propagar errores uniformemente
const safeHandler =
  (fn) =>
  async (event, ...args) => {
    try {
      return await fn(event, ...args);
    } catch (err) {
      console.error("[IPC Error]", err.message);
      if (err.stack) console.error(err.stack);
      throw err;
    }
  };

// Mapa centralizado de canales IPC → funciones de servicio
const registerHandlers = () => {
  const handlers = {
    "list-devices": () => DeviceService.listDevices(),
    "get-device": (event, id) => {
      if (!id) throw new Error("ID requerido");
      return DeviceService.getDevice(id);
    },
    "get-device-by-serial": (event, serial) => {
      if (!serial) throw new Error("Serial requerido");
      return DeviceService.getDeviceBySerial(serial);
    },
    "create-device": (event, data) => {
      if (!data) throw new Error("Datos requeridos");
      return DeviceService.createDevice(data);
    },
    "upsert-device-by-serial": (event, data) => {
      if (!data) throw new Error("Datos requeridos");
      return DeviceService.upsertDeviceBySerial(data);
    },
    "update-device": (event, id, data) => {
      if (!id || !data) throw new Error("ID y datos requeridos");
      return DeviceService.updateDevice(id, data);
    },
    "delete-device": (event, id) => {
      if (!id) throw new Error("ID requerido");
      return DeviceService.deleteDevice(id);
    },

    "list-clients": () => ClientService.listClients(),
    "get-client": (event, id) => {
      if (!id) throw new Error("ID requerido");
      return ClientService.getClient(id);
    },
    "create-client": (event, data) => {
      if (!data) throw new Error("Datos requeridos");
      return ClientService.createClient(data);
    },
    "update-client": (event, id, data) => {
      if (!id || !data) throw new Error("ID y datos requeridos");
      return ClientService.updateClient(id, data);
    },
    "delete-client": (event, id) => {
      if (!id) throw new Error("ID requerido");
      return ClientService.deleteClient(id);
    },

    "list-receptions": (event, filters) =>
      ReceptionService.listReceptions(filters),
    "count-receptions": (event, filters) =>
      ReceptionService.countReceptions(filters),
    "list-archived-receptions": () => ReceptionService.listArchivedReceptions(),
    "get-reception": (event, id) => {
      if (!id) throw new Error("ID requerido");
      return ReceptionService.getReception(id);
    },
    "create-reception": async (event, { data, user_id }) => {
      return await ReceptionService.createReception(data, user_id);
    },
    "update-reception": async (event, { id, data, user_id }) => {
      return await ReceptionService.updateReception(id, data, user_id);
    },
    "delete-reception": async (event, { id, user_id, user_role }) => {
      if (!id || !user_id) throw new Error("ID y usuario requeridos");
      return await ReceptionService.deleteReception(id, user_id, user_role);
    },
    "archive-reception": async (event, { id, user_id }) => {
      if (!id) throw new Error("ID requerido");
      return await ReceptionService.archiveReception(id, user_id);
    },
    "restore-reception": async (event, { id, user_id }) => {
      if (!id) throw new Error("ID requerido");
      return await ReceptionService.restoreReception(id, user_id);
    },
    "reception-details": (event, id) => {
      if (!id) throw new Error("ID requerido");
      return ReceptionService.getReceptionDetails(id);
    },

    "list-reports": () => ReportService.listReports(),
    "get-report": (event, id) => {
      if (!id) throw new Error("ID requerido");
      return ReportService.getReport(id);
    },
    "create-report": (event, data) => {
      if (!data) throw new Error("Datos requeridos");
      return ReportService.createReport(data);
    },
    "update-report": (event, id, data) => {
      if (!id || !data) throw new Error("ID y datos requeridos");
      return ReportService.updateReport(id, data);
    },
    "delete-report": (event, id) => {
      if (!id) throw new Error("ID requerido");
      return ReportService.deleteReport(id);
    },
    "get-report-by-reception": async (event, receptionId) => {
      return await ReportService.getReportsByReception(receptionId);
    },
    "open-report-window": async (event, reportId) => {
      if (!reportId) throw new Error("Reporte ID requerido");
      try {
        const win = new BrowserWindow({
          width: 900,
          height: 800,
          webPreferences: {
            preload: path.join(__dirname, "preload.cjs"),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
          },
        });
        win.removeMenu();

        if (isDev) {
          const url = `http://localhost:5173/#/report/${reportId}`;
          await win.loadURL(url);
        } else {
          const filePath = path.join(
            __dirname,
            "../frontend/react/app-taller/dist/index.html",
          );
          await win.loadFile(filePath, { hash: `/report/${reportId}` });
        }
        win.show();
        return { ok: true };
      } catch (err) {
        throw err;
      }
    },
    "create-report-from-reception": async (event, receptionId) => {
      if (!receptionId) throw new Error("ID requerido");
      return await ReportService.createReportFromReception(receptionId);
    },

    "login-user": (event, username, password) => {
      return UserService.login(username, password);
    },
    "register-user": async (event, userData) => {
      if (!userData?.username || !userData?.password)
        throw new Error("Datos incompletos");
      return await UserService.registerUser(userData);
    },
    "reset-user-password": async (
      event,
      { username, newPassword, user_role },
    ) => {
      if (!username || !newPassword) throw new Error("Datos incompletos");
      return await UserService.resetPassword(username, newPassword, user_role);
    },
    "list-users": async (event, { user_role }) => {
      return await UserService.listUsers(user_role);
    },
    "update-user": async (event, { id, data, user_role }) => {
      if (!id || !data) throw new Error("Datos incompletos");
      return await UserService.updateUser(id, data, user_role);
    },
    "delete-user": async (event, { id, user_id, user_role }) => {
      if (!id) throw new Error("ID requerido");
      return await UserService.deleteUser(id, user_id, user_role);
    },

    "list-reception-history": async (event, filters) => {
      try {
        return await ReceptionHistoryService.listHistory(filters || {});
      } catch (error) {
        throw error;
      }
    },
    "count-reception-history": async (event, filters) => {
      try {
        return await ReceptionHistoryService.countHistory(filters || {});
      } catch (error) {
        throw error;
      }
    },
  };

  for (const [channel, handler] of Object.entries(handlers)) {
    ipcMain.handle(channel, safeHandler(handler));
  }
};

registerHandlers();
