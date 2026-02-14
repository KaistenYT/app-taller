import { app, BrowserWindow, dialog } from "electron";
import fs from "fs";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import db from "../backend/db/dbConfig.js";
import { UserService } from "../backend/service/userService.js";
import { registerHandlers } from "./ipcHandlers.js";

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
  // Registrar handlers IPC antes de crear la ventana
  registerHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
