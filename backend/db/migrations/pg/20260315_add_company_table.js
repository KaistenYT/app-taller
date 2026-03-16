/**
 * Migración SaaS Multi-Tenant:
 * 1. Crea tablas company, plan, subscription
 * 2. Seed empresa legacy
 * 3. Añade company_id a todas las tablas existentes
 * 4. Backfill con company_id = 1
 * 5. Convierte company_id en NOT NULL
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // ═══════════════════════════════════════════════════════════════
  // 1. Tablas nuevas
  // ═══════════════════════════════════════════════════════════════

  await knex.schema.createTable("company", (table) => {
    table.increments("id").primary();
    table.string("name").notNullable();
    table.string("rif").unique();
    table.string("phone");
    table.string("address");
    table.string("email");
    table.text("logo");
    table.string("currency_symbol", 10).defaultTo("$");
    table.text("terms");                                       // términos y condiciones para PDF
    table.string("status", 20).notNullable().defaultTo("ACTIVE");
    table.timestamp("created_at", { useTz: false }).defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: false }).defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("plan", (table) => {
    table.increments("id").primary();
    table.string("name").notNullable();
    table.text("description");
    table.decimal("price", 10, 2).notNullable().defaultTo(0);
    table.string("billing_cycle", 20).notNullable().defaultTo("MONTHLY");
    table.integer("max_users").notNullable().defaultTo(1);
    table.integer("max_receptions").notNullable().defaultTo(-1);
    table.string("status", 20).notNullable().defaultTo("ACTIVE");
    table.timestamp("created_at", { useTz: false }).defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: false }).defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("subscription", (table) => {
    table.increments("id").primary();
    table.integer("company_id").notNullable().unsigned();
    table.integer("plan_id").notNullable().unsigned();
    table.timestamp("start_date", { useTz: false }).notNullable();
    table.timestamp("end_date", { useTz: false });
    table.string("status", 20).notNullable().defaultTo("ACTIVE");
    table.text("notes");
    table.timestamp("created_at", { useTz: false }).defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: false }).defaultTo(knex.fn.now());

    table.foreign("company_id").references("company.id").onDelete("CASCADE").onUpdate("CASCADE");
    table.foreign("plan_id").references("plan.id").onDelete("RESTRICT").onUpdate("CASCADE");
    table.index(["company_id"]);
    table.index(["plan_id"]);
  });

  // ═══════════════════════════════════════════════════════════════
  // 2. Seed: planes, empresa legacy y suscripción inicial
  // ═══════════════════════════════════════════════════════════════

  // Seed de Planes
  await knex("plan").insert([
    { id: 1, name: "Emprendedor", price: 0, max_users: 1, max_receptions: 50 },
    { id: 2, name: "Profesional", price: 29, max_users: 5, max_receptions: -1 },
    { id: 3, name: "Empresarial", price: 89, max_users: -1, max_receptions: -1 },
  ]);
  await knex.raw("SELECT setval('plan_id_seq', (SELECT MAX(id) FROM plan))");

  // Seed de Empresa Legacy
  await knex("company").insert({
    id: 1,
    name: "Mi Taller (Legacy)",
    status: "ACTIVE",
  });
  await knex.raw("SELECT setval('company_id_seq', (SELECT MAX(id) FROM company))");

  // Suscripción de la Empresa Legacy al plan Profesional (ilimitado por ahora)
  await knex("subscription").insert({
    company_id: 1,
    plan_id: 2,
    start_date: knex.fn.now(),
  });

  // ═══════════════════════════════════════════════════════════════
  // 3. Añadir company_id (nullable) a tablas existentes
  // ═══════════════════════════════════════════════════════════════

  const tablesToAlter = [
    "user",
    "client",
    "device",
    "reception",
    "reception_history",
    "report",
    "budget",
    "budget_log",
  ];

  for (const tableName of tablesToAlter) {
    await knex.schema.alterTable(tableName, (table) => {
      table.integer("company_id").unsigned();
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. Backfill: asignar empresa legacy a todos los registros
  // ═══════════════════════════════════════════════════════════════

  for (const tableName of tablesToAlter) {
    await knex(tableName).update({ company_id: 1 });
  }

  // ═══════════════════════════════════════════════════════════════
  // 5. Convertir a NOT NULL + FK + índice
  // ═══════════════════════════════════════════════════════════════

  for (const tableName of tablesToAlter) {
    await knex.schema.alterTable(tableName, (table) => {
      table.integer("company_id").notNullable().unsigned().alter();
      table.foreign("company_id").references("company.id").onDelete("CASCADE").onUpdate("CASCADE");
      table.index(["company_id"]);
    });
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  const tablesToAlter = [
    "budget_log",
    "budget",
    "report",
    "reception_history",
    "reception",
    "device",
    "client",
    "user",
  ];

  // Quitar FK y columna company_id de todas las tablas
  for (const tableName of tablesToAlter) {
    await knex.schema.alterTable(tableName, (table) => {
      table.dropForeign("company_id");
      table.dropColumn("company_id");
    });
  }

  // Eliminar tablas nuevas en orden inverso
  await knex.schema.dropTableIfExists("subscription");
  await knex.schema.dropTableIfExists("plan");
  await knex.schema.dropTableIfExists("company");
}
