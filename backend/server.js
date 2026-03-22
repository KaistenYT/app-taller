import "dotenv/config";
import "express-async-errors";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import { config } from "./config/env.js";
import { apiRateLimiter } from "./middleware/rateLimiter.js";
import deviceRoutes from "./routes/deviceRoutes.js";
import clientRoutes from "./routes/clientRoutes.js";
import receptionRoutes from "./routes/receptionRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import historyRoutes from "./routes/historyRoutes.js";
import budgetRoutes from "./routes/budgetRoutes.js";
import companyRoutes from "./routes/companyRoutes.js";

import { errorHandler } from "./middleware/errorHandler.js";
import logger from "./utils/logger.js";

const app = express();
const PORT = config.port;

// ── Middlewares globales ─────────────────────────────────────────────────────
app.use(helmet());
app.use(apiRateLimiter);
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Evitar bloqueos de CSP de extensiones (Kaspersky, React DevTools, etc.)
app.use((_req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; connect-src 'self' http://localhost:* ws://localhost:* http://gc.kis.v2.scr.kaspersky-labs.com ws://gc.kis.v2.scr.kaspersky-labs.com;"
  );
  next();
});

// ── Rutas API ────────────────────────────────────────────────────────────────
app.use("/api/devices", deviceRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/receptions", receptionRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reception-history", historyRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/companies", companyRoutes);

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/", (_req, res) => res.json({ status: "API online", version: "1.0.0" }));
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.get("/favicon.ico", (_req, res) => res.status(204).end());

// ── Manejo global de errores (debe ir al final) ──────────────────────────────
app.use(errorHandler);

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    logger.info(`[server] Escuchando en http://localhost:${PORT}`);
  });
}

export default app;
