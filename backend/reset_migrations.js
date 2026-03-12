import db from "./db/dbConfig.js";

async function resetMigrations() {
  try {
    console.log("Conectando a la base de datos para limpiar el historial de migraciones...");
    // Intentaremos eliminar las tablas que mantienen el registro de qué migraciones se han ejecutado
    // Esto es seguro porque la nueva tabla de esquema tiene verificaciones IF NOT EXISTS, o partiríamos de cero.
    // Knex usa 'knex_migrations' y 'knex_migrations_lock' por defecto.
    
    await db.schema.dropTableIfExists("knex_migrations");
    await db.schema.dropTableIfExists("knex_migrations_lock");
    
    console.log("Historial de migraciones limpiado correctamente.");
  } catch (err) {
    console.error("Error al limpiar migraciones:", err);
  } finally {
    await db.destroy();
  }
}

resetMigrations();
