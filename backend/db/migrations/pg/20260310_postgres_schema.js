/**
 * Migración de esquema para PostgreSQL.
 * El archivo original SQLite (20240214_initial_schema.js) está en la carpeta padre como referencia.
 *
 * Diferencias con el schema SQLite:
 * - knex.fn.now() en lugar de datetime('now','localtime')
 * - jsonb en lugar de json para device_snapshot
 * - Orden corregido: 'user' se crea antes que 'reception_history' (tiene FK a user.id)
 * - Sin checks hasTable (la migración parte de una DB vacía)
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // 1. user — creada primero porque reception_history referencia user.id
  await knex.schema.createTable("user", (table) => {
    table.increments("id").primary().unique();
    table.string("username").notNullable().unique();
    table.string("password").notNullable();
    table.string("role").notNullable().defaultTo("user");
  });

  // 2. device
  await knex.schema.createTable("device", (table) => {
    table.increments("id").primary();
    table.string("description").notNullable();
    table.string("features");
    table.string("serial_number").unique();
    table.timestamp("created_at", { useTz: false }).defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: false }).defaultTo(knex.fn.now());
    table.index(["serial_number"]);
  });

  // 3. client
  await knex.schema.createTable("client", (table) => {
    table.string("idNumber").primary().notNullable();
    table.string("name").notNullable();
    table.string("phone").notNullable();
  });

  // 4. reception
  await knex.schema.createTable("reception", (table) => {
    table.increments("id").primary();
    table.string("client_idNumber").notNullable();
    table.integer("device_id").notNullable().unsigned();
    table.string("defect").notNullable();
    table.string("status").notNullable().defaultTo("PENDIENTE");
    table.string("repair");
    table.jsonb("device_snapshot"); // jsonb: nativo en PostgreSQL, más eficiente que json
    table.timestamp("created_at", { useTz: false }).defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: false }).defaultTo(knex.fn.now());
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
  });

  // 5. report
  await knex.schema.createTable("report", (table) => {
    table.increments("id").primary();
    table.integer("reception_id").notNullable().unsigned();
    table.text("description").notNullable();
    table.timestamp("created_at", { useTz: false }).defaultTo(knex.fn.now());
    table
      .foreign("reception_id")
      .references("reception.id")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
    table.index(["reception_id"]);
  });

  // 6. reception_history — va al final porque tiene FK a user.id
  await knex.schema.createTable("reception_history", (table) => {
    table.increments("id").primary();
    table.integer("reception_id").notNullable().unsigned();
    table.string("client_id").notNullable();
    table.integer("device_id").notNullable().unsigned();
    table.integer("user_id").notNullable().unsigned();
    table.timestamp("reception_date", { useTz: false }).notNullable();
    table.string("status").notNullable();
    table.string("action").notNullable();
    table
      .timestamp("event_timestamp", { useTz: false })
      .defaultTo(knex.fn.now());
    table.index(["reception_id"]);
    table.index(["user_id"]);
    table
      .foreign("user_id")
      .references("user.id")
      .onDelete("RESTRICT")
      .onUpdate("CASCADE");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists("reception_history");
  await knex.schema.dropTableIfExists("report");
  await knex.schema.dropTableIfExists("reception");
  await knex.schema.dropTableIfExists("client");
  await knex.schema.dropTableIfExists("device");
  await knex.schema.dropTableIfExists("user");
}
