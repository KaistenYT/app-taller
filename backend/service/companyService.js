import { Company } from "../model/company.js";

/**
 * CompanyService - Adaptado para Single Tenant
 * Ahora siempre trabaja con la empresa ID 1
 */
export class CompanyService {
  static async getCompany() {
    // En Single Tenant solo hay una empresa, la ID 1
    const company = await Company.getById(1);
    if (!company) throw new Error("Configuración de empresa no encontrada");
    return company;
  }

  static async updateCompany(id_ignored, data) {
    // Ignoramos el ID y siempre actualizamos la ID 1
    const allowedFields = ['name', 'rif', 'phone', 'address', 'email', 'currency_symbol', 'terms', 'logo'];
    const updateData = {};
    
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    return await Company.update(1, updateData);
  }

  // Los métodos de registro y listado masivo ya no son necesarios en Single Tenant básico
  static async registerCompany() {
    throw new Error("El registro de nuevas empresas está deshabilitado en modo Single Tenant.");
  }

  static async listCompanies() {
    const company = await this.getCompany();
    return [company];
  }
}
