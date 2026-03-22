import request from "supertest";
import app from "../server.js";
import db from "../db/dbConfig.js";

describe("Clients Endpoints", () => {
  let token;

  beforeAll(async () => {
    // Autenticar para obtener token
    const loginRes = await request(app)
      .post("/api/users/login")
      .send({
        username: "admin",
        password: "admin123"
      });
    token = loginRes.body.accessToken;
  });

  test("GET /api/clients - Should return a list (empty or populated)", async () => {
    const res = await request(app)
      .get("/api/clients")
      .set("Authorization", `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("POST /api/clients - Should create a new client", async () => {
    const newClient = {
      idNumber: `123-${Date.now()}`,
      name: "Test Client",
      email: "test@example.com",
      phone: "123456789"
    };

    const res = await request(app)
      .post("/api/clients")
      .set("Authorization", `Bearer ${token}`)
      .send(newClient);
    
    // El controller parece devolver el objeto creado o 201
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("idNumber", newClient.idNumber);
    expect(res.body.name).toBe(newClient.name);
  });

  test("GET /api/clients/:id - Should return client details", async () => {
    const idNumber = `987-${Date.now()}`;
    // Primero crear uno
    await request(app)
      .post("/api/clients")
      .set("Authorization", `Bearer ${token}`)
      .send({ idNumber, name: "Get Detail Test", phone: "987654321" });
    
    const res = await request(app)
      .get(`/api/clients/${idNumber}`)
      .set("Authorization", `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(res.body.idNumber).toBe(idNumber);
  });
});

afterAll(async () => {
  await db.destroy();
});
