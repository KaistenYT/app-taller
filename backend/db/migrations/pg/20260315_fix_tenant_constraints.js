/**
 * Fix multi-tenant constraints for SaaS isolation.
 * Changes unique constraints from global to per-company.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // 1. Fix User table constraints
  await knex.schema.alterTable("user", (table) => {
    table.dropUnique(["username"]);
    table.unique(["company_id", "username"]);
  });

  // 2. Fix Device table constraints
  await knex.schema.alterTable("device", (table) => {
    table.dropUnique(["serial_number"]);
    table.unique(["company_id", "serial_number"]);
  });

  // 3. Fix Client table constraints
  // First, drop the foreign key in reception that depends on client's primary key
  await knex.schema.alterTable("reception", (table) => {
    table.dropForeign(["client_idNumber"]);
  });

  // Then alter the primary key on client
  await knex.schema.alterTable("client", (table) => {
    table.dropPrimary();
    table.primary(["company_id", "idNumber"]);
  });

  // Re-add the foreign key in reception using the composite key
  await knex.schema.alterTable("reception", (table) => {
    table.foreign(["company_id", "client_idNumber"])
      .references(["company_id", "idNumber"])
      .inTable("client")
      .onDelete("RESTRICT")
      .onUpdate("CASCADE");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.alterTable("reception", (table) => {
    table.dropForeign(["company_id", "client_idNumber"]);
  });

  await knex.schema.alterTable("client", (table) => {
    table.dropPrimary();
    table.primary(["idNumber"]);
  });

  await knex.schema.alterTable("reception", (table) => {
    table.foreign("client_idNumber")
      .references("idNumber")
      .inTable("client")
      .onDelete("RESTRICT")
      .onUpdate("CASCADE");
  });

  await knex.schema.alterTable("device", (table) => {
    table.dropUnique(["company_id", "serial_number"]);
    table.unique(["serial_number"]);
  });

  await knex.schema.alterTable("user", (table) => {
    table.dropUnique(["company_id", "username"]);
    table.unique(["username"]);
  });
}
