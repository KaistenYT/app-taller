/**
 * Migración consolidada del esquema para PostgreSQL.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // 1. user
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
    table.jsonb("device_snapshot");
    table.timestamp("created_at", { useTz: false }).defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: false }).defaultTo(knex.fn.now());
    table.boolean("archived").defaultTo(false);
    table.foreign("client_idNumber").references("client.idNumber").onDelete("RESTRICT").onUpdate("CASCADE");
    table.foreign("device_id").references("device.id").onDelete("RESTRICT").onUpdate("CASCADE");
    table.index(["client_idNumber"]);
    table.index(["device_id"]);
  });

  // 5. report
  await knex.schema.createTable("report", (table) => {
    table.increments("id").primary();
    table.integer("reception_id").notNullable().unsigned();
    table.text("description").notNullable(); // Cambiado a text para soporte HTML largo
    table.timestamp("created_at", { useTz: false }).defaultTo(knex.fn.now());
    table.foreign("reception_id").references("reception.id").onDelete("CASCADE").onUpdate("CASCADE");
    table.index(["reception_id"]);
  });

  // 6. reception_history
  await knex.schema.createTable("reception_history", (table) => {
    table.increments("id").primary();
    table.integer("reception_id").notNullable().unsigned();
    table.string("client_id").notNullable();
    table.integer("device_id").notNullable().unsigned();
    table.integer("user_id").notNullable().unsigned();
    table.timestamp("reception_date", { useTz: false }).notNullable();
    table.string("status").notNullable();
    table.string("action").notNullable();
    table.timestamp("event_timestamp", { useTz: false }).defaultTo(knex.fn.now());
    table.index(["reception_id"]);
    table.index(["user_id"]);
    table.foreign("user_id").references("user.id").onDelete("RESTRICT").onUpdate("CASCADE");
  });

  // 7. budget
  await knex.schema.createTable("budget", (table) => {
    table.increments("id").primary();
    table.integer("reception_id").notNullable().unsigned();
    table.jsonb("items").defaultTo("[]");
    table.text("notes");
    table.string("status", 20).notNullable().defaultTo("BORRADOR");
    table.timestamp("created_at", { useTz: false }).defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: false }).defaultTo(knex.fn.now());
    table.foreign("reception_id").references("reception.id").onDelete("CASCADE").onUpdate("CASCADE");
    table.index(["reception_id"]);
  });

  // 8. budget_log
  await knex.schema.createTable("budget_log", (table) => {
    table.increments("id").primary();
    table.integer("budget_id").notNullable().unsigned();
    table.integer("user_id").notNullable().unsigned();
    table.string("action", 30).notNullable();
    table.string("previous_status", 20);
    table.jsonb("snapshot");
    table.timestamp("event_timestamp", { useTz: false }).defaultTo(knex.fn.now());
    table.foreign("budget_id").references("budget.id").onDelete("CASCADE");
    table.foreign("user_id").references("user.id").onDelete("RESTRICT");
    table.index(["budget_id"]);
    table.index(["user_id"]);
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists("budget_log");
  await knex.schema.dropTableIfExists("budget");
  await knex.schema.dropTableIfExists("reception_history");
  await knex.schema.dropTableIfExists("report");
  await knex.schema.dropTableIfExists("reception");
  await knex.schema.dropTableIfExists("client");
  await knex.schema.dropTableIfExists("device");
  await knex.schema.dropTableIfExists("user");
}
