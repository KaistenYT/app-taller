import db from "../db/dbConfig.js";
import bcrypt from "bcrypt";

export class User {
  static async create(userData) {
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const payload = { ...userData, password: hashedPassword };
      const [newUserId] = await db("user").insert(payload);
      return await db("user").where({ id: newUserId }).first();
    } catch (error) {
      console.error("DB Error [User.create]: ", error);
      return null;
    }
  }

  static async getByUsername(username) {
    try {
      return await db("user").where({ username }).first();
    } catch (error) {
      console.error("DB Error [User.getByUsername]: ", error);
      return null;
    }
  }

  static async validatePassword(username, password) {
    try {
      const user = await this.getByUsername(username);
      if (!user || !user.password) return false;
      return await bcrypt.compare(password, user.password);
    } catch (error) {
      console.error("DB Error [User.validatePassword]: ", error);
      return false;
    }
  }

  static async getById(id) {
    try {
      return await db("user").where({ id }).first();
    } catch (error) {
      console.error("DB Error [User.getById]: ", error);
      return null;
    }
  }
}
