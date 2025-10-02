import knexLib from "knex";

const db = knexLib({
  client: "sqlite3",
  connection: {
    filename: "./db/db.sqlite",
  },
  useNullAsDefault: true,
});

//  Definición de tablas en un solo lugar
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
      table.string("reparacion_realizada").notNullable();
      table.float("costo_reparacion");
      table.date("fecha_ingreso").notNullable();
      table.date("fecha_entrega").notNullable();

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
        console.log(`✅ Tabla "${name}" creada`);
      } else {
        console.log(`ℹ️ Tabla "${name}" ya existe`);
      }
    }
    console.log("🚀 Todas las tablas iniciales listas");
  } catch (err) {
    console.error("❌ Error al crear tablas:", err);
  }
}

createTables();

export default db;
