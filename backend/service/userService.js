import { User } from "../model/user.js";
import { userSchema } from "../validation/schemas.js";

export class UserService {
  static async registerUser(userData) {
    const { error, value } = userSchema.register.validate(userData);
    if (error) {
      throw new Error(`Validación fallida: ${error.details[0].message}`);
    }

    const { username, password, role } = value;
    const existingUser = await User.getByUsername(username);
    if (existingUser) {
      throw new Error("El nombre de usuario ya existe");
    }
    return await User.create({ username, password, role });
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
    };
  }

  static async getByUserId(id) {
    const user = await User.getById(id);
    if (!user) return null;
    return {
      id: user.id,
      username: user.username,
      role: user.role,
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
      console.error("Error in UserService.resetPassword:", error);
      throw error;
    }
  }

  static async listUsers(requestingRole) {
    if (requestingRole !== "admin") {
      throw new Error("Solo administradores pueden listar usuarios");
    }
    return await User.getAll();
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
