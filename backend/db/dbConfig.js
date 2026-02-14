import knexLib from "knex";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { ReceptionHistory } from "../model/receptionHistory.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// En producción (empaquetado), la DB va en userData para que sea escribible.
// En desarrollo, se usa la carpeta local del proyecto.
let dbDir;
try {
  const { app } = await import("electron");
  const isPackaged = app.isPackaged;
  if (isPackaged) {
    dbDir = path.join(app.getPath("userData"), "data");
  } else {
    dbDir = __dirname;
  }
} catch {
  dbDir = __dirname;
}

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, "db.sqlite");

const db = knexLib({
  client: "sqlite3",
  connection: {
    filename: dbPath,
  },
  useNullAsDefault: true,
  migrations: {
    directory: path.join(__dirname, "migrations"),
  },
  pool: {
    afterCreate: (conn, done) => {
      conn.run("PRAGMA foreign_keys = ON", done);
    },
  },
});

// SQLite datetime('now') devuelve UTC; esta función fuerza hora local.
// Usar en INSERT/UPDATE. Los defaults de schema ya incluyen localtime.
export function localNow() {
  return db.raw("datetime('now','localtime')");
}

try {
  await db.migrate.latest();
  console.log("[dbConfig] Migraciones completadas");
} catch (err) {
  console.error("[dbConfig] Error en migraciones:", err);
}

await ReceptionHistory.init(db);
console.log("[dbConfig] ReceptionHistory.init completed");

export default db;
