import { CompanyService } from "../service/companyService.js";

/** POST /api/companies/register — Onboarding público */
export const registerCompany = async (req, res) => {
  const { company, admin, planId } = req.body;
  if (!company?.name || !admin?.username || !admin?.password || !planId) {
    return res.status(400).json({ error: "Faltan datos obligatorios (company.name, admin, planId)" });
  }
  const result = await CompanyService.registerCompany(company, admin, planId);
  res.status(201).json(result);
};

/** GET /api/companies/me — Datos de la empresa del usuario autenticado */
export const getMyCompany = async (req, res) => {
  const company = await CompanyService.getCompany(req.user.company_id);
  res.json(company);
};

/** PUT /api/companies/me — Actualizar empresa (solo admin) */
export const updateMyCompany = async (req, res) => {
  const company = await CompanyService.updateCompany(req.user.company_id, req.body);
  res.json(company);
};
