import request from "supertest";
import app from "../server.js";

describe("Health Check Endpoints", () => {
  test("GET / should return API online status", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "API online", version: "1.0.0" });
  });

  test("GET /api/health should return ok status", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});
