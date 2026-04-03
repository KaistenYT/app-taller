import db from "../db/dbConfig.js";
import { User } from "../model/user.js";
import { userSchema } from "../validation/schemas.js";
import logger from "../utils/logger.js";
import { SubscriptionService } from "./subscriptionService.js";

export class UserService {
  static async registerUser(userData, company_id) {
    if (!company_id) {
      throw new Error("company_id es requerido para registrar un usuario");
    }

    const { error, value } = userSchema.register.validate(userData);
    if (error) {
      throw new Error(`Validación fallida: ${error.details[0].message}`);
    }

    const { username, password, role } = value;
    const existingUser = await User.getByUsername(username);
    if (existingUser) {
      throw new Error("El nombre de usuario ya existe");
    }

    const trx = await db.transaction();
    try {
      // 1. Verificar límites del plan SaaS
      await SubscriptionService.checkQuota(company_id, "max_users", trx);

      // 2. Crear usuario si pasa la validación
      const user = await User.create(
        { username, password, role, company_id },
        trx,
      );
      await trx.commit();
      return user;
    } catch (err) {
      await trx.rollback();
      throw err;
    }
  }

  static async login(username, password) {
    if (!username || !password) {
      throw new Error("Usuario y contraseña requeridos");
    }
    const user = await User.getByUsername(username);
    if (!user) {
      throw new Error("Credenciales inválidas");
    }
    const isValid = await User.validatePassword(username, password);
    if (!isValid) {
      throw new Error("Credenciales inválidas");
    }
    // Retornamos info segura (sin password)
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      company_id: user.company_id,
    };
  }

  static async getByUserId(id) {
    const user = await User.getById(id);
    if (!user) return null;
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      company_id: user.company_id,
    };
  }

  // Solo administradores pueden restablecer contraseñas de otros usuarios
  static async resetPassword(username, newPassword, requestingUserRole) {
    try {
      if (requestingUserRole !== "admin") {
        throw new Error("Solo administradores pueden restablecer contraseñas");
      }
      if (!username || !newPassword) {
        throw new Error("resetPassword: username and newPassword are required");
      }
      // Validación básica de longitud, aunque schemas podría usarse si se define un esquema solo para password
      if (newPassword.length < 4) {
        throw new Error("La contraseña debe tener al menos 4 caracteres");
      }

      const user = await User.getByUsername(username);
      if (!user) {
        throw new Error("resetPassword: Usuario no encontrado");
      }

      const updatedUser = await User.update(user.id, { password: newPassword });
      return updatedUser;
    } catch (error) {
      logger.error("Error in UserService.resetPassword:", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  static async listUsers(requestingRole, company_id) {
    if (requestingRole !== "admin") {
      throw new Error("Solo administradores pueden listar usuarios");
    }
    return await User.getAll(company_id);
  }

  // Permite cambiar username y/o role (no contraseña — usar resetPassword)
  static async updateUser(id, data, requestingRole) {
    if (requestingRole !== "admin") {
      throw new Error("Solo administradores pueden editar usuarios");
    }

    // Validación con Joi (permitiendo campos parciales)
    const { error, value } = userSchema.update.validate(data);
    if (error) {
      throw new Error(`Validación fallida: ${error.details[0].message}`);
    }

    if (!id) {
      throw new Error("updateUser: id es requerido");
    }

    const { username, role } = value;
    const updatePayload = {};
    if (username) updatePayload.username = username;
    if (role) updatePayload.role = role;

    if (Object.keys(updatePayload).length === 0) {
      throw new Error("updateUser: nada que actualizar");
    }

    if (username) {
      const existing = await User.getByUsername(username);
      if (existing && existing.id !== Number(id)) {
        throw new Error("El nombre de usuario ya está en uso");
      }
    }

    return await User.update(id, updatePayload);
  }

  static async deleteUser(id, requestingUserId, requestingRole) {
    if (requestingRole !== "admin") {
      throw new Error("Solo administradores pueden eliminar usuarios");
    }
    if (Number(id) === Number(requestingUserId)) {
      throw new Error("No puedes eliminar tu propia cuenta");
    }
    const user = await User.getById(id);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }
    return await User.delete(id);
  }
}
