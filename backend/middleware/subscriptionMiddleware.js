import { SubscriptionService } from "../service/subscriptionService.js";

/**
 * Middleware para verificar cuotas antes de realizar una acción que consuma recursos.
 * @param {string} resourceName 'max_users' | 'max_receptions' | 'max_budgets'
 */
export const checkSubscriptionQuota = (resourceName) => {
  return async (req, res, next) => {
    try {
      const company_id = req.user.company_id;
      if (!company_id) {
        return res.status(403).json({ error: "No se encontró el ID de empresa para verificar suscripción." });
      }

      await SubscriptionService.checkQuota(company_id, resourceName);
      next();
    } catch (err) {
      res.status(403).json({ error: err.message });
    }
  };
};
