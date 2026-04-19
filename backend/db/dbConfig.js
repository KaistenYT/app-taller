import "dotenv/config";
import knexLib from "knex";
import path from "path";
import { fileURLToPath } from "url";
import { ReceptionHistory } from "../model/receptionHistory.js";
import logger from "../utils/logger.js";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determinar ruta de la DB
const isProd = process.env.NODE_ENV === "production";
let dbFilePath;

if (isProd) {
  const appData = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + "/.local/share");
  const dbDir = path.join(appData, "NanoLogic");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  dbFilePath = path.join(dbDir, "database.sqlite");
} else {
  dbFilePath = path.resolve(__dirname, "../db/database.sqlite");
}

const db = knexLib({
  client: "better-sqlite3",
  connection: {
    filename: dbFilePath,
  },
  useNullAsDefault: true,
  pool: {
    afterCreate: (conn, cb) => {
      conn.pragma('foreign_keys = ON');
      cb();
    }
  }
});

/**
 * Retorna la expresión SQL para la hora actual en SQLite.
 */
export function localNow() {
  return db.raw("datetime('now','localtime')");
}

try {
  // En SQLite, las migraciones se ejecutan de la misma forma que en PG
  await db.migrate.latest({
    directory: path.join(__dirname, "migrations", "pg")
  });
  logger.info("[dbConfig] Migraciones SQLite completadas");
} catch (err) {
  logger.error("[dbConfig] Error en inicialización de DB:", { error: err.message, stack: err.stack });
}

await ReceptionHistory.init(db);
logger.info("[dbConfig] ReceptionHistory.init completed");

export default db;
