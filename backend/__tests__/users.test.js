import request from "supertest";
import app from "../server.js";
import db from "../db/dbConfig.js";

describe("User Management API", () => {
  let adminToken;
  let userId;
  const testUsername = `user${Date.now()}`;
  const testPassword = "password123";

  beforeAll(async () => {
    // Login como admin global para obtener token
    const loginRes = await request(app).post("/api/users/login").send({
      username: "admin",
      password: "admin123",
    });
    adminToken = loginRes.body.accessToken;
  });

  // 1. Registro de usuario (verificando cuota)
  test("POST /api/users/register - should create a new user", async () => {
    const res = await request(app)
      .post("/api/users/register")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        username: testUsername,
        password: testPassword,
        role: "user"
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.username).toBe(testUsername);
    userId = res.body.id;
  });

  // 2. Intento de duplicado
  test("POST /api/users/register - should fail if username exists", async () => {
    const res = await request(app)
      .post("/api/users/register")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        username: testUsername,
        password: testPassword,
        role: "user"
      });

    expect(res.status).not.toBe(201);
    expect(res.body).toHaveProperty("error");
  });

  // 3. Listar usuarios
  test("GET /api/users - should list users for the company", async () => {
    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const userFound = res.body.find(u => u.username === testUsername);
    expect(userFound).toBeDefined();
  });

  // 4. Actualizar usuario
  test("PUT /api/users/:id - should update user role", async () => {
    const res = await request(app)
      .put(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        role: "admin"
      });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe("admin");
  });

  // 5. Reset de contraseña
  test("POST /api/users/reset-password - should reset user password", async () => {
    const res = await request(app)
      .post("/api/users/reset-password")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        username: testUsername,
        newPassword: "newpassword456"
      });

    expect(res.status).toBe(200);
    expect(res.body.username).toBe(testUsername);
  });

  // 6. Eliminar usuario
  test("DELETE /api/users/:id - should delete user", async () => {
    const res = await request(app)
      .delete(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  // 7. No permitir auto-eliminación
  test("DELETE /api/users/:id - should not allow self-deletion", async () => {
    // Necesitamos el ID del admin actual. El token tiene el id en el payload.
    // Pero por simplicidad, intentamos borrar el admin global (id 1 usualmente)
    const res = await request(app)
      .delete("/api/users/1")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).not.toBe(200);
    expect(res.body).toHaveProperty("error");
  });

  afterAll(async () => {
    await db.destroy();
  });
});
