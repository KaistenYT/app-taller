/**
 * Migración: Eliminación de Multi-Tenancy
 * 
 * Esta migración convierte la aplicación de SaaS multi-tenant a Single Tenant.
 * - Elimina tablas: company, plan, subscription
 * - Elimina columna company_id de todas las tablas
 * - Elimina constraints compuestos y los reemplaza con constraints simples
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  console.log("🔄 Ejecutando migración: eliminación de multi-tenancy...");

  // 1. Eliminar foreign keys que referencian company_id
  await knex.schema.alterTable("user", (table) => {
    table.dropForeign("company_id");
  });

  await knex.schema.alterTable("client", (table) => {
    table.dropForeign("company_id");
  });

  await knex.schema.alterTable("device", (table) => {
    table.dropForeign("company_id");
  });

  await knex.schema.alterTable("reception", (table) => {
    table.dropForeign("company_id");
    // Drop compound foreign key
    table.dropForeign(["company_id", "client_idNumber"]);
  });

  await knex.schema.alterTable("report", (table) => {
    table.dropForeign("company_id");
  });

  await knex.schema.alterTable("reception_history", (table) => {
    table.dropForeign("company_id");
  });

  await knex.schema.alterTable("budget", (table) => {
    table.dropForeign("company_id");
  });

  await knex.schema.alterTable("budget_log", (table) => {
    table.dropForeign("company_id");
  });

  await knex.schema.alterTable("subscription", (table) => {
    table.dropForeign("company_id");
    table.dropForeign("plan_id");
  });

  // 2. Eliminar tablas SaaS
  await knex.schema.dropTableIfExists("subscription");
  await knex.schema.dropTableIfExists("plan");
  await knex.schema.dropTableIfExists("company");

  // 3. Eliminar índices y constraints compuestos
  await knex.schema.alterTable("user", (table) => {
    table.dropUnique(["company_id", "username"]);
    table.dropIndex("company_id");
  });

  await knex.schema.alterTable("client", (table) => {
    // Drop compound primary key, se recreará sin company_id
  });

  await knex.schema.alterTable("device", (table) => {
    table.dropUnique(["company_id", "serial_number"]);
    table.dropIndex(["company_id", "serial_number"]);
  });

  // 4. Eliminar columna company_id de todas las tablas
  await knex.schema.alterTable("user", (table) => {
    table.dropColumn("company_id");
    // Agregar constraint único simple para username
    table.unique("username");
  });

  // Para client, necesitamos recrear la tabla con PK simple
  await knex.schema.hasColumn("client", "company_id").then(async (hasColumn) => {
    if (hasColumn) {
      // Necesitamos manejar la PK compuesta
      // Primero agregamos una columna id temporal
      await knex.schema.alterTable("client", (table) => {
        table.increments("id").primary();
      });
      
      // Ahora eliminamos company_id
      await knex.schema.alterTable("client", (table) => {
        table.dropColumn("company_id");
      });
      
      // Agregamos constraint único en idNumber
      await knex.schema.alterTable("client", (table) => {
        table.unique("idNumber");
      });
    }
  });

  await knex.schema.alterTable("device", (table) => {
    table.dropColumn("company_id");
    table.unique("serial_number");
  });

  await knex.schema.alterTable("reception", (table) => {
    table.dropColumn("company_id");
    table.index("client_idNumber");
  });

  await knex.schema.alterTable("report", (table) => {
    table.dropColumn("company_id");
  });

  await knex.schema.alterTable("reception_history", (table) => {
    table.dropColumn("company_id");
  });

  await knex.schema.alterTable("budget", (table) => {
    table.dropColumn("company_id");
  });

  await knex.schema.alterTable("budget_log", (table) => {
    table.dropColumn("company_id");
  });

  // 5. Crear usuario admin por defecto si no existe
  const adminExists = await knex("user").where({ username: "admin" }).first();
  if (!adminExists) {
    const bcrypt = require("bcrypt");
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await knex("user").insert({
      username: "admin",
      password: hashedPassword,
      role: "admin",
    });
    console.log("✅ Usuario admin creado (username: admin, password: admin123)");
  }

  console.log("✅ Migración de eliminación de multi-tenancy completada");
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  console.log("⚠️ Revirtiendo migración de multi-tenancy...");
  
  // Esta operación es compleja y potencialmente destructiva
  // En producción, se recomienda backup antes de ejecutar down
  console.log("⚠️ WARNING: Down migration may result in data loss");

  // 1. Recrear tablas SaaS
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

  // 2. Agregar company_id de vuelta a todas las tablas
  const tables = ["user", "client", "device", "reception", "report", "reception_history", "budget", "budget_log"];
  
  for (const tableName of tables) {
    await knex.schema.alterTable(tableName, (table) => {
      table.integer("company_id").notNullable().unsigned().defaultTo(1);
      table.foreign("company_id").references("company.id").onDelete("CASCADE");
      table.index("company_id");
    });
  }

  // 3. Seed data básico
  await knex("plan").insert([
    { id: 1, name: "FREE", price: 0, max_users: 1, max_receptions: 20, max_budgets: 10 },
    { id: 2, name: "PROFESIONAL", price: 29, max_users: 5, max_receptions: -1, max_budgets: -1 },
    { id: 3, name: "EMPRESARIAL", price: 89, max_users: -1, max_receptions: -1, max_budgets: -1 },
  ]);

  await knex("company").insert({
    id: 1,
    name: "Mi Taller (Legacy)",
    status: "ACTIVE",
  });

  await knex("subscription").insert({
    company_id: 1,
    plan_id: 3,
    start_date: knex.fn.now(),
  });

  console.log("✅ Migración revertida (multi-tenancy restaurada)");
}
