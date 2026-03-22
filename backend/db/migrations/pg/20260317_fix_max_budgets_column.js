/**
 * Placeholder for missing migration file to satisfy Knex validator.
 */
export async function up(knex) {
  // Check if column already exists to avoid errors if it was partially applied
  const hasColumn = await knex.schema.hasColumn('company', 'max_budgets');
  if (!hasColumn) {
    await knex.schema.alterTable('company', table => {
      table.integer('max_budgets').defaultTo(100);
    });
  }
}

export async function down(knex) {
  await knex.schema.alterTable('company', table => {
    table.dropColumn('max_budgets');
  });
}
