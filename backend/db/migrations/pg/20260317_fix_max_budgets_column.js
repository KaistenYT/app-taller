export function up(knex) {
  return knex.schema
    .table("plan", (table) => {
      table.integer("max_budgets").defaultTo(-1);
    })
    .then(async () => {
      // Configurar límites solicitados
      await knex("plan").where({ name: "FREE" }).orWhere({ id: 1 }).update({
        max_receptions: 20, // Semanales (se controla en el middleware)
        max_budgets: 10
      });

      await knex("plan").where({ name: "EMPRENDEDOR" }).update({
        max_receptions: 50, // Mensuales (se controla en el middleware)
        max_budgets: 30
      });
    });
}

export function down(knex) {
  return knex.schema.table("plan", (table) => {
    table.dropColumn("max_budgets");
  });
}
