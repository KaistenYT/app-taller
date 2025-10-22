import knexLib from "knex";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the db directory exists
if (!fs.existsSync(__dirname)) {
  fs.mkdirSync(__dirname, { recursive: true });
}

const db = knexLib({
  client: "sqlite3",
  connection: {
    filename: path.join(__dirname, "db.sqlite"),
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
    table.string("serial_number").unique().notNullable();
    table.text("device_snapshot");
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
      table.text("device_snapshot");
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

createTables();

export default db;
