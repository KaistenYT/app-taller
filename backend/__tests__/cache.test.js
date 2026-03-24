import { jest } from "@jest/globals";
import { cache } from "../utils/cache.js";
import redis from "../utils/cache.js";

// Mock de ioredis usando el patrón compatible con ESM
// Nota: ioredis-mock a veces tiene problemas con ESM, así que usaremos un mock simple si falla
describe("Cache Utility", () => {
  beforeEach(async () => {
    // Si redis está conectado, limpiamos. Si no, el test fallará graciosamente o usaremos el mock.
    if (redis && typeof redis.flushall === 'function') {
      await redis.flushall();
    }
  });

  test("Debe guardar y recuperar un objeto", async () => {
    const data = { id: 1, name: "Test" };
    await cache.set("test-key", data);
    
    const retrieved = await cache.get("test-key");
    expect(retrieved).toEqual(data);
  });

  test("Debe retornar null si la llave no existe", async () => {
    const retrieved = await cache.get("non-existent");
    expect(retrieved).toBeNull();
  });

  test("Debe eliminar una llave", async () => {
    await cache.set("to-delete", "value");
    await cache.del("to-delete");
    
    const retrieved = await cache.get("to-delete");
    expect(retrieved).toBeNull();
  });

  test("Debe eliminar por prefijo", async () => {
    // Para este test necesitamos que redis funcione
    await cache.set("user:1", "data1");
    await cache.set("user:2", "data2");
    await cache.set("other:1", "data3");

    await cache.delPrefix("user:");

    expect(await cache.get("user:1")).toBeNull();
    expect(await cache.get("user:2")).toBeNull();
    const other = await cache.get("other:1");
    expect(other).toBe("data3");
  });
});
