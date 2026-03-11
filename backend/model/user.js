import db from "../db/dbConfig.js";
import bcrypt from "bcrypt";

export class User {
  // El hash se genera aquí; nunca se almacena la contraseña en texto plano
  static async create(userData) {
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const role = userData.role || "user";
      const payload = { ...userData, password: hashedPassword, role: role };
      const [row] = await db("user").insert(payload).returning("id");
      const newUserId = row.id ?? row;
      return await db("user").where({ id: newUserId }).first();
    } catch (error) {
      console.error("Error creating user:", error);
      return null;
    }
  }

  static async getByUsername(username) {
    try {
      return await db("user").where({ username }).first();
    } catch (error) {
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
      return await db("user").where({ id }).first();
    } catch (error) {
      return null;
    }
  }

  static async getAll() {
    try {
      return await db("user").select("id", "username", "role");
    } catch (error) {
      throw new Error("Error al obtener usuarios");
    }
  }

  static async delete(id) {
    try {
      return await db("user").where({ id }).del();
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

      await db("user").where({ id }).update(updatedData);
      return await db("user").where({ id }).first();
    } catch (error) {
      console.error("Error in User.update:", error);
      throw error;
    }
  }
}
