import db from "../db/dbConfig.js";
import { Company } from "../model/company.js";
import { User } from "../model/user.js";

export class CompanyService {
  /**
   * Registra una nueva empresa, crea su primer usuario administrador,
   * y la inscribe en el plan seleccionado.
   * @param {{ name, rif, phone, address, email }} companyData
   * @param {{ username, password }} adminData
   * @param {number} planId
   */
  static async registerCompany(companyData, adminData, planId) {
    const trx = await db.transaction();
    try {
      // 1. Verificar plan
      const plan = await trx("plan").where({ id: planId }).first();
      if (!plan) throw new Error("Plán no encontrado o inválido");

      // 2. Crear Empresa
      const company = await Company.create(
        {
          name: companyData.name,
          rif: companyData.rif || null,
          phone: companyData.phone || null,
          address: companyData.address || null,
          email: companyData.email || null,
          status: "ACTIVE",
        },
        trx,
      );

      // 3. Crear Suscripción
      await trx("subscription").insert({
        company_id: company.id,
        plan_id: plan.id,
        start_date: db.fn.now(),
        // end_date: null (suscripción activa sin fecha de fin por ahora)
      });

      // 4. Crear el admin de la empresa
      const userData = {
        username: adminData.username,
        password: adminData.password,
        role: "admin",
        company_id: company.id,
      };
      const admin = await User.create(userData, trx);
      if (!admin) throw new Error("No se pudo crear el usuario administrador");

      await trx.commit();
      return { company, admin: { id: admin.id, username: admin.username, role: admin.role, company_id: company.id } };
    } catch (err) {
      await trx.rollback();
      throw err;
    }
  }

  static async getCompany(id) {
    const company = await Company.getById(id);
    if (!company) throw new Error("Empresa no encontrada");
    return company;
  }

  static async updateCompany(id, data) {
    return await Company.update(id, data);
  }
}
