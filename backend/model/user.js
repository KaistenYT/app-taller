import db from "../db/dbConfig.js";
import bcrypt from "bcryptjs";
import logger from "../utils/logger.js";

export class User {
  // El hash se genera aquí; nunca se almacena la contraseña en texto plano
  static async create(userData, trx = null) {
    const q = trx || db;
    try {
      const { username, password, role } = userData;
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const payload = { 
        username, 
        password: hashedPassword, 
        role: role || "tecnico",
        status: "ACTIVE",
        created_at: db.fn.now(),
        updated_at: db.fn.now()
      };

      const [newUserId] = await q("user").insert(payload);
      return await q("user").where({ id: newUserId }).first();
    } catch (error) {
      logger.error("Error creating user:", {
        error: error.message,
        stack: error.stack,
      });
      return null;
    }
  }

  static async getByUsername(username) {
    try {
      logger.info(`[UserModel] Buscando usuario: ${username}`);
      const user = await db("user")
        .where({ username })
        .whereNull("deleted_at")
        .first();
      
      if (user) {
        logger.info(`[UserModel] Usuario '${username}' ENCONTRADO (id: ${user.id})`);
      } else {
        const allUsers = await db("user").select("username");
        logger.warn(`[UserModel] Usuario '${username}' NO encontrado. Usuarios existentes: ${allUsers.map(u => u.username).join(', ')}`);
      }
      return user;
    } catch (error) {
      logger.error(`[UserModel] Error en getByUsername: ${error.message}`);
      return null;
    }
  }

  static async validatePassword(username, password) {
    try {
      const user = await this.getByUsername(username);
      if (!user || !user.password) return false;
      return await bcrypt.compare(password, user.password);
    } catch (error) {
      return false;
    }
  }

  static async getById(id) {
    try {
      return await db("user").where({ id }).whereNull("deleted_at").first();
    } catch (error) {
      return null;
    }
  }

  static async getAll() {
    try {
      return await db("user")
        .select("id", "username", "role")
        .whereNull("deleted_at");
    } catch (error) {
      throw new Error("Error al obtener usuarios");
    }
  }

  static async delete(id) {
    try {
      return await db("user").where({ id }).update({ deleted_at: db.fn.now() });
    } catch (error) {
      throw new Error("Error al eliminar usuario");
    }
  }

  // Re-hashea la contraseña si viene en los datos de actualización
  static async update(id, data) {
    try {
      if (!id || !data) {
        throw new Error("User.update: id and data are required");
      }
      const updatedData = { ...data };

      if (updatedData.password) {
        updatedData.password = await bcrypt.hash(updatedData.password, 10);
      }

      await db("user")
        .where({ id })
        .whereNull("deleted_at")
        .update(updatedData);
      return await db("user").where({ id }).first();
    } catch (error) {
      logger.error("Error in User.update:", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
}
