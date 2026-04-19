import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class BackupService {
  /**
   * Obtiene la ruta actual de la base de datos SQLite
   */
  static getDatabasePath() {
    const isProd = process.env.NODE_ENV === "production";
    if (isProd) {
      const appData = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + "/.local/share");
      return path.join(appData, "NanoLogic", "database.sqlite");
    }
    return path.resolve(__dirname, "../../db/database.sqlite");
  }

  /**
   * Crea una copia de seguridad en la ruta de destino
   */
  static async createBackup(destPath) {
    const sourcePath = this.getDatabasePath();
    try {
      if (!fs.existsSync(sourcePath)) {
        throw new Error("El archivo de base de datos origen no existe.");
      }
      
      // Asegurarse de que el directorio de destino exista
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      await fs.promises.copyFile(sourcePath, destPath);
      logger.info(`[BackupService] Backup creado exitosamente en: ${destPath}`);
      return { success: true, path: destPath };
    } catch (error) {
      logger.error("[BackupService] Error al crear backup:", error);
      throw error;
    }
  }

  /**
   * Restaura la base de datos desde un archivo externo
   * PRECAUCIÓN: Esto sobreescribirá la base de datos actual.
   */
  static async restoreBackup(sourcePath) {
    const destPath = this.getDatabasePath();
    try {
      if (!fs.existsSync(sourcePath)) {
        throw new Error("El archivo de backup origen no existe.");
      }

      // IMPORTANTE: En una app real, aquí deberíamos cerrar las conexiones de Knex antes de sobreescribir
      // Para efectos de Electron, el usuario reiniciará la app después de restaurar.
      await fs.promises.copyFile(sourcePath, destPath);
      logger.info(`[BackupService] Base de datos restaurada desde: ${sourcePath}`);
      return { success: true };
    } catch (error) {
      logger.error("[BackupService] Error al restaurar backup:", error);
      throw error;
    }
  }
}
