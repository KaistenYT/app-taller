import { table } from "console";
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
      table.string("descripcion").notNullable();
      table.string("caracteristicas");
    },
  },
  {
    name: "client",
    build: (table) => {
      table.increments("id").primary();
      table.string("nombre").notNullable();
      table.string("telefono").notNullable();
    },
  },
  {
    name: "reception",
    build: (table) => {
      table.increments("id").primary();
      table.string("device_id").notNullable();
      table.integer("client_id").notNullable();
      table.string("estado").notNullable();
      table.string("falla_reportada").notNullable();
      table.string("observaciones");
      table.string("reparacion_realizada");
      table.float("costo_reparacion");
      table.date("fecha_ingreso").notNullable();
      table.date("fecha_entrega");
      table.boolean("archivada").defaultTo(false);
      table.foreign("device_id").references("id").inTable("device");
      table.foreign("client_id").references("id").inTable("client");
    },
  },
  {
    name: "report",
    build: (table) => {
      table.increments("id").primary();
      table.integer("reception_id").notNullable();
      table.string("descripcion").notNullable();
      table.date("fecha").notNullable();

      table.foreign("reception_id").references("id").inTable("reception");
    },
  },
];

// 🔹 Función genérica para crear todas las tablas
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
