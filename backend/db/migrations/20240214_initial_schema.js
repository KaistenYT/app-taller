/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // Tabla device
  if (!(await knex.schema.hasTable("device"))) {
    await knex.schema.createTable("device", (table) => {
      table.increments("id").primary();
      table.string("description").notNullable();
      table.string("features");
      table.string("serial_number").unique();
      table
        .timestamp("created_at")
        .defaultTo(knex.raw("(datetime('now','localtime'))"));
      table
        .timestamp("updated_at")
        .defaultTo(knex.raw("(datetime('now','localtime'))"));
      table.index(["serial_number"]);
    });
  }

  // Tabla client
  if (!(await knex.schema.hasTable("client"))) {
    await knex.schema.createTable("client", (table) => {
      table.string("idNumber").primary().notNullable();
      table.string("name").notNullable();
      table.string("phone").notNullable();
    });
  }

  // Tabla reception
  if (!(await knex.schema.hasTable("reception"))) {
    await knex.schema.createTable("reception", (table) => {
      table.increments("id").primary();
      table.string("client_idNumber").notNullable();
      table.integer("device_id").notNullable().unsigned();
      table.string("defect").notNullable();
      table.string("status").notNullable().defaultTo("PENDIENTE");
      table.string("repair");
      table.json("device_snapshot");
      table
        .timestamp("created_at")
        .defaultTo(knex.raw("(datetime('now','localtime'))"));
      table
        .timestamp("updated_at")
        .defaultTo(knex.raw("(datetime('now','localtime'))"));
      table.boolean("archived").defaultTo(false);
      table
        .foreign("client_idNumber")
        .references("client.idNumber")
        .onDelete("RESTRICT")
        .onUpdate("CASCADE");
      table
        .foreign("device_id")
        .references("device.id")
        .onDelete("RESTRICT")
        .onUpdate("CASCADE");
      table.index(["client_idNumber"]);
      table.index(["device_id"]);
    });
  }

  // Tabla report
  if (!(await knex.schema.hasTable("report"))) {
    await knex.schema.createTable("report", (table) => {
      table.increments("id").primary();
      table.integer("reception_id").notNullable().unsigned();
      table.string("description").notNullable();
      table
        .timestamp("created_at")
        .defaultTo(knex.raw("(datetime('now','localtime'))"));
      table
        .foreign("reception_id")
        .references("reception.id")
        .onDelete("CASCADE")
        .onUpdate("CASCADE");
      table.index(["reception_id"]);
    });
  }

  // Tabla reception_history
  if (!(await knex.schema.hasTable("reception_history"))) {
    await knex.schema.createTable("reception_history", (table) => {
      table.increments("id").primary();
      table.integer("reception_id").notNullable().unsigned();
      table.string("client_id").notNullable();
      table.integer("device_id").notNullable().unsigned();
      table.integer("user_id").notNullable().unsigned();
      table.timestamp("reception_date").notNullable();
      table.string("status").notNullable();
      table.string("action").notNullable();
      table
        .timestamp("event_timestamp")
        .defaultTo(knex.raw("(datetime('now','localtime'))"));
      table.index(["reception_id"]);
      table.index(["user_id"]);
      table
        .foreign("user_id")
        .references("user.id")
        .onDelete("RESTRICT")
        .onUpdate("CASCADE");
    });
  }

  // Tabla user
  if (!(await knex.schema.hasTable("user"))) {
    await knex.schema.createTable("user", (table) => {
      table.increments("id").primary().unique();
      table.string("username").notNullable().unique();
      table.string("password").notNullable();
      table.string("role").notNullable().defaultTo("user");
    });
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists("user");
  await knex.schema.dropTableIfExists("reception_history");
  await knex.schema.dropTableIfExists("report");
  await knex.schema.dropTableIfExists("reception");
  await knex.schema.dropTableIfExists("client");
  await knex.schema.dropTableIfExists("device");
}
