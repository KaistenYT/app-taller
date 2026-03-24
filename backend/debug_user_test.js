import request from "supertest";
import app from "../server.js";

async function debug() {
  const loginRes = await request(app).post("/api/users/login").send({
    username: "admin",
    password: "admin123",
  });
  const token = loginRes.body.accessToken;

  const res = await request(app)
    .post("/api/users/register")
    .set("Authorization", `Bearer ${token}`)
    .send({
      username: `debug_${Date.now()}`,
      password: "password123",
      role: "user"
    });

  console.log("Status:", res.status);
  console.log("Body:", JSON.stringify(res.body, null, 2));
  process.exit(0);
}

debug();
