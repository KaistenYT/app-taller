import { BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { DeviceService } from "../backend/service/deviceService.js";
import { ReceptionService } from "../backend/service/receptionService.js";
import { ClientService } from "../backend/service/clientService.js";
import { ReportService } from "../backend/service/reportService.js";
import { UserService } from "../backend/service/userService.js";
import { ReceptionHistoryService } from "../backend/service/receptionHistoryService.js";
import { BudgetService } from "../backend/service/budgetService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.DEV === "true";

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

export const registerHandlers = () => {
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

    // ── Presupuestos ────────────────────────────────────────
    "create-budget": async (event, { reception_id, user_id }) => {
      if (!reception_id || !user_id) throw new Error("Datos requeridos");
      return await BudgetService.createBudget(reception_id, user_id);
    },
    "get-budget-by-reception": async (event, reception_id) => {
      if (!reception_id) throw new Error("ID requerido");
      return await BudgetService.getBudgetByReception(reception_id);
    },
    "get-budget-details": async (event, id) => {
      if (!id) throw new Error("ID requerido");
      return await BudgetService.getBudgetWithDetails(id);
    },
    "update-budget": async (event, { id, data, user_id }) => {
      if (!id || !data || !user_id) throw new Error("Datos requeridos");
      return await BudgetService.updateBudget(id, data, user_id);
    },
    "delete-budget": async (event, { id, user_id }) => {
      if (!id || !user_id) throw new Error("Datos requeridos");
      return await BudgetService.deleteBudget(id, user_id);
    },
    "get-budget-log": async (event, budget_id) => {
      if (!budget_id) throw new Error("ID requerido");
      return await BudgetService.getBudgetLog(budget_id);
    },
    "open-budget-window": async (event, budgetId) => {
      if (!budgetId) throw new Error("Budget ID requerido");
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
        await win.loadURL(`http://localhost:5173/#/budget/${budgetId}`);
      } else {
        const filePath = path.join(__dirname, "../frontend/react/app-taller/dist/index.html");
        await win.loadFile(filePath, { hash: `/budget/${budgetId}` });
      }
      win.show();
      return { ok: true };
    },
  };

  for (const [channel, handler] of Object.entries(handlers)) {
    ipcMain.handle(channel, safeHandler(handler));
  }
};
