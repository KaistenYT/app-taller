import db from "../db/dbConfig.js";
import { User } from "../model/user.js";
import { WorkshopSettingsService } from "../service/workshopSettingsService.js";

/**
 * Verifica si el sistema ya está configurado (si existe el primer administrador)
 */
export const getSetupStatus = async (req, res) => {
  try {
    const adminExists = await db("user").where({ role: "admin" }).first();
    res.json({ isInitialized: !!adminExists });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Inicializa el sistema con la configuración básica del taller y el administrador inicial
 */
export const initializeSystem = async (req, res) => {
  const { company, admin } = req.body;

  try {
    // 1. Verificar si ya está inicializado
    const adminExists = await db("user").where({ role: "admin" }).first();
    if (adminExists) {
      return res.status(400).json({ error: "El sistema ya ha sido inicializado." });
    }

    if (!company?.name || !admin?.username || !admin?.password) {
      return res.status(400).json({ error: "Faltan datos obligatorios para la configuración inicial." });
    }

    const trx = await db.transaction();
    try {
      // 2. Actualizar la configuración básica del taller (ID 1)
      const companyExists = await trx("company").where({ id: 1 }).first();
      
      const companyData = {
        name: company.name,
        rif: company.rif || null,
        phone: company.phone || null,
        address: company.address || null,
        email: company.email || null,
        currency_symbol: company.currency_symbol || "$",
        updated_at: db.fn.now()
      };

      if (companyExists) {
        await trx("company").where({ id: 1 }).update(companyData);
      } else {
        await trx("company").insert({
          id: 1,
          ...companyData,
          created_at: db.fn.now()
        });
      }

      // 3. Crear el administrador inicial
      await User.create({
        username: admin.username.trim(),
        password: admin.password,
        role: "admin"
      }, trx);

      await trx.commit();
      res.status(201).json({ success: true, message: "Sistema inicializado con éxito." });
    } catch (err) {
      await trx.rollback();
      throw err;
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
