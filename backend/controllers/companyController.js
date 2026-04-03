import { CompanyService } from "../service/companyService.js";
import { SubscriptionService } from "../service/subscriptionService.js";

// Helper para distinguir errores de negocio (4xx) de errores inesperados (500)
// ... (rest of methods unchanged)

/** GET /api/companies/subscription — Obtener detalles de la suscripción actual */
export const getSubscription = async (req, res) => {
  try {
    const subscription = await SubscriptionService.getSubscriptionDetails(req.user.company_id);
    if (!subscription) {
      return res.status(404).json({
        error: { code: 404, message: "Suscripción no encontrada" },
      });
    }
    res.json(subscription);
  } catch (err) {
    handleError(res, err);
  }
};

/** GET /api/companies/plans — Listar planes disponibles */
export const listPlans = async (req, res) => {
  try {
    const plans = await SubscriptionService.listPlans();
    res.json(plans);
  } catch (err) {
    handleError(res, err);
  }
};

/** PATCH /api/companies/subscription — Actualizar el plan de la empresa */
export const updatePlan = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      error: {
        code: 403,
        message: "Acceso denegado. Solo los administradores pueden cambiar el plan.",
      },
    });
  }

  const { planId } = req.body;
  if (!planId) {
    return res.status(400).json({
      error: { code: 400, message: "El ID del nuevo plan es requerido." },
    });
  }

  try {
    const result = await SubscriptionService.updatePlan(req.user.company_id, planId);
    res.json(result);
  } catch (err) {
    handleError(res, err);
  }
};
const handleError = (res, err) => {
  const msg = err.message || "Error inesperado";
  const isBusinessError =
    msg.includes("no encontrado") ||
    msg.includes("no autorizado") ||
    msg.includes("requerido") ||
    msg.includes("inválido") ||
    msg.includes("existe") ||
    msg.includes("faltan");
  const code = isBusinessError ? 400 : 500;
  res.status(code).json({ error: { code, message: msg } });
};

/** POST /api/companies/register — Onboarding público */
export const registerCompany = async (req, res) => {
  const { company, admin, planId } = req.body;
  if (!company?.name || !admin?.username || !admin?.password || !planId) {
    return res.status(400).json({
      error: { code: 400, message: "Faltan datos obligatorios (company.name, admin, planId)" },
    });
  }
  try {
    const result = await CompanyService.registerCompany(company, admin, planId);
    res.status(201).json(result);
  } catch (err) {
    handleError(res, err);
  }
};

/** GET /api/companies/me — Datos de la empresa del usuario autenticado */
export const getMyCompany = async (req, res) => {
  try {
    const company = await CompanyService.getCompany(req.user.company_id);
    if (!company) return res.status(404).json({
      error: { code: 404, message: "Empresa no encontrada" },
    });
    res.json(company);
  } catch (err) {
    handleError(res, err);
  }
};

/** PUT /api/companies/me — Actualizar empresa (solo admin) */
export const updateMyCompany = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      error: {
        code: 403,
        message: "Acceso denegado. Solo los administradores pueden modificar la configuración de la empresa.",
      },
    });
  }
  try {
    const company = await CompanyService.updateCompany(req.user.company_id, req.body);
    res.json(company);
  } catch (err) {
    handleError(res, err);
  }
};

/** GET /api/companies/list — Listar todas las empresas con estadísticas (solo super-admin) */
export const listCompanies = async (req, res) => {
  try {
    const companies = await CompanyService.listCompanies();
    res.json(companies);
  } catch (err) {
    handleError(res, err);
  }
};
