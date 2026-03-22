/**
 * Añade soporte para Soft Deletes a las tablas principales.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const tables = ["user", "client", "device", "reception", "report", "budget"];
  
  for (const tableName of tables) {
    await knex.schema.alterTable(tableName, (table) => {
      table.timestamp("deleted_at", { useTz: false }).nullable();
    });
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  const tables = ["user", "client", "device", "reception", "report", "budget"];
  
  for (const tableName of tables) {
    await knex.schema.alterTable(tableName, (table) => {
      table.dropColumn("deleted_at");
    });
  }
}
