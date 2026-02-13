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
  // Fallback (tests, entorno sin Electron)
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
  pool: {
    afterCreate: (conn, done) => {
      conn.run("PRAGMA foreign_keys = ON", done);
    },
  },
});

const tables = [
  {
    name: "device",
    build: (table) => {
      table.increments("id").primary();
      table.string("description").notNullable();
      table.string("features");
      table.string("serial_number").unique();
      table.timestamp("created_at").defaultTo(db.fn.now());
      table.timestamp("updated_at").defaultTo(db.fn.now());
      table.index(["serial_number"]);
    },
  },
  {
    name: "client",
    build: (table) => {
      table.string("idNumber").primary().notNullable();
      table.string("name").notNullable();
      table.string("phone").notNullable();
    },
  },
  {
    name: "reception",
    build: (table) => {
      table.increments("id").primary();
      table.string("client_idNumber").notNullable();
      table.integer("device_id").notNullable().unsigned();
      table.string("defect").notNullable();
      table.string("status").notNullable().defaultTo("PENDIENTE");
      table.string("repair");
      table.json("device_snapshot");
      table.timestamp("created_at").defaultTo(db.fn.now());
      table.timestamp("updated_at").defaultTo(db.fn.now());
      table.boolean("archived").defaultTo(false);
      table
        .foreign("client_idNumber")
        .references("client.idNumber")
        .onDelete("RESTRICT")
        .onUpdate("CASCADE");
      table
        .foreign("device_id")
        .references("device.id")
        .onDelete("RESTRICT")
        .onUpdate("CASCADE");
      table.index(["client_idNumber"]);
      table.index(["device_id"]);
    },
  },
  {
    name: "report",
    build: (table) => {
      table.increments("id").primary();
      table.integer("reception_id").notNullable().unsigned();
      table.string("description").notNullable();
      table.timestamp("created_at").defaultTo(db.fn.now());
      table
        .foreign("reception_id")
        .references("reception.id")
        .onDelete("CASCADE")
        .onUpdate("CASCADE");
      table.index(["reception_id"]);
    },
  },
  {
    name: "reception_history",
    build: (table) => {
      table.increments("id").primary();
      table.integer("reception_id").notNullable().unsigned();
      table.string("client_id").notNullable();
      table.integer("device_id").notNullable().unsigned();
      table.integer("user_id").notNullable().unsigned();
      table.timestamp("reception_date").notNullable();
      table.string("status").notNullable();
      table.string("action").notNullable();
      table.timestamp("event_timestamp").defaultTo(db.fn.now());
      table.index(["reception_id"]);
      table.index(["user_id"]);
      table
        .foreign("user_id")
        .references("user.id")
        .onDelete("RESTRICT")
        .onUpdate("CASCADE");
    },
  },

  {
    name: "user",
    build: (table) => {
      table.increments("id").primary().unique();
      table.string("username").notNullable().unique();
      table.string("password").notNullable();
      table.string("role").notNullable().defaultTo("user");
    },
  },
];

async function createTables() {
  try {
    for (const { name, build } of tables) {
      const exists = await db.schema.hasTable(name);
      if (!exists) {
        await db.schema.createTable(name, build);
        console.log(`Tabla "${name}" creada`);
      } else {
        console.log(`Tabla "${name}" ya existe`);
      }
    }
    console.log("Todas las tablas iniciales listas");
  } catch (err) {
    console.error("Error al crear tablas:", err);
  }
}

await createTables();

await ReceptionHistory.init(db);
console.log("[dbConfig] ReceptionHistory.init completed");

export default db;
