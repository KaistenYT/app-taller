import { CompanyService } from "../service/companyService.js";

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

/** GET /api/companies/me — Datos de la empresa (Configuración Global) */
export const getMyCompany = async (req, res) => {
  try {
    const company = await CompanyService.getCompany();
    if (!company) return res.status(404).json({
      error: { code: 404, message: "Configuración no encontrada" },
    });
    res.json(company);
  } catch (err) {
    handleError(res, err);
  }
};

/** PUT /api/companies/me — Actualizar configuración (solo admin) */
export const updateMyCompany = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      error: {
        code: 403,
        message: "Acceso denegado. Solo los administradores pueden modificar la configuración.",
      },
    });
  }
  try {
    const company = await CompanyService.updateCompany(null, req.body);
    res.json(company);
  } catch (err) {
    handleError(res, err);
  }
};
