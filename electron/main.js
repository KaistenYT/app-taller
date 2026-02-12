import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { DeviceService } from "../backend/service/deviceService.js";
import { ReceptionService } from "../backend/service/receptionService.js";
import { ClientService } from "../backend/service/clientService.js";
import { ReportService } from "../backend/service/reportService.js";
import { UserService } from "../backend/service/userService.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Crea la ventana principal de la aplicación Electron.
 * Configura las webPreferences, incluyendo el script de precarga (preload.cjs) para la comunicación IPC.
 */
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
  win.removeMenu(); // Elimina el menú predeterminado de Electron

  win.loadFile(path.join(__dirname, "../frontend/views/login.html")); // Carga la página de inicio de sesión
};

// Eventos del ciclo de vida de la aplicación Electron
app.whenReady().then(() => {
  createWindow(); // Crea la ventana cuando la aplicación está lista
  app.on("activate", () => {
    // Recrea la ventana si la aplicación está activa y no hay ventanas abiertas (ej. al hacer clic en el icono del dock en macOS)
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  // Cierra la aplicación cuando todas las ventanas están cerradas, excepto en macOS donde es común que la aplicación siga ejecutándose en segundo plano
  if (process.platform !== "darwin") app.quit();
});

/**
 * Wrapper para manejadores IPC que añade un bloque try-catch para manejar errores de forma segura.
 * Esto evita que los errores en los manejadores IPC bloqueen el proceso principal de Electron.
 * @param {Function} fn - La función del manejador IPC original.
 * @returns {Function} Una función manejadora envuelta con manejo de errores.
 */
const safeHandler =
  (fn) =>
  async (event, ...args) => {
    try {
      return await fn(event, ...args);
    } catch (err) {
      // Los errores se propagan de vuelta al proceso de renderizado que invocó el IPC
      throw err;
    }
  };

/**
 * Registra todos los manejadores de comunicación IPC (Inter-Process Communication) entre el proceso de renderizado (frontend)
 * y el proceso principal (backend de Electron).
 * Cada manejador se asocia a un canal específico y llama a un método del servicio correspondiente.
 */
const registerHandlers = () => {
  const handlers = {
    // Manejadores IPC para servicios de Dispositivos
    "list-devices": () => DeviceService.listDevices(),
    "get-device": (event, id) => {
      if (!id) throw new Error("get-device: id es requerido");
      return DeviceService.getDevice(id);
    },
    "get-device-by-serial": (event, serial) => {
      if (!serial) throw new Error("get-device-by-serial: serial es requerido");
      return DeviceService.getDeviceBySerial(serial);
    },
    "create-device": (event, data) => {
      if (!data || typeof data !== "object")
        throw new Error("create-device: datos de dispositivo son requeridos");
      return DeviceService.createDevice(data);
    },
    "upsert-device-by-serial": (event, data) => {
      if (!data || typeof data !== "object")
        throw new Error("upsert-device-by-serial: datos de dispositivo son requeridos");
      return DeviceService.upsertDeviceBySerial(data);
    },
    "update-device": (event, id, data) => {
      if (!id || !data || typeof data !== "object")
        throw new Error("update-device: id y datos de dispositivo son requeridos");
      return DeviceService.updateDevice(id, data);
    },
    "delete-device": (event, id) => {
      if (!id) throw new Error("delete-device: id es requerido");
      return DeviceService.deleteDevice(id);
    },

    // Manejadores IPC para servicios de Clientes
    "list-clients": () => ClientService.listClients(),
    "get-client": (event, id) => {
      if (!id) throw new Error("get-client: id es requerido");
      return ClientService.getClient(id);
    },
    "create-client": (event, data) => {
      if (!data || typeof data !== "object")
        throw new Error("create-client: datos de cliente son requeridos");
      return ClientService.createClient(data);
    },
    "update-client": (event, id, data) => {
      if (!id || !data || typeof data !== "object")
        throw new Error("update-client: id y datos de cliente son requeridos");
      return ClientService.updateClient(id, data);
    },
    "delete-client": (event, id) => {
      if (!id) throw new Error("delete-client: id es requerido");
      return ClientService.deleteClient(id);
    },

    // Manejadores IPC para servicios de Recepciones
    "list-receptions": (event, filters) =>
      ReceptionService.listReceptions(filters),
    "count-receptions": (event, filters) =>
      ReceptionService.countReceptions(filters),
    "list-archived-receptions": () => ReceptionService.listArchivedReceptions(),
    "get-reception": (event, id) => {
      if (!id) throw new Error("get-reception: id es requerido");
      return ReceptionService.getReception(id);
    },
    "create-reception": async (event, { data, user_id }) => {
      console.log("create-reception:", data, "by user:", user_id);
      const result = await ReceptionService.createReception(data, user_id);
      console.log("reception created:", result);
      return result;
    },
    "update-reception": async (event, { id, data, user_id }) => {
      console.log("update-reception:", { id, data }, "by user:", user_id);
      const result = await ReceptionService.updateReception(id, data, user_id);
      console.log("reception updated:", result);
      return result;
    },
    "delete-reception": async (event, { id, user_id, user_role }) => {
      if (!id) throw new Error("delete-reception: id es requerido");
      if (!user_id || !user_role)
        throw new Error("delete-reception: user_id y user_role son requeridos");
      console.log(
        "delete-reception:",
        id,
        "by user:",
        user_id,
        "con rol:",
        user_role,
      );
      return await ReceptionService.deleteReception(id, user_id, user_role);
    },
    "archive-reception": async (event, { id, user_id }) => {
      if (!id) throw new Error("archive-reception: id es requerido");
      if (!user_id) throw new Error("archive-reception: user_id es requerido");
      console.log("archive-reception:", id, "by user:", user_id);
      return await ReceptionService.archiveReception(id, user_id);
    },
    "restore-reception": async (event, { id, user_id }) => {
      if (!id) throw new Error("restore-reception: id es requerido");
      if (!user_id) throw new Error("restore-reception: user_id es requerido");
      console.log("restore-reception:", id, "by user:", user_id);
      return await ReceptionService.restoreReception(id, user_id);
    },
    "reception-details": (event, id) => {
      if (!id) throw new Error("reception-details: id es requerido");
      return ReceptionService.getReceptionDetails(id);
    },

    // Manejadores IPC para servicios de Reportes
    "list-reports": () => ReportService.listReports(),
    "get-report": (event, id) => {
      if (!id) throw new Error("get-report: id es requerido");
      return ReportService.getReport(id);
    },
    "create-report": (event, data) => {
      if (!data || typeof data !== "object")
        throw new Error("create-report: datos de reporte son requeridos");
      return ReportService.createReport(data);
    },
    "update-report": (event, id, data) => {
      if (!id || !data || typeof data !== "object")
        throw new Error("update-report: id y datos de reporte son requeridos");
      return ReportService.updateReport(id, data);
    },
    "delete-report": (event, id) => {
      if (!id) throw new Error("delete-report: id es requerido");
      return ReportService.deleteReport(id);
    },
    "get-report-by-reception": async (event, receptionId) => {
      return await ReportService.getReportsByReception(receptionId);
    },
    "open-report-window": async (event, reportId) => {
      if (!reportId)
        throw new Error("open-report-window: reportId es requerido");
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
        const filePath = path.join(__dirname, "../frontend/views/report.html");
        await win.loadFile(filePath, { query: { id: String(reportId) } });
        win.show();
        return { ok: true };
      } catch (err) {
        console.error("Fallo al abrir ventana de reporte:", err);
        throw err;
      }
    },
    "create-report-from-reception": async (event, receptionId) => {
      if (!receptionId)
        throw new Error(
          "create-report-from-reception: receptionId es requerido",
        );
      return await ReportService.createReportFromReception(receptionId);
    },

    // Manejadores IPC para servicios de Usuario
    "login-user": (event, username, password) => {
      return UserService.login(username, password);
    },
    "register-user": async (event, userData) => {
      if (!userData || !userData.username || !userData.password)
        throw new Error("register-user: username y password son requeridos");
      return await UserService.registerUser(userData);
    },
    // Manejadores IPC para el historial de recepciones (auditoría)
    "list-reception-history": async (event, filters) => {
      const { ReceptionHistoryService } = await import(
        "../backend/service/receptionHistoryService.js"
      );
      return await ReceptionHistoryService.listHistory(filters || {});
    },
    "count-reception-history": async (event, filters) => {
      const { ReceptionHistoryService } = await import(
        "../backend/service/receptionHistoryService.js"
      );
      return await ReceptionHistoryService.countHistory(filters || {});
    },
  };

  // Registrar manejadores estándar
  for (const [channel, handler] of Object.entries(handlers)) {
    ipcMain.handle(channel, safeHandler(handler));
  }

  // Registrar manejador específico para listar reportes con prefijo
  ipcMain.handle(
    "report:list-reports",
    safeHandler(async () => {
      return await ReportService.listReports();
    }),
  );
};

// Se llama para iniciar el registro de todos los manejadores IPC
registerHandlers();
