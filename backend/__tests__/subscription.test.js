import request from "supertest";
import db from "../db/dbConfig.js";
import app from "../server.js";
import { SubscriptionService } from "../service/subscriptionService.js";

// ─────────────────────────────────────────────────────────────────────────────
// Planes definidos en las migraciones (valores reales de la DB de prueba)
//
//  id:1  Emprendedor  → max_receptions: 20, max_budgets: 10, max_users: 1
//  id:2  Profesional  → max_receptions: -1, max_budgets: -1, max_users: 5
//  id:3  Empresarial  → max_receptions: -1, max_budgets: -1, max_users: -1
// ─────────────────────────────────────────────────────────────────────────────

describe("Subscription Service", () => {
  let token;

  // ── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Crea una empresa de prueba y la suscribe al plan indicado.
   * Retorna el company_id generado.
   */
  async function createTestCompanyWithPlan(planId) {
    const [row] = await db("company")
      .insert({ name: `TC-${Date.now()}`, status: "ACTIVE" })
      .returning("id");
    const companyId = row?.id ?? row;

    await db("subscription").insert({
      company_id: companyId,
      plan_id: planId,
      start_date: new Date(),
      status: "ACTIVE",
    });

    return companyId;
  }

  /**
   * Inserta un cliente de prueba directamente en la DB.
   * Retorna su idNumber.
   */
  async function createTestClient(companyId) {
    const idNumber = `C-${companyId}-${Date.now()}`;
    await db("client").insert({
      idNumber,
      name: "Cliente Test",
      phone: "0000-0000",
      company_id: companyId,
    });
    return idNumber;
  }

  /**
   * Inserta `count` recepciones (+ dispositivo por cada una) directamente
   * en la DB para la empresa indicada, usando un for para generarlas.
   * Retorna el array de reception ids creados.
   */
  async function fillReceptions(companyId, clientIdNumber, count) {
    const receptionIds = [];

    for (let i = 0; i < count; i++) {
      // Cada recepción necesita su propio dispositivo (FK device_id)
      const [devRow] = await db("device")
        .insert({
          serial_number: `S-${companyId}-${i}-${Date.now()}`,
          description: `Dispositivo test #${i + 1}`,
          features: "N/A",
          company_id: companyId,
        })
        .returning("id");
      const deviceId = devRow?.id ?? devRow;

      const [recRow] = await db("reception")
        .insert({
          client_idNumber: clientIdNumber,
          device_id: deviceId,
          defect: `Defecto de prueba #${i + 1}`,
          status: "PENDIENTE",
          archived: false,
          company_id: companyId,
        })
        .returning("id");

      receptionIds.push(recRow?.id ?? recRow);
    }

    return receptionIds;
  }

  /**
   * Inserta `count` presupuestos para la empresa indicada.
   * Cada presupuesto necesita un reception_id válido (FK NOT NULL),
   * así que primero crea una recepción de soporte.
   * Usa un for para generarlos automáticamente.
   */
  async function fillBudgets(companyId, clientIdNumber, count) {
    const budgetIds = [];

    for (let i = 0; i < count; i++) {
      // Dispositivo de soporte para la recepción
      const [devRow] = await db("device")
        .insert({
          serial_number: `SB-${companyId}-${i}-${Date.now()}`,
          description: `Dispositivo budget #${i + 1}`,
          company_id: companyId,
        })
        .returning("id");
      const deviceId = devRow?.id ?? devRow;

      // Recepción de soporte (requerida por la FK de budget)
      const [recRow] = await db("reception")
        .insert({
          client_idNumber: clientIdNumber,
          device_id: deviceId,
          defect: `Defecto budget #${i + 1}`,
          status: "PENDIENTE",
          archived: false,
          company_id: companyId,
        })
        .returning("id");
      const receptionId = recRow?.id ?? recRow;

      // El presupuesto propiamente dicho
      const [budRow] = await db("budget")
        .insert({
          reception_id: receptionId,
          company_id: companyId,
          status: "BORRADOR",
          items: JSON.stringify([]),
        })
        .returning("id");

      budgetIds.push(budRow?.id ?? budRow);
    }

    return budgetIds;
  }

  /**
   * Elimina en orden inverso de FK todos los registros de una empresa de prueba.
   */
  async function cleanupCompany(companyId) {
    if (!companyId) return;
    await db("budget_log")
      .whereIn("budget_id", db("budget").where({ company_id: companyId }).select("id"))
      .delete();
    await db("budget").where({ company_id: companyId }).delete();
    await db("reception_history").where({ company_id: companyId }).delete();
    await db("reception").where({ company_id: companyId }).delete();
    await db("device").where({ company_id: companyId }).delete();
    await db("client").where({ company_id: companyId }).delete();
    await db("user").where({ company_id: companyId }).delete();
    await db("subscription").where({ company_id: companyId }).delete();
    await db("company").where({ id: companyId }).delete();
  }

  // ── Setup global ──────────────────────────────────────────────────────────
  beforeAll(async () => {
    const loginRes = await request(app)
      .post("/api/users/login")
      .send({ username: "admin", password: "admin123" });

    token = loginRes.body.accessToken;
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. getSubscriptionDetails — Detalle de suscripción activa (capa de servicio)
  //    Nota: la ruta HTTP no está expuesta aún; se verifica el servicio directamente.
  // ═══════════════════════════════════════════════════════════════════════════
  describe("SubscriptionService.getSubscriptionDetails", () => {
    test("retorna el plan activo con sus límites para la empresa del admin (company_id=1)", async () => {
      const details = await SubscriptionService.getSubscriptionDetails(1);

      expect(details).not.toBeNull();
      expect(details).toHaveProperty("plan_name");
      expect(details).toHaveProperty("max_receptions");
      expect(details).toHaveProperty("max_budgets");
      expect(details).toHaveProperty("status", "ACTIVE");
    });

    test("retorna null para una empresa sin suscripción", async () => {
      // company_id 999999 no existe → no hay registro → debe devolver undefined/null
      const details = await SubscriptionService.getSubscriptionDetails(999999);
      expect(details).toBeFalsy();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. checkQuota — max_receptions — Plan Emprendedor (límite: 20)
  //
  //   Se usa un for para llenar automáticamente las recepciones cuota a cuota:
  //   · Con (MAX - 1) recepciones → checkQuota pasa (aún hay cupo)
  //   · Con (MAX)    recepciones → checkQuota lanza error de límite alcanzado
  // ═══════════════════════════════════════════════════════════════════════════
  describe("checkQuota para max_receptions — Plan Emprendedor (límite 20)", () => {
    const MAX_RECEPTIONS = 20;
    let testCompanyId;
    let clientId;

    beforeAll(async () => {
      testCompanyId = await createTestCompanyWithPlan(1); // Emprendedor
      clientId = await createTestClient(testCompanyId);
    });

    afterAll(async () => {
      await cleanupCompany(testCompanyId);
    });

    test(`permite crear hasta ${MAX_RECEPTIONS - 1} recepciones (cupo no agotado)`, async () => {
      // for loop → genera MAX-1 recepciones automáticamente
      await fillReceptions(testCompanyId, clientId, MAX_RECEPTIONS - 1);

      await expect(
        SubscriptionService.checkQuota(testCompanyId, "max_receptions")
      ).resolves.toBe(true);
    });

    test(`bloquea al intentar pasar la recepción #${MAX_RECEPTIONS + 1} (cupo lleno)`, async () => {
      // Agrega 1 más para alcanzar exactamente el límite
      await fillReceptions(testCompanyId, clientId, 1);

      await expect(
        SubscriptionService.checkQuota(testCompanyId, "max_receptions")
      ).rejects.toThrow(/Límite alcanzado/i);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. checkQuota — max_budgets — Plan Emprendedor (límite: 10)
  //
  //   Igual que el caso anterior pero para presupuestos.
  //   fillBudgets crea la recepción de soporte (FK) por cada presupuesto.
  // ═══════════════════════════════════════════════════════════════════════════
  describe("checkQuota para max_budgets — Plan Emprendedor (límite 10)", () => {
    const MAX_BUDGETS = 10;
    let testCompanyId;
    let clientId;

    beforeAll(async () => {
      testCompanyId = await createTestCompanyWithPlan(1); // Emprendedor
      clientId = await createTestClient(testCompanyId);
    });

    afterAll(async () => {
      await cleanupCompany(testCompanyId);
    });

    test(`permite hasta ${MAX_BUDGETS - 1} presupuestos (cupo no agotado)`, async () => {
      // for loop → genera MAX-1 presupuestos con sus recepciones de soporte
      await fillBudgets(testCompanyId, clientId, MAX_BUDGETS - 1);

      await expect(
        SubscriptionService.checkQuota(testCompanyId, "max_budgets")
      ).resolves.toBe(true);
    });

    test(`bloquea al llegar al presupuesto #${MAX_BUDGETS + 1} (cupo lleno)`, async () => {
      // Agrega 1 más → cuota completa
      await fillBudgets(testCompanyId, clientId, 1);

      await expect(
        SubscriptionService.checkQuota(testCompanyId, "max_budgets")
      ).rejects.toThrow(/Límite alcanzado/i);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. checkQuota — Plan Profesional (max_receptions: -1, ilimitado)
  //
  //   Genera LARGE_COUNT recepciones con un for; ninguna debe bloquear.
  // ═══════════════════════════════════════════════════════════════════════════
  describe("checkQuota con plan ilimitado — Profesional (max_receptions: -1)", () => {
    const LARGE_COUNT = 30; // Supera cualquier límite finito del sistema
    let testCompanyId;
    let clientId;

    beforeAll(async () => {
      testCompanyId = await createTestCompanyWithPlan(2); // Profesional
      clientId = await createTestClient(testCompanyId);
    });

    afterAll(async () => {
      await cleanupCompany(testCompanyId);
    });

    test(`permite ${LARGE_COUNT} recepciones sin bloquear (límite -1 = ilimitado)`, async () => {
      // for interno de fillReceptions genera LARGE_COUNT registros
      await fillReceptions(testCompanyId, clientId, LARGE_COUNT);

      await expect(
        SubscriptionService.checkQuota(testCompanyId, "max_receptions")
      ).resolves.toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. checkQuota — empresa sin suscripción activa
  // ═══════════════════════════════════════════════════════════════════════════
  describe("checkQuota sin suscripción activa", () => {
    let orphanCompanyId;

    beforeAll(async () => {
      const [row] = await db("company")
        .insert({ name: `OC-${Date.now()}`, status: "ACTIVE" })
        .returning("id");
      orphanCompanyId = row?.id ?? row;
      // Sin suscripción → checkQuota debe fallar
    });

    afterAll(async () => {
      await db("company").where({ id: orphanCompanyId }).delete();
    });

    test("lanza error indicando que no hay suscripción activa", async () => {
      await expect(
        SubscriptionService.checkQuota(orphanCompanyId, "max_receptions")
      ).rejects.toThrow(/suscripción activa/i);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. Middleware checkSubscriptionQuota — integración HTTP
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Middleware checkSubscriptionQuota (integración HTTP)", () => {
    test("POST /api/receptions retorna 201 cuando el plan tiene cupo (admin, plan ilimitado)", async () => {
      const idNumber = `CMW-${Date.now()}`;
      await request(app)
        .post("/api/clients")
        .set("Authorization", `Bearer ${token}`)
        .send({ idNumber, name: "MW Client", phone: "111-1111" });

      const res = await request(app)
        .post("/api/receptions")
        .set("Authorization", `Bearer ${token}`)
        .send({
          client_idNumber: idNumber,
          defect: "Test middleware cuota",
          device: {
            serial_number: `SMW-${Date.now()}`,
            description: "Dispositivo middleware test",
          },
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
    });

    test("POST /api/receptions retorna 401 sin token", async () => {
      const res = await request(app).post("/api/receptions").send({});
      expect(res.status).toBe(401);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. Comparación de planes — Profesional y Empresarial vs Emprendedor
  //
  //   Verifica directamente desde la DB que los planes de mayor nivel tienen
  //   límites distintos (ilimitados, -1) frente al plan Emprendedor (finitos).
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Comparación de límites entre planes", () => {
    let planes;

    beforeAll(async () => {
      // Carga los 3 planes de la DB ordenados por id
      planes = await db("plan").orderBy("id").select("*");
    });

    test("deben existir al menos 3 planes definidos en la DB", () => {
      expect(planes.length).toBeGreaterThanOrEqual(3);
    });

    test("Plan Emprendedor (id:1) tiene límites finitos en todos los recursos", () => {
      const emprendedor = planes.find((p) => p.id === 1);
      expect(emprendedor.max_receptions).toBeGreaterThan(0);
      expect(emprendedor.max_budgets).toBeGreaterThan(0);
      expect(emprendedor.max_users).toBeGreaterThan(0);
    });

    test("Plan Profesional (id:2) tiene max_receptions ilimitado (-1) a diferencia de Emprendedor", () => {
      const emprendedor = planes.find((p) => p.id === 1);
      const profesional = planes.find((p) => p.id === 2);

      expect(profesional.max_receptions).toBe(-1);
      expect(profesional.max_receptions).not.toBe(emprendedor.max_receptions);
    });

    test("Plan Profesional (id:2) tiene max_budgets ilimitado (-1) a diferencia de Emprendedor", () => {
      const emprendedor = planes.find((p) => p.id === 1);
      const profesional = planes.find((p) => p.id === 2);

      expect(profesional.max_budgets).toBe(-1);
      expect(profesional.max_budgets).not.toBe(emprendedor.max_budgets);
    });

    test("Plan Empresarial (id:3) tiene max_receptions ilimitado (-1) a diferencia de Emprendedor", () => {
      const emprendedor = planes.find((p) => p.id === 1);
      const empresarial = planes.find((p) => p.id === 3);

      expect(empresarial.max_receptions).toBe(-1);
      expect(empresarial.max_receptions).not.toBe(emprendedor.max_receptions);
    });

    test("Plan Empresarial (id:3) tiene max_users ilimitado (-1) a diferencia de Emprendedor", () => {
      const emprendedor = planes.find((p) => p.id === 1);
      const empresarial = planes.find((p) => p.id === 3);

      expect(empresarial.max_users).toBe(-1);
      expect(empresarial.max_users).not.toBe(emprendedor.max_users);
    });

    test("Profesional y Empresarial tienen los mismos límites de recepciones (ambos -1)", () => {
      const profesional = planes.find((p) => p.id === 2);
      const empresarial = planes.find((p) => p.id === 3);

      expect(profesional.max_receptions).toBe(empresarial.max_receptions);
      expect(profesional.max_budgets).toBe(empresarial.max_budgets);
    });
  });
});

afterAll(async () => {
  await db.destroy();
});
