/**
 * Migración: Agregar campos financieros a la tabla budget
 * Propósito: Dashboard de control de pagos y presupuestos
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // Agregar columnas financieras a budget
  await knex.schema.alterTable("budget", (table) => {
    // Monto total del presupuesto (calculado desde items)
    table.decimal("total_amount", 12, 2).nullable();
    
    // Monto pagado por el cliente
    table.decimal("paid_amount", 12, 2).nullable().defaultTo(0);
    
    // Estado del pago
    table.string("payment_status", 20).notNullable().defaultTo("PENDIENTE");
    
    // Fecha de pago completo
    table.timestamp("paid_at", { useTz: false }).nullable();
    
    // Índices para consultas rápidas del dashboard
    table.index(["payment_status"]);
    table.index(["company_id", "payment_status"]);
    table.index(["created_at", "payment_status"]);
  });

  // Migrar datos existentes: calcular total_amount desde items
  const budgets = await knex("budget").select("*");
  
  for (const budget of budgets) {
    const items = budget.items || [];
    const total = items.reduce((sum, item) => {
      const price = parseFloat(item.price || item.subtotal || 0);
      const quantity = parseInt(item.quantity || 1);
      return sum + (price * quantity);
    }, 0);

    await knex("budget")
      .where({ id: budget.id })
      .update({
        total_amount: total > 0 ? total : null,
        paid_amount: 0,
        payment_status: "PENDIENTE",
      });
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  // Eliminar índices
  await knex.schema.alterTable("budget", (table) => {
    table.dropIndex(["payment_status"]);
    table.dropIndex(["company_id", "payment_status"]);
    table.dropIndex(["created_at", "payment_status"]);
    
    // Eliminar columnas
    table.dropColumn("paid_amount");
    table.dropColumn("payment_status");
    table.dropColumn("paid_at");
    table.dropColumn("total_amount");
  });
}
