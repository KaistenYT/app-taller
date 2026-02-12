import { User } from "../model/user.js";

export class UserService {
  /**
   * Registra un nuevo usuario en el sistema.
   * @param {Object} userData - Objeto con los datos del usuario (username, password).
   * @returns {Promise<Object>} Una promesa que resuelve con el objeto del usuario creado.
   */
  static async registerUser(userData) {
    try {
      if (!userData?.username || !userData?.password) {
        throw new Error("registerUser: username y password son requeridos");
      }

      const existingUser = await User.getByUsername(userData.username);
      if (existingUser) {
        throw new Error("registerUser: el nombre de usuario ya existe");
      }
      return await User.create(userData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Autentica a un usuario.
   * @param {string} username - El nombre de usuario.
   * @param {string} password - La contraseña del usuario.
   * @returns {Promise<Object>} Una promesa que resuelve con un objeto de usuario simplificado si las credenciales son válidas.
   */
  static async login(username, password) {
    try {
      if (!username || !password) {
        throw new Error("login: username y password son requeridos");
      }
      const user = await User.getByUsername(username);
      if (!user) throw new Error("login: usuario no encontrado");
      const isValid = await User.validatePassword(username, password);
      if (!isValid) throw new Error("login: credenciales inválidas");
      return {
        id: user.id,
        username: user.username,
        role: user.role, // Added role
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene un usuario por su ID único.
   * @param {number} id - El ID único del usuario.
   * @returns {Promise<Object|null>} Una promesa que resuelve con el objeto usuario o null si no se encuentra.
   */
  static async getByUserId(id) {
    try {
      if (!id) {
        throw new Error("getByUserId: id es requerido");
      }
      return await User.getById(id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Restablece la contraseña de un usuario.
   * @param {string} username - El nombre de usuario cuya contraseña se va a restablecer.
   * @param {string} newPassword - La nueva contraseña.
   * @returns {Promise<Object>} Una promesa que resuelve con el objeto del usuario actualizado.
   */
  static async resetPassword(username, newPassword) {
    try {
      if (!username || !newPassword) {
        throw new Error("resetPassword: username and newPassword are required");
      }
      const user = await User.getByUsername(username);
      if (!user) {
        throw new Error("resetPassword: Usuario no encontrado");
      }

      // Assuming User.updatePassword handles hashing the new password
      // If not, we would need to import a hashing utility here.
      // Assuming User.update method exists and can update password
      const updatedUser = await User.update(user.id, { password: newPassword });

      return updatedUser;
    } catch (error) {
      console.error("Error in UserService.resetPassword:", error);
      throw error;
    }
  }
}
