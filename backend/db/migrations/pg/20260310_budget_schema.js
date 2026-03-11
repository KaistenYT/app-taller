/**
 * Tablas del módulo de presupuestos:
 * - budget: presupuesto vinculado a una recepción
 * - budget_log: auditoría de todas las acciones sobre el presupuesto
 *
 * @param { import("knex").Knex } knex
 */
export async function up(knex) {
  // 1. budget
  await knex.schema.createTable("budget", (table) => {
    table.increments("id").primary();
    table.integer("reception_id").notNullable().unsigned();
    table.jsonb("items").defaultTo("[]"); // [{description, quantity, unit_price, subtotal}]
    table.text("notes");
    table.string("status", 20).notNullable().defaultTo("BORRADOR"); // BORRADOR | APROBADO | RECHAZADO
    table.timestamp("created_at", { useTz: false }).defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: false }).defaultTo(knex.fn.now());
    table
      .foreign("reception_id")
      .references("reception.id")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
    table.index(["reception_id"]);
  });

  // 2. budget_log — auditoría (mismo patrón que reception_history)
  await knex.schema.createTable("budget_log", (table) => {
    table.increments("id").primary();
    table.integer("budget_id").notNullable().unsigned();
    table.integer("user_id").notNullable().unsigned();
    table.string("action", 30).notNullable(); // CREATED | UPDATED | STATUS_CHANGED | DELETED
    table.string("previous_status", 20);      // estado antes del cambio
    table.jsonb("snapshot");                  // copia del presupuesto en el momento
    table.timestamp("event_timestamp", { useTz: false }).defaultTo(knex.fn.now());
    table.foreign("budget_id").references("budget.id").onDelete("CASCADE");
    table.foreign("user_id").references("user.id").onDelete("RESTRICT");
    table.index(["budget_id"]);
    table.index(["user_id"]);
  });
}

/**
 * @param { import("knex").Knex } knex
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists("budget_log");
  await knex.schema.dropTableIfExists("budget");
}
