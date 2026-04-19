import path from "path";
import { fileURLToPath } from "url";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determinar la ruta de la base de datos según el entorno
const isProd = process.env.NODE_ENV === "production";
let dbPath;

if (isProd) {
  // En producción (Electron), guardamos en la carpeta de datos del usuario
  const appData = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + "/.local/share");
  dbPath = path.join(appData, "NanoLogic", "database.sqlite");
} else {
  // En desarrollo, guardamos en la raíz del backend
  dbPath = path.resolve(__dirname, "./backend/db/database.sqlite");
}

export default {
  development: {
    client: "better-sqlite3",
    connection: {
      filename: "./backend/db/database.sqlite",
    },
    useNullAsDefault: true,
    migrations: {
      directory: "./backend/db/migrations/pg", // Reutilizaremos las migraciones pero con dialecto SQLite
    },
    pool: {
      afterCreate: (conn, cb) => {
        conn.pragma('foreign_keys = ON');
        cb();
      }
    }
  },
  production: {
    client: "better-sqlite3",
    connection: {
      filename: dbPath,
    },
    useNullAsDefault: true,
    migrations: {
      directory: "./backend/db/migrations/pg",
    },
    pool: {
      afterCreate: (conn, cb) => {
        conn.pragma('foreign_keys = ON');
        cb();
      }
    }
  },
};
