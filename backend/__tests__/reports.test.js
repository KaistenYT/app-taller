import request from "supertest";
import app from "../server.js";
import db from "../db/dbConfig.js";

describe("Reports API", () => {
  let token;
  let receptionId;
  let reportId;
  const testClientId = `CLI-REP-${Date.now()}`;

  beforeAll(async () => {
    // Login
    const loginRes = await request(app).post("/api/users/login").send({
      username: "admin",
      password: "admin123",
    });
    token = loginRes.body.accessToken;

    // Crear cliente
    await request(app)
      .post("/api/clients")
      .set("Authorization", `Bearer ${token}`)
      .send({ idNumber: testClientId, name: "Report Test Client", phone: "555-0000" });

    // Crear recepción
    const recRes = await request(app)
      .post("/api/receptions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        client_idNumber: testClientId,
        defect: "Broken Screen",
        device: { serial_number: `SN-REP-${Date.now()}`, description: "iPhone 13" }
      });
    receptionId = recRes.body.id;
  });

  // 1. Crear reporte manual
  test("POST /api/reports - should create a report", async () => {
    const res = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${token}`)
      .send({
        reception_id: receptionId,
        description: "Initial diagnostic: Screen needs replacement."
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    reportId = res.body.id;
  });

  // 2. Crear reporte desde recepción (auto-generado o plantilla)
  test("POST /api/reports/reception/:receptionId - should create report from reception", async () => {
    // Crear otra recepción
    const recRes = await request(app)
      .post("/api/receptions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        client_idNumber: testClientId,
        defect: "Battery issue",
        device: { serial_number: `SN-REP-2-${Date.now()}`, description: "iPhone 12" }
      });
    
    const res = await request(app)
      .post(`/api/reports/reception/${recRes.body.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(201);
    expect(res.body.reception_id).toBe(recRes.body.id);
  });

  // 3. Listar reportes
  test("GET /api/reports - should list reports", async () => {
    const res = await request(app)
      .get("/api/reports")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // 4. Obtener reporte por ID
  test("GET /api/reports/:id - should get report details", async () => {
    const res = await request(app)
      .get(`/api/reports/${reportId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(reportId);
  });

  // 5. Actualizar reporte
  test("PUT /api/reports/:id - should update report description", async () => {
    const res = await request(app)
      .put(`/api/reports/${reportId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        description: "Updated diagnostic: Screen and battery need replacement."
      });

    expect(res.status).toBe(200);
    expect(res.body.description).toContain("battery");
  });

  // 6. Eliminar reporte
  test("DELETE /api/reports/:id - should delete report", async () => {
    const res = await request(app)
      .delete(`/api/reports/${reportId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  afterAll(async () => {
    await db.destroy();
  });
});
