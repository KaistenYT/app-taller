import db from "../db/dbConfig.js";

export class User {
  constructor(id, username, password, nombre, rol, created_at) {
    this.id = id;
    this.username = username;
    this.password = password;
    this.nombre = nombre;
    this.rol = rol;
    this.created_at = created_at;
  }

  static async findAll() {
    const users = await db("user").select("id", "username", "nombre", "rol", "created_at");
    return users.map(user => new User(user.id, user.username, null, user.nombre, user.rol, user.created_at));
  }

  static async findById(id) {
    const user = await db("user").where("id", id).first();
    if (!user) return null;
    return new User(user.id, user.username, user.password, user.nombre, user.rol, user.created_at);
  }

  static async findByUsername(username) {
    const user = await db("user").where("username", username).first();
    if (!user) return null;
    return new User(user.id, user.username, user.password, user.nombre, user.rol, user.created_at);
  }

  static async create(userData) {
    const [id] = await db("user").insert(userData);
    const newUser = await User.findById(id);
    return newUser;
  }

  static async update(id, userData) {
    await db("user").where("id", id).update(userData);
    return await User.findById(id);
  }

  static async delete(id) {
    return await db("user").where("id", id).del();
  }

  // Método para obtener el usuario sin la contraseña (para respuestas seguras)
  toSafeObject() {
    return {
      id: this.id,
      username: this.username,
      nombre: this.nombre,
      rol: this.rol,
      created_at: this.created_at
    };
  }
}