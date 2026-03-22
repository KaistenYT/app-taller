import request from "supertest";
import app from "../server.js";
import db from "../db/dbConfig.js";

describe("Auth Endpoints", () => {
  // Opcional: Limpiar o preparar la base de datos antes de los tests
  // Dado que dbConfig ya corre migraciones y seeds al importar, 
  // confiamos en que el usuario 'admin' existe (según dbConfig.js).

  test("POST /api/users/login - Success with admin credentials", async () => {
    const res = await request(app)
      .post("/api/users/login")
      .send({
        username: "admin",
        password: "admin123"
      });
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body.user).toHaveProperty("username", "admin");
  });

  test("POST /api/users/login - Failure with wrong credentials", async () => {
    const res = await request(app)
      .post("/api/users/login")
      .send({
        username: "admin",
        password: "wrongpassword"
      });
    
    // Asumiendo que UserService lanza un error capturado por errorHandler
    // que devuelve un status de error (usualmente 400 o 401)
    expect(res.status).not.toBe(200);
  });

  test("GET /api/users/me - Failure without token", async () => {
    const res = await request(app).get("/api/users/me");
    expect(res.status).toBe(401);
  });

  test("GET /api/users/me - Success with valid token", async () => {
    // Primero login
    const loginRes = await request(app)
      .post("/api/users/login")
      .send({
        username: "admin",
        password: "admin123"
      });
    
    const token = loginRes.body.accessToken;

    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("username", "admin");
  });
});

afterAll(async () => {
  await db.destroy(); // Cerrar conexión a la DB al finalizar
});
