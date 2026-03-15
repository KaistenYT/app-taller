/**
 * Migración para corregir la restricción ON DELETE SET NULL de budget_log y
 * restaurar los budget_id perdidos a partir del snapshot.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // 1. Quitar la foreign key que causa que budget_id se ponga en NULL al borrar el presupuesto
  await knex.schema.alterTable("budget_log", (table) => {
    table.dropForeign("budget_id");
  });

  // 2. Restaurar los budget_id a partir del snapshot de las filas donde se haya perdido
  await knex.raw(`
    UPDATE budget_log
    SET budget_id = CAST(snapshot->>'id' AS INTEGER)
    WHERE budget_id IS NULL AND snapshot IS NOT NULL
  `);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  // Al volver atrás, se vuelve a poner la foreign key con SET NULL
  await knex.schema.alterTable("budget_log", (table) => {
    table.foreign("budget_id").references("budget.id").onDelete("SET NULL");
  });
}
