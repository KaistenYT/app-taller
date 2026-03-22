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
      .where({ "subscription.company_id": company_id })
      .select("subscription.*", "plan.name as plan_name", "plan.max_users", "plan.max_receptions", "plan.max_budgets")
      .first();
  }
}
