import db from "../db/dbConfig.js";

/**
 * Middleware para verificar los límites de suscripción de una empresa.
 * @param {string} resourceType - 'reception' o 'budget'
 */
export const checkSubscriptionLimit = (resourceType = "reception") => {
  return async (req, res, next) => {
    const { company_id } = req.user;

    if (!company_id) {
      return res.status(400).json({ error: "Empresa no identificada." });
    }

    try {
      const subscription = await db("subscription")
        .join("plan", "subscription.plan_id", "plan.id")
        .where({
          "subscription.company_id": company_id,
          "subscription.status": "ACTIVE",
        })
        .select("plan.max_receptions", "plan.max_budgets", "plan.name")
        .first();

      if (!subscription) {
        return res.status(403).json({
          error: "SUBSCRIPTION_INACTIVE: No tienes una suscripción activa.",
        });
      }

      // Determinar ventana de tiempo: FREE (7 días) o EMPRENDEDOR (30 días)
      const isFree = subscription.name === "FREE" || subscription.name === "GRATUITO";
      const isEmprendedor = subscription.name === "EMPRENDEDOR";
      
      const timeWindow = new Date();
      if (isFree) {
        timeWindow.setDate(timeWindow.getDate() - 7); // Semanal
      } else if (isEmprendedor) {
        timeWindow.setMonth(timeWindow.getMonth() - 1); // Mensual
      } else {
        timeWindow.setFullYear(2000); // Casi ilimitado/histórico
      }

      const limit = resourceType === "reception" ? subscription.max_receptions : subscription.max_budgets;
      let countRes;

      if (resourceType === "reception") {
        countRes = await db("reception")
          .where({ company_id })
          .where("created_at", ">=", timeWindow)
          .count("id as count")
          .first();
      } else {
        countRes = await db("budget")
          .where({ company_id })
          .where("created_at", ">=", timeWindow)
          .count("id as count")
          .first();
      }

      const currentCount = parseInt(countRes.count, 10);
      const periodLabel = isFree ? "semanales" : "mensuales";

      if (limit !== -1 && currentCount >= limit) {
        return res.status(403).json({
          code: "LIMIT_REACHED",
          error: `Límite alcanzado: Has agotado tu cuota de ${limit} ${resourceType === "reception" ? "recepciones" : "presupuestos"} ${periodLabel} del plan ${subscription.name}.`,
          limit,
          current: currentCount,
          plan: subscription.name
        });
      }

      next();
    } catch (error) {
      console.error("[SubscriptionMiddleware] Error:", error.message);
      next(); // Failsafe para no bloquear la app
    }
  };
};
