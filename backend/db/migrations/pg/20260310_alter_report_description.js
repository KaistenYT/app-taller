/**
 * Amplía la columna description de la tabla report de varchar(255) a text.
 * varchar(255) es insuficiente para el contenido HTML generado automáticamente.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.alterTable("report", (table) => {
    table.text("description").alter();
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.alterTable("report", (table) => {
    table.string("description").alter(); // vuelve a varchar(255)
  });
}
