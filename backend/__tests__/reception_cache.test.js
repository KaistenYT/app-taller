import { jest } from "@jest/globals";
import db from "../db/dbConfig.js";
import { ReceptionService } from "../service/receptionService.js";
import { cache } from "../utils/cache.js";

describe("ReceptionService Cache Integration", () => {
  const testCompanyId = 999;

  beforeAll(async () => {
    // Asegurar que no hay basura del conteo en la caché para este test
    await cache.delPrefix(`receptions:count:${testCompanyId}`);
  });

  afterAll(async () => {
    await db.destroy();
  });

  test("Debe cachear el conteo de recepciones y devolver el valor de la caché", async () => {
    // 1. Primer llamado: debe ir a la DB y cachear
    const count1 = await ReceptionService.countReceptions({ company_id: testCompanyId });
    
    // 2. Modificamos el valor en caché manualmente para verificar que el segundo llamado venga de ahí
    const fakeCount = 9999;
    // Generar la misma llave que genera el servicio
    const filters = { company_id: testCompanyId };
    const cacheKey = `receptions:count:${testCompanyId}:${JSON.stringify(filters)}`;
    await cache.set(cacheKey, fakeCount);

    // 3. Segundo llamado: debe venir de la caché
    const count2 = await ReceptionService.countReceptions(filters);
    expect(count2).toBe(fakeCount);
  });

  test("Debe invalidar la caché al llamar a _invalidateCache", async () => {
    const filters = { company_id: testCompanyId };
    const cacheKey = `receptions:count:${testCompanyId}:${JSON.stringify(filters)}`;

    // 1. Llenamos la caché (simulando que se llenó por una consulta previa)
    await cache.set(cacheKey, 10);

    // 2. Llamamos a invalidar
    await ReceptionService._invalidateCache(testCompanyId);
    
    // 3. Verificamos que ya no esté
    const retrieved = await cache.get(cacheKey);
    expect(retrieved).toBeNull();
  });
});
