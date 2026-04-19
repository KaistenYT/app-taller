import { Company } from "../model/company.js";
import logger from "../utils/logger.js";

/**
 * WorkshopSettingsService - Adaptado para Single Tenant (Desktop)
 * Maneja la configuración global del taller (Nombre, Logo, RIF, etc.)
 */
export class WorkshopSettingsService {
  /**
   * Obtiene la configuración actual del taller (ID 1 por defecto)
   */
  static async getSettings() {
    try {
      let settings = await Company.getById(1);
      
      // Si por alguna razón no existe (ej. DB nueva), la creamos
      if (!settings) {
        settings = await Company.create({
          id: 1,
          name: "Mi Taller",
          currency_symbol: "$"
        });
      }
      return settings;
    } catch (error) {
      logger.error("[WorkshopSettingsService] Error al obtener configuración:", error);
      throw error;
    }
  }

  /**
   * Actualiza la información del taller
   */
  static async updateSettings(data) {
    const allowedFields = [
      'name', 'rif', 'phone', 'address', 'email', 
      'currency_symbol', 'terms', 'logo'
    ];
    
    const updateData = {};
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    try {
      return await Company.update(1, updateData);
    } catch (error) {
      logger.error("[WorkshopSettingsService] Error al actualizar configuración:", error);
      throw error;
    }
  }
}
