// backend/db/migrations/xxxx_create_recepcion_history.js
export async function up(knex) {
  return knex.schema.createTable("recepcion_history", (table) => {
    table.increments("id").primary();
    table.integer("original_id").notNullable();
    table.integer("cliente_id").notNullable();
    table.integer("equipo_id").notNullable();
    table.timestamp("fecha").notNullable();
    table.string("estado").notNullable();
    table.string("accion").notNullable(); // 'archivada', 'actualizada'
    table.timestamp("fecha_evento").defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  return knex.schema.dropTable("recepcion_history");
}
