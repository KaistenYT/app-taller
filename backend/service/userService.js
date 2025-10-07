import { User } from "../model/user.js";
import crypto from "crypto";

export class UserService {
  
  // Hash de contraseña usando SHA-256
  static hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  // Verificar contraseña
  static verifyPassword(password, hashedPassword) {
    return this.hashPassword(password) === hashedPassword;
  }

  // Registrar nuevo usuario
  static async register(userData) {
    try {
      const { username, password, nombre, rol = "usuario" } = userData;

      // Verificar si el usuario ya existe
      const existingUser = await User.findByUsername(username);
      if (existingUser) {
        throw new Error("El usuario ya existe");
      }

      // Hash de la contraseña
      const hashedPassword = this.hashPassword(password);

      // Crear usuario
      const newUser = await User.create({
        username,
        password: hashedPassword,
        nombre,
        rol
      });

      return {
        success: true,
        message: "Usuario creado exitosamente",
        user: newUser.toSafeObject()
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Login de usuario
  static async login(credentials) {
    try {
      const { username, password } = credentials;

      // Buscar usuario por username
      const user = await User.findByUsername(username);
      if (!user) {
        throw new Error("Usuario o contraseña incorrectos");
      }

      // Verificar contraseña
      if (!this.verifyPassword(password, user.password)) {
        throw new Error("Usuario o contraseña incorrectos");
      }

      return {
        success: true,
        message: "Login exitoso",
        user: user.toSafeObject()
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Listar usuarios (sin contraseñas)
  static async listUsers() {
    try {
      const users = await User.findAll();
      return {
        success: true,
        users: users.map(user => user.toSafeObject())
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Obtener usuario por ID
  static async getUser(id) {
    try {
      const user = await User.findById(id);
      if (!user) {
        throw new Error("Usuario no encontrado");
      }
      return {
        success: true,
        user: user.toSafeObject()
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Actualizar usuario
  static async updateUser(id, userData) {
    try {
      const { password, ...otherData } = userData;
      
      // Si se proporciona una nueva contraseña, hashearla
      if (password) {
        otherData.password = this.hashPassword(password);
      }

      const updatedUser = await User.update(id, otherData);
      if (!updatedUser) {
        throw new Error("Usuario no encontrado");
      }

      return {
        success: true,
        message: "Usuario actualizado exitosamente",
        user: updatedUser.toSafeObject()
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Eliminar usuario
  static async deleteUser(id) {
    try {
      const result = await User.delete(id);
      if (result === 0) {
        throw new Error("Usuario no encontrado");
      }
      return {
        success: true,
        message: "Usuario eliminado exitosamente"
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Crear usuario administrador por defecto (para primera configuración)
  static async createDefaultAdmin() {
    try {
      const adminExists = await User.findByUsername("admin");
      if (adminExists) {
        return { success: false, message: "Admin ya existe" };
      }

      const defaultAdmin = {
        username: "admin",
        password: "admin123",
        nombre: "Administrador",
        rol: "admin"
      };

      return await this.register(defaultAdmin);
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
}