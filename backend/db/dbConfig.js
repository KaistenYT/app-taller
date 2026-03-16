import "dotenv/config";
import knexLib from "knex";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
import { ReceptionHistory } from "../model/receptionHistory.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = knexLib({
  client: "pg",
  connection: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "nanologic_dev",
  },
  migrations: {
    directory: path.join(__dirname, "migrations", "pg"),
  },
});

/**
 * Retorna la expresión SQL para la hora actual en PostgreSQL.
 * Equivalente al antiguo datetime('now','localtime') de SQLite.
 * Usar en INSERT/UPDATE cuando se necesite estampar la hora actual.
 */
export function localNow() {
  return db.fn.now();
}

try {
  await db.migrate.latest();
  console.log("[dbConfig] Migraciones completadas");

  // Seed default admin si no existen usuarios
  const hasUsers = await db('user').first();
  if (!hasUsers) {
    const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
    const hashedPassword = await bcrypt.hash(defaultAdminPassword, 10);
    await db('user').insert({
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      company_id: 1,
    });
    console.log("[dbConfig] Usuario administrador por defecto creado (admin)");
  }
} catch (err) {
  console.error("[dbConfig] Error en inicialización de DB:", err);
}

await ReceptionHistory.init(db);
console.log("[dbConfig] ReceptionHistory.init completed");

export default db;
