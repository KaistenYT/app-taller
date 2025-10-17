
import knexLib from "knex";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = knexLib({
  client: "sqlite3",
  connection: {
    filename: path.join(__dirname, "db.sqlite"),
  },
  useNullAsDefault: true,
});

const tables = [
  {
    name: "device",
    build: (table) => {
      table.increments("id").primary();
      table.string("description").notNullable();
      table.string("features");
    },
  },
  {
    name: "client",
    build: (table) => {
      table.string("idNumber").primary().notNullable;
      table.string("name").notNullable();
      table.string("phone").notNullable();
    },
  },
  {
    name: "reception",
    build: (table) => {
      table.increments("id").primary();
      table.string("client_idNumber").notNullable();
      table.integer("device_id").notNullable();
      table.string("defect").notNullable();
      table.string("status")
      table.string("repair")
      table.timestamp("created_at").defaultTo(db.fn.now());
      table.timestamp("updated_at").defaultTo(db.fn.now());
      table.boolean("archived").defaultTo(false);
      table.foreign("client_idNumber").references("idNumber").inTable("client");
      table.foreign("device_id").references("id").inTable("device");
     
    },
  },
  {
    name: "report",
    build: (table) => {
      table.increments("id").primary();
      table.integer("reception_id").notNullable();
      table.string("description").notNullable();
      table.date("created_at").defaultTo(db.fn.now());
      table.foreign("reception_id").references("id").inTable("reception");
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
        console.log(` Tabla "${name}" ya existe`);
      }
    }
    console.log(" Todas las tablas iniciales listas");
  } catch (err) {
    console.error(" Error al crear tablas:", err);
  }
}

createTables();

export default db;
