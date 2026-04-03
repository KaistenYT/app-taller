/**
 * Migración: Índices de rendimiento para consultas multi-tenant y filtrado.
 * Sprint 1 - Tarea B2: Agregar índices en PostgreSQL para company_id, created_at, status.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // 1. RECEPTION: Muy consultada por estado y fecha en el dashboard.
  await knex.schema.alterTable("reception", (table) => {
    table.index(["company_id", "status"], "idx_reception_company_status");
    table.index(["company_id", "created_at"], "idx_reception_company_created");
    table.index(["status"], "idx_reception_status");
  });

  // 2. DEVICE: Búsquedas por empresa y fecha de creación.
  await knex.schema.alterTable("device", (table) => {
    table.index(["company_id", "created_at"], "idx_device_company_created");
  });

  // 3. CLIENT: Búsquedas por empresa (aunque es parte de PK, un índice explícito ayuda en JOINS).
  await knex.schema.alterTable("client", (table) => {
    table.index(["company_id"], "idx_client_company_id");
  });

  // 4. REPORT: Listados por empresa y fecha.
  await knex.schema.alterTable("report", (table) => {
    table.index(["company_id", "created_at"], "idx_report_company_created");
  });

  // 5. BUDGET: Ya tiene algunos índices de la migración previa, completamos con los básicos.
  await knex.schema.alterTable("budget", (table) => {
    table.index(["company_id", "status"], "idx_budget_company_status");
    table.index(["company_id", "created_at"], "idx_budget_company_created");
  });

  // 6. COMPANY: Filtrado por estado (ej. empresas activas/suspendidas).
  await knex.schema.alterTable("company", (table) => {
    table.index(["status"], "idx_company_status");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.alterTable("reception", (table) => {
    table.dropIndex([], "idx_reception_company_status");
    table.dropIndex([], "idx_reception_company_created");
    table.dropIndex([], "idx_reception_status");
  });

  await knex.schema.alterTable("device", (table) => {
    table.dropIndex([], "idx_device_company_created");
  });

  await knex.schema.alterTable("client", (table) => {
    table.dropIndex([], "idx_client_company_id");
  });

  await knex.schema.alterTable("report", (table) => {
    table.dropIndex([], "idx_report_company_created");
  });

  await knex.schema.alterTable("budget", (table) => {
    table.dropIndex([], "idx_budget_company_status");
    table.dropIndex([], "idx_budget_company_created");
  });

  await knex.schema.alterTable("company", (table) => {
    table.dropIndex([], "idx_company_status");
  });
}
