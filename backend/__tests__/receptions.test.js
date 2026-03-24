import request from "supertest";
import app from "../server.js";
import db from "../db/dbConfig.js";

describe("Receptions Endpoints", () => {
  let token;
  const testClientId = `TEST-REC-${Date.now()}`;

  beforeAll(async () => {
    // Login
    const loginRes = await request(app)
      .post("/api/users/login")
      .send({ username: "admin", password: "admin123" });
    token = loginRes.body.accessToken;

    // Crear cliente necesario para la recepción
    await request(app)
      .post("/api/clients")
      .set("Authorization", `Bearer ${token}`)
      .send({
        idNumber: testClientId,
        name: "Reception Test Client",
        phone: "555-5555"
      });
  });

  test("GET /api/receptions - Should return list", async () => {
    const res = await request(app)
      .get("/api/receptions")
      .set("Authorization", `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("POST /api/receptions - Should create reception with new device", async () => {
    const newReception = {
      client_idNumber: testClientId,
      defect: "Pantalla rota",
      device: {
        serial_number: `SN-1-${Date.now()}`,
        description: "Smartphone Samsung S21",
        features: "Color Negro, 128GB"
      }
    };

    const res = await request(app)
      .post("/api/receptions")
      .set("Authorization", `Bearer ${token}`)
      .send(newReception);
    
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.defect).toBe(newReception.defect);
    expect(res.body.status).toBe("PENDIENTE");
  });

  test("GET /api/receptions/:id - Should return reception details", async () => {
    // Crear una recepción primero
    const createRes = await request(app)
      .post("/api/receptions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        client_idNumber: testClientId,
        defect: "No enciende",
        device: { serial_number: `SN-2-${Date.now()}`, description: "Laptop Dell" }
      });
    
    const receptionId = createRes.body.id;

    const res = await request(app)
      .get(`/api/receptions/${receptionId}`)
      .set("Authorization", `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(receptionId);
    expect(res.body.client_idNumber).toBe(testClientId);
  });

  test("POST /api/receptions/:id/archive - Should archive reception", async () => {
    // Primero crear una
    const createRes = await request(app)
      .post("/api/receptions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        client_idNumber: testClientId,
        defect: "Archive Test",
        device: { serial_number: `SN-ARCH-${Date.now()}`, description: "Tablet" }
      });
    const receptionId = createRes.body.id;

    const res = await request(app)
      .post(`/api/receptions/${receptionId}/archive`)
      .set("Authorization", `Bearer ${token}`)
      .send({ reason: "Testing archive" });
    
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    // Verificar que realmente se archivó
    const checkRes = await request(app)
      .get(`/api/receptions/${receptionId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(checkRes.body.archived).toBe(true);
  });

  test("POST /api/receptions/:id/restore - Should restore reception", async () => {
    // Crear y archivar una
    const createRes = await request(app)
      .post("/api/receptions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        client_idNumber: testClientId,
        defect: "Restore Test",
        device: { serial_number: `SN-REST-${Date.now()}`, description: "Smartwatch" }
      });
    const receptionId = createRes.body.id;
    await request(app).post(`/api/receptions/${receptionId}/archive`).set("Authorization", `Bearer ${token}`);

    const res = await request(app)
      .post(`/api/receptions/${receptionId}/restore`)
      .set("Authorization", `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    // Verificar que realmente se restauró
    const checkRes = await request(app)
      .get(`/api/receptions/${receptionId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(checkRes.body.archived).toBe(false);
  });

  test("DELETE /api/receptions/:id - Should delete reception (Admin)", async () => {
    const createRes = await request(app)
      .post("/api/receptions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        client_idNumber: testClientId,
        defect: "Delete Test",
        device: { serial_number: `SN-DEL-${Date.now()}`, description: "Console" }
      });
    const receptionId = createRes.body.id;

    const res = await request(app)
      .delete(`/api/receptions/${receptionId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ reason: "Testing delete" });
    
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

afterAll(async () => {
  await db.destroy();
});
