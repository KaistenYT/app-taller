import request from "supertest";
import app from "../server.js";
import db from "../db/dbConfig.js";

describe("Company & Onboarding API", () => {
  const testCompanyName = `TC-${Date.now()}`;
  const testAdminUsername = `admin_${Date.now()}`;
  const testAdminPassword = "testpassword123";
  let token;
  let companyId;

  // 1. Registro de empresa (Onboarding público)
  test("POST /api/companies/register - should register a new company and admin", async () => {
    const res = await request(app)
      .post("/api/companies/register")
      .send({
        company: {
          name: testCompanyName,
          rif: "J-12345678-0",
          phone: "0212-5555555",
          address: "Test Address",
          email: "test@company.com"
        },
        admin: {
          username: testAdminUsername,
          password: testAdminPassword
        },
        planId: 1 // Emprendedor
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("company");
    expect(res.body).toHaveProperty("admin");
    expect(res.body.company.name).toBe(testCompanyName);
    expect(res.body.admin.username).toBe(testAdminUsername);
    
    companyId = res.body.company.id;
  });

  test("POST /api/companies/register - should fail with missing data", async () => {
    const res = await request(app)
      .post("/api/companies/register")
      .send({
        company: { name: "Missing Admin" },
        planId: 1
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  // 2. Login con el nuevo administrador
  test("POST /api/users/login - should login with the newly created admin", async () => {
    const res = await request(app)
      .post("/api/users/login")
      .send({
        username: testAdminUsername,
        password: testAdminPassword
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    token = res.body.accessToken;
  });

  // 3. Obtener datos de mi empresa
  test("GET /api/companies/me - should return own company details", async () => {
    const res = await request(app)
      .get("/api/companies/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(companyId);
    expect(res.body.name).toBe(testCompanyName);
  });

  // 4. Actualizar datos de mi empresa
  test("PUT /api/companies/me - should update company details", async () => {
    const newName = `${testCompanyName} Updated`;
    const res = await request(app)
      .put("/api/companies/me")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: newName,
        phone: "0212-9999999"
      });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe(newName);
    expect(res.body.phone).toBe("0212-9999999");
  });

  // 5. Verificar restricciones (sin token)
  test("GET /api/companies/me - should fail without token", async () => {
    const res = await request(app).get("/api/companies/me");
    expect(res.status).toBe(401);
  });

  afterAll(async () => {
    if (companyId) {
      // Limpieza profunda (Cascade delete no siempre es suficiente en tests unitarios si no está configurado en DB)
      // En este caso, el servidor usa knex con migraciones que tienen onDelete("CASCADE")
      await db("subscription").where({ company_id: companyId }).del();
      await db("user").where({ company_id: companyId }).del();
      await db("company").where({ id: companyId }).del();
    }
    await db.destroy();
  });
});
