/**
 * Esquema Consolidado Maestro - App Taller SaaS
 *
 * Fusiona:
 * - SaaS Multi-tenant (Empresas, Planes, Suscripciones)
 * - Optimización de Tamaños (VARCHAR limitados)
 * - Soporte para Soft Deletes (deleted_at)
 * - Auditoría Completa (reason, events)
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // ═══════════════════════════════════════════════════════════════
  // 1. Tablas SaaS (Empresas y Planes)
  // ═══════════════════════════════════════════════════════════════

  await knex.schema.createTable("company", (table) => {
    table.increments("id").primary();
    table.string("name", 100).notNullable();
    table.string("rif", 20).unique();
    table.string("phone", 20);
    table.string("address", 255);
    table.string("email", 255);
    table.text("logo");
    table.string("currency_symbol", 10).defaultTo("$");
    table.text("terms");
    table.string("status", 20).notNullable().defaultTo("ACTIVE");
    table.timestamp("created_at", { useTz: false }).defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: false }).defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("plan", (table) => {
    table.increments("id").primary();
    table.string("name", 30).notNullable();
    table.text("description");
    table.decimal("price", 10, 2).notNullable().defaultTo(0);
    table.string("billing_cycle", 20).notNullable().defaultTo("MONTHLY");
    table.integer("max_users").notNullable().defaultTo(1);
    table.integer("max_receptions").notNullable().defaultTo(-1);
    table.integer("max_budgets").notNullable().defaultTo(-1);
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

    table.foreign("company_id").references("company.id").onDelete("CASCADE");
    table.foreign("plan_id").references("plan.id").onDelete("RESTRICT");
    table.index(["company_id"]);
  });

  // ═══════════════════════════════════════════════════════════════
  // 2. Tablas de Negocio (Multi-tenant)
  // ═══════════════════════════════════════════════════════════════

  // --- USER ---
  await knex.schema.createTable("user", (table) => {
    table.increments("id").primary();
    table.integer("company_id").notNullable().unsigned();
    table.string("username", 30).notNullable();
    table.string("password", 72).notNullable();
    table.string("role", 20).notNullable().defaultTo("user");
    table.timestamp("deleted_at", { useTz: false }).nullable();

    table.foreign("company_id").references("company.id").onDelete("CASCADE");
    table.unique(["company_id", "username"]);
    table.index(["company_id"]);
  });

  // --- CLIENT ---
  await knex.schema.createTable("client", (table) => {
    table.integer("company_id").notNullable().unsigned();
    table.string("idNumber", 20).notNullable();
    table.string("name", 100).notNullable();
    table.string("phone", 20).notNullable();
    table.string("email", 255);
    table.timestamp("deleted_at", { useTz: false }).nullable();

    table.primary(["company_id", "idNumber"]);
    table.foreign("company_id").references("company.id").onDelete("CASCADE");
  });

  // --- DEVICE ---
  await knex.schema.createTable("device", (table) => {
    table.increments("id").primary();
    table.integer("company_id").notNullable().unsigned();
    table.string("description", 255).notNullable();
    table.text("features");
    table.string("serial_number", 50);
    table.timestamp("created_at", { useTz: false }).defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: false }).defaultTo(knex.fn.now());
    table.timestamp("deleted_at", { useTz: false }).nullable();

    table.foreign("company_id").references("company.id").onDelete("CASCADE");
    table.unique(["company_id", "serial_number"]);
    table.index(["company_id", "serial_number"]);
  });

  // --- RECEPTION ---
  await knex.schema.createTable("reception", (table) => {
    table.increments("id").primary();
    table.integer("company_id").notNullable().unsigned();
    table.string("client_idNumber", 20).notNullable();
    table.integer("device_id").notNullable().unsigned();
    table.text("defect").notNullable();
    table.string("status", 20).notNullable().defaultTo("PENDIENTE");
    table.text("repair");
    table.jsonb("device_snapshot");
    table.boolean("archived").defaultTo(false);
    table.timestamp("created_at", { useTz: false }).defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: false }).defaultTo(knex.fn.now());
    table.timestamp("deleted_at", { useTz: false }).nullable();

    table.foreign("company_id").references("company.id").onDelete("CASCADE");
    table
      .foreign(["company_id", "client_idNumber"])
      .references(["company_id", "idNumber"])
      .inTable("client")
      .onDelete("RESTRICT")
      .onUpdate("CASCADE");
    table.foreign("device_id").references("device.id").onDelete("RESTRICT");
    table.index(["company_id", "client_idNumber"]);
    table.index(["device_id"]);
  });

  // --- REPORT ---
  await knex.schema.createTable("report", (table) => {
    table.increments("id").primary();
    table.integer("company_id").notNullable().unsigned();
    table.integer("reception_id").notNullable().unsigned();
    table.text("description").notNullable();
    table.timestamp("created_at", { useTz: false }).defaultTo(knex.fn.now());
    table.timestamp("deleted_at", { useTz: false }).nullable();

    table.foreign("company_id").references("company.id").onDelete("CASCADE");
    table
      .foreign("reception_id")
      .references("reception.id")
      .onDelete("CASCADE");
    table.index(["reception_id"]);
  });

  // --- RECEPTION_HISTORY ---
  await knex.schema.createTable("reception_history", (table) => {
    table.increments("id").primary();
    table.integer("company_id").notNullable().unsigned();
    table.integer("reception_id").notNullable().unsigned();
    table.string("client_id", 20).notNullable();
    table.integer("device_id").notNullable().unsigned();
    table.integer("user_id").notNullable().unsigned();
    table.timestamp("reception_date", { useTz: false }).notNullable();
    table.string("status", 20).notNullable();
    table.string("action", 50).notNullable();
    table.string("reason", 255);
    table
      .timestamp("event_timestamp", { useTz: false })
      .defaultTo(knex.fn.now());

    table.foreign("company_id").references("company.id").onDelete("CASCADE");
    table.foreign("user_id").references("user.id").onDelete("RESTRICT");
    table.index(["reception_id"]);
    table.index(["user_id"]);
  });

  // --- BUDGET ---
  await knex.schema.createTable("budget", (table) => {
    table.increments("id").primary();
    table.integer("company_id").notNullable().unsigned();
    table.integer("reception_id").notNullable().unsigned();
    table.jsonb("items").defaultTo("[]");
    table.text("notes");
    table.string("status", 20).notNullable().defaultTo("BORRADOR");
    table.timestamp("created_at", { useTz: false }).defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: false }).defaultTo(knex.fn.now());
    table.timestamp("deleted_at", { useTz: false }).nullable();

    table.foreign("company_id").references("company.id").onDelete("CASCADE");
    table
      .foreign("reception_id")
      .references("reception.id")
      .onDelete("CASCADE");
    table.index(["reception_id"]);
  });

  // --- BUDGET_LOG ---
  await knex.schema.createTable("budget_log", (table) => {
    table.increments("id").primary();
    table.integer("company_id").notNullable().unsigned();
    table.integer("budget_id").nullable().unsigned(); // Nullable para persistir tras borrado de budget
    table.integer("user_id").notNullable().unsigned();
    table.string("action", 30).notNullable();
    table.string("previous_status", 20);
    table.jsonb("snapshot");
    table.string("reason", 255);
    table
      .timestamp("event_timestamp", { useTz: false })
      .defaultTo(knex.fn.now());

    table.foreign("company_id").references("company.id").onDelete("CASCADE");
    table.foreign("user_id").references("user.id").onDelete("RESTRICT");
    table.index(["budget_id"]);
    table.index(["user_id"]);
  });

  // ═══════════════════════════════════════════════════════════════
  // 3. Seeds Iniciales (Planes y Empresa Legacy)
  // ═══════════════════════════════════════════════════════════════

  // Seed de Planes
  await knex("plan").insert([
    {
      id: 1,
      name: "FREE",
      price: 0,
      max_users: 1,
      max_receptions: 20,
      max_budgets: 10,
    },
    {
      id: 2,
      name: "PROFESIONAL",
      price: 29,
      max_users: 5,
      max_receptions: -1,
      max_budgets: -1,
    },
    {
      id: 3,
      name: "EMPRESARIAL",
      price: 89,
      max_users: -1,
      max_receptions: -1,
      max_budgets: -1,
    },
  ]);
  await knex.raw("SELECT setval('plan_id_seq', (SELECT MAX(id) FROM plan))");

  // Seed de Empresa Legacy
  await knex("company").insert({
    id: 1,
    name: "Mi Taller (Legacy)",
    status: "ACTIVE",
  });
  await knex.raw(
    "SELECT setval('company_id_seq', (SELECT MAX(id) FROM company))",
  );

  // Suscripción de la Empresa Legacy al plan Empresarial (ilimitado por ahora)
  await knex("subscription").insert({
    company_id: 1,
    plan_id: 3,
    start_date: knex.fn.now(),
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  // Orden inverso para evitar errores de FK
  await knex.schema.dropTableIfExists("budget_log");
  await knex.schema.dropTableIfExists("budget");
  await knex.schema.dropTableIfExists("reception_history");
  await knex.schema.dropTableIfExists("report");
  await knex.schema.dropTableIfExists("reception");
  await knex.schema.dropTableIfExists("device");
  await knex.schema.dropTableIfExists("client");
  await knex.schema.dropTableIfExists("user");
  await knex.schema.dropTableIfExists("subscription");
  await knex.schema.dropTableIfExists("plan");
  await knex.schema.dropTableIfExists("company");
}
