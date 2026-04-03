import db from "../db/dbConfig.js";

export class SubscriptionService {
  /**
   * Verifica si una empresa tiene cupo disponible para un recurso (users, receptions, etc.)
   * @param {number} company_id 
   * @param {string} resource 'max_users' | 'max_receptions' | 'max_budgets'
   * @param {object} trx Transacción opcional
   */
  static async checkQuota(company_id, resource, trx = null) {
    const q = trx || db;

    // 1. Obtener el plan actual y sus límites
    const subscription = await q("subscription")
      .join("plan", "subscription.plan_id", "plan.id")
      .where({ "subscription.company_id": company_id, "subscription.status": "ACTIVE" })
      .select(`plan.${resource}`)
      .first();

    if (!subscription) {
      throw new Error("Su empresa no tiene una suscripción activa.");
    }

    const limit = subscription[resource];

    // Si el límite es -1 (ilimitado), permitir siempre
    if (limit === -1) return true;

    // 2. Contar uso actual según el recurso
    let currentUsage = 0;

    if (resource === "max_users") {
      const res = await q("user").where({ company_id }).count("id as count").first();
      currentUsage = parseInt(res.count, 10);
    } else if (resource === "max_receptions") {
      const res = await q("reception")
        .where({ company_id, archived: false })
        .count("id as count")
        .first();
      currentUsage = parseInt(res.count, 10);
    } else if (resource === "max_budgets") {
      const res = await q("budget").where({ company_id }).count("id as count").first();
      currentUsage = parseInt(res.count, 10);
    }

    if (currentUsage >= limit) {
      const resourceName = resource.split("_")[1]; // 'users', 'receptions'...
      throw new Error(`Límite alcanzado: Su plan permite un máximo de ${limit} ${resourceName}. Actualice su plan para continuar.`);
    }

    return true;
  }

  static async getSubscriptionDetails(company_id) {
    return await db("subscription")
      .join("plan", "subscription.plan_id", "plan.id")
      .where({ "subscription.company_id": company_id, "subscription.status": "ACTIVE" })
      .select(
        "subscription.id",
        "subscription.company_id",
        "subscription.plan_id",
        "subscription.start_date",
        "subscription.status",
        "plan.name as plan_name",
        "plan.price",
        "plan.max_users",
        "plan.max_receptions",
        "plan.max_budgets"
      )
      .first();
  }

  /**
   * Lista todos los planes activos disponibles
   */
  static async listPlans() {
    return await db("plan").where({ status: "ACTIVE" }).orderBy("price", "asc");
  }

  /**
   * Actualiza el plan de suscripción de una empresa
   * @param {number} company_id 
   * @param {number} new_plan_id 
   */
  static async updatePlan(company_id, new_plan_id) {
    return await db.transaction(async (trx) => {
      // 1. Verificar que el nuevo plan existe y está activo
      const newPlan = await trx("plan")
        .where({ id: new_plan_id, status: "ACTIVE" })
        .first();
      
      if (!newPlan) {
        throw new Error("El plan seleccionado no existe o no está activo.");
      }

      // 2. Obtener la suscripción actual
      const currentSub = await trx("subscription")
        .where({ company_id, status: "ACTIVE" })
        .first();

      if (currentSub) {
        // Si es el mismo plan, no hacer nada (o lanzar error opcionalmente)
        if (currentSub.plan_id === parseInt(new_plan_id, 10)) {
          throw new Error("Su empresa ya se encuentra en este plan.");
        }

        // 3. Desactivar la suscripción actual (Set end_date y status)
        await trx("subscription")
          .where({ id: currentSub.id })
          .update({
            status: "INACTIVE",
            end_date: trx.fn.now(),
            updated_at: trx.fn.now()
          });
      }

      // 4. Crear la nueva suscripción
      const [newSubId] = await trx("subscription").insert({
        company_id,
        plan_id: new_plan_id,
        start_date: trx.fn.now(),
        status: "ACTIVE",
        notes: currentSub ? `Upgrade/Downgrade desde plan ${currentSub.plan_id}` : "Nueva suscripción"
      }).returning("id");

      return {
        id: newSubId,
        plan_name: newPlan.name,
        message: `Plan actualizado correctamente a ${newPlan.name}`
      };
    });
  }
}
