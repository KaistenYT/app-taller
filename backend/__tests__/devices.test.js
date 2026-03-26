import request from "supertest";
import app from "../server.js";
import db from "../db/dbConfig.js";

describe("Devices API", () => {
  let token;
  const testSerial = `SD-${Date.now()}`;

  beforeAll(async () => {
    const loginRes = await request(app).post("/api/users/login").send({
      username: "admin",
      password: "admin123",
    });
    token = loginRes.body.accessToken;
  });

  // 1. Crear dispositivo
  test("POST /api/devices - should create a device", async () => {
    const res = await request(app)
      .post("/api/devices")
      .set("Authorization", `Bearer ${token}`)
      .send({
        serial_number: testSerial,
        description: "Test Smartphone",
        features: "128GB, Blue"
      });

    expect(res.status).toBe(201);
    expect(res.body.serial_number).toBe(testSerial);
  });

  // 2. Obtener por serial
  test("GET /api/devices/serial/:serial - should get device by serial", async () => {
    const res = await request(app)
      .get(`/api/devices/serial/${testSerial}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.serial_number).toBe(testSerial);
  });

  // 3. Upsert (update si existe)
  test("POST /api/devices/upsert - should update existing device by serial", async () => {
    const res = await request(app)
      .post("/api/devices/upsert")
      .set("Authorization", `Bearer ${token}`)
      .send({
        serial_number: testSerial,
        description: "Updated Description",
        features: "Updated Features"
      });

    expect(res.status).toBe(200);
    expect(res.body.description).toBe("Updated Description");
  });

  // 4. Upsert (create si no existe)
  test("POST /api/devices/upsert - should create new device if serial not found", async () => {
    const newSerial = `SNW-${Date.now()}`;
    const res = await request(app)
      .post("/api/devices/upsert")
      .set("Authorization", `Bearer ${token}`)
      .send({
        serial_number: newSerial,
        description: "New Device via Upsert"
      });

    expect(res.status).toBe(200); // El controlador devuelve el objeto, status 200 usualmente para upsert exitoso
    expect(res.body.serial_number).toBe(newSerial);
  });

  afterAll(async () => {
    await db.destroy();
  });
});
