import request from "supertest";
import app from "../server.js";
import db from "../db/dbConfig.js";

describe("Budgets API", () => {
  let token;
  const testClientId = `TB-${Date.now()}`;
  const testDevice = `TD-${Date.now()}`;
  let receptionId;
  let budgetId;

  // login y preparación de datos iniciales
  beforeAll(async () => {
    const loginRes = await request(app).post("/api/users/login").send({
      username: "admin",
      password: "admin123",
    });
    token = loginRes.body.accessToken;

    // crear cliente para las pruebas de presupuestos
    await request(app)
      .post("/api/clients")
      .set("Authorization", `Bearer ${token}`)
      .send({
        idNumber: testClientId,
        name: "Test Client",
        phone: "123456789",
      });

    // crear equipo para las pruebas de presupuestos
    // El schema requiere company_id en el body del POST de devices
    await request(app)
      .post("/api/devices")
      .set("Authorization", `Bearer ${token}`)
      .send({
        serial_number: testDevice,
        description: "Test Device",
        features: "Test Features",
        company_id: 1,
      });

    // crear recepción (necesaria para el presupuesto)
    // El schema espera `device` como objeto con serial_number, NO device_id con string.
    // device_snapshot es opcional y se genera automáticamente en el servicio.
    const receptionRes = await request(app)
      .post("/api/receptions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        client_idNumber: testClientId,
        client_name: "Test Client",
        client_phone: "123456789",
        device: {
          serial_number: testDevice,
          description: "Test Device",
          features: "Test Features",
        },
        defect: "Test Defect",
        status: "PENDIENTE",
      });

    if (receptionRes.status !== 201) {
      console.error("Error al crear recepción en beforeAll:", receptionRes.body);
    }

    // Guardamos el ID de la recepción creada
    receptionId = receptionRes.body?.id;
  });

  // Limpieza de datos (opcional pero recomendado)
  afterAll(async () => {
    if (budgetId) {
      await db("budget_log").where({ budget_id: budgetId }).del();
      await db("budget").where({ id: budgetId }).del();
    }
    if (receptionId) {
      await db("reception_history").where({ reception_id: receptionId }).del();
      await db("reception").where({ id: receptionId }).del();
    }
    await db("device").where({ serial_number: testDevice }).del();
    await db("client").where({ idNumber: testClientId }).del();
  });

  test("POST /api/budgets - should create a budget", async () => {
    const res = await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${token}`)
      .send({
        reception_id: receptionId,
        items: [{ detail: "Repuesto 1", price: 100 }],
        notes: "Test Notes",
        status: "BORRADOR",
        reason: "Initial Creation",
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.reception_id).toBe(receptionId);
    
    // Guardar el ID del presupuesto creado para los siguientes tests
    budgetId = res.body.id;
  });

  test("GET /api/budgets - should return all budgets", async () => {
    const res = await request(app)
      .get("/api/budgets")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test("GET /api/budgets/:id - should return budget details", async () => {
    const res = await request(app)
      .get(`/api/budgets/${budgetId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(budgetId);
  });

  test("GET /api/budgets/reception/:receptionId - should return budget by reception", async () => {
    const res = await request(app)
      .get(`/api/budgets/reception/${receptionId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.reception_id).toBe(receptionId);
  });

  test("PUT /api/budgets/:id - should update budget", async () => {
    const res = await request(app)
      .put(`/api/budgets/${budgetId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        items: [{ detail: "Repuesto 1", price: 150 }],
        notes: "Updated Notes",
        status: "APROBADO",
        reason: "Client Approved",
      });
    expect(res.status).toBe(200);
    expect(res.body.notes).toBe("Updated Notes");
    expect(res.body.status).toBe("APROBADO");
  });

  test("GET /api/budgets/:id/log - should return budget logs", async () => {
    const res = await request(app)
      .get(`/api/budgets/${budgetId}/log`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test("GET /api/budgets/logs/all - should return all logs", async () => {
    const res = await request(app)
      .get(`/api/budgets/logs/all`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("DELETE /api/budgets/:id - should delete budget", async () => {
    const res = await request(app)
      .delete(`/api/budgets/${budgetId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ reason: "Duplicate Budget" });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

});
