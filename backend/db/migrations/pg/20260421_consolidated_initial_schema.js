/**
 * Esquema Inicial Consolidado - NanoLogic App Taller (Single Tenant / SQLite)
 * 
 * Este archivo fusiona todas las migraciones previas en un único estado inicial limpio.
 */

export async function up(knex) {
  // 1. Tabla de Configuración del Taller (anteriormente company)
  await knex.schema.createTable("company", (table) => {
    table.increments("id").primary();
    table.string("name", 100).notNullable();
    table.string("rif", 20);
    table.string("phone", 20);
    table.string("address", 255);
    table.string("email", 255);
    table.text("logo"); // Base64 o URL local
    table.string("currency_symbol", 10).defaultTo("$");
    table.text("terms"); // Términos y condiciones por defecto
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
    table.timestamp("deleted_at").nullable();
  });

  // 2. Usuarios
  await knex.schema.createTable("user", (table) => {
    table.increments("id").primary();
    table.string("username", 30).notNullable().unique();
    table.string("password", 255).notNullable();
    table.string("role", 20).notNullable().defaultTo("tecnico"); // admin, tecnico
    table.string("status", 20).notNullable().defaultTo("ACTIVE");
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
    table.timestamp("deleted_at").nullable();
  });

  // 3. Clientes
  await knex.schema.createTable("client", (table) => {
    table.string("idNumber", 20).primary(); // Cédula, RIF, etc.
    table.string("name", 100).notNullable();
    table.string("phone", 20);
    table.string("email", 100);
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
    table.timestamp("deleted_at").nullable();
  });

  // 4. Equipos / Dispositivos
  await knex.schema.createTable("device", (table) => {
    table.increments("id").primary();
    table.string("serial_number", 50).notNullable();
    table.string("description", 255).notNullable();
    table.text("features"); // Características técnicas
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
    table.timestamp("deleted_at").nullable();
    
    table.unique(["serial_number"]);
  });

  // 5. Recepciones
  await knex.schema.createTable("reception", (table) => {
    table.increments("id").primary();
    table.string("client_idNumber", 20).references("idNumber").inTable("client").onDelete("CASCADE");
    table.integer("device_id").unsigned().references("id").inTable("device").onDelete("CASCADE");
    table.text("defect").notNullable();
    table.string("status", 20).notNullable().defaultTo("PENDIENTE");
    table.text("repair"); // Observaciones de reparación
    table.text("device_snapshot"); // JSON stringificado con el estado al entrar
    table.boolean("archived").defaultTo(false);
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
    table.timestamp("deleted_at").nullable();
  });

  // 6. Historial de Recepciones
  await knex.schema.createTable("reception_history", (table) => {
    table.increments("id").primary();
    table.integer("reception_id").unsigned().references("id").inTable("reception").onDelete("CASCADE");
    table.string("client_id", 20);
    table.integer("device_id").unsigned();
    table.integer("user_id").unsigned().references("id").inTable("user");
    table.timestamp("reception_date");
    table.string("status", 20);
    table.string("action", 50).notNullable(); // CREATED, UPDATED, STATUS_CHANGE, etc.
    table.text("reason");
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });

  // 7. Reportes (Entrega de equipos)
  await knex.schema.createTable("report", (table) => {
    table.increments("id").primary();
    table.integer("reception_id").unsigned().references("id").inTable("reception").onDelete("CASCADE");
    table.text("description");
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
    table.timestamp("deleted_at").nullable();
  });

  // 8. Presupuestos
  await knex.schema.createTable("budget", (table) => {
    table.increments("id").primary();
    table.integer("reception_id").unsigned().references("id").inTable("reception").onDelete("CASCADE");
    table.text("items"); // JSON stringificado con lista de repuestos/servicios
    table.text("notes"); // Notas adicionales del presupuesto
    table.decimal("total_amount", 12, 2).defaultTo(0);
    table.decimal("paid_amount", 12, 2).defaultTo(0);
    table.string("status", 20).defaultTo("PENDIENTE"); // PENDIENTE, APROBADO, RECHAZADO
    table.string("payment_status", 20).defaultTo("PENDIENTE"); // PENDIENTE, PARCIAL, PAGADO
    table.timestamp("paid_at").nullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
    table.timestamp("deleted_at").nullable();
  });

  // 9. Auditoría de Presupuestos
  await knex.schema.createTable("budget_log", (table) => {
    table.increments("id").primary();
    table.integer("budget_id").unsigned().references("id").inTable("budget").onDelete("CASCADE");
    table.integer("user_id").unsigned().references("id").inTable("user");
    table.string("action", 50);
    table.string("previous_status", 20);
    table.text("snapshot");
    table.text("reason");
    table.timestamp("event_timestamp").defaultTo(knex.fn.now());
  });

  // 10. Índices de rendimiento
  await knex.schema.table("reception", table => {
    table.index(["status"], "idx_reception_status");
    table.index(["created_at"], "idx_reception_date");
  });
  
  await knex.schema.table("budget", table => {
    table.index(["status"], "idx_budget_status");
    table.index(["payment_status"], "idx_budget_payment");
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("budget_log");
  await knex.schema.dropTableIfExists("budget");
  await knex.schema.dropTableIfExists("report");
  await knex.schema.dropTableIfExists("reception_history");
  await knex.schema.dropTableIfExists("reception");
  await knex.schema.dropTableIfExists("device");
  await knex.schema.dropTableIfExists("client");
  await knex.schema.dropTableIfExists("user");
  await knex.schema.dropTableIfExists("company");
}
