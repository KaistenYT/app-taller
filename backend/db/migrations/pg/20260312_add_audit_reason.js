/**
 * Migración para añadir columna 'reason' a los historiales y quitar eliminación 
 * en cascada de budget_log para mantener el registro de presupuestos eliminados.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // 1. Añadir columna 'reason' a reception_history
  await knex.schema.alterTable("reception_history", (table) => {
    table.string("reason");
  });

  // 2. Modificar budget_log
  await knex.schema.alterTable("budget_log", (table) => {
    // Añadir columna 'reason'
    table.string("reason");

    // Quitar foreign key con restricción ON DELETE CASCADE
    table.dropForeign("budget_id");
    
    // Volver a añadir la foreign key pero con ON DELETE SET NULL 
    // y cambiar budget_id a nullable para que el registro sobreviva
  });

  await knex.schema.alterTable("budget_log", (table) => {
    table.integer("budget_id").nullable().alter();
    table.foreign("budget_id").references("budget.id").onDelete("SET NULL");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.alterTable("budget_log", (table) => {
    table.dropForeign("budget_id");
  });

  await knex.schema.alterTable("budget_log", (table) => {
    table.dropColumn("reason");
    table.integer("budget_id").notNullable().alter();
    table.foreign("budget_id").references("budget.id").onDelete("CASCADE");
  });

  await knex.schema.alterTable("reception_history", (table) => {
    table.dropColumn("reason");
  });
}
