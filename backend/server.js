import "dotenv/config";
import "express-async-errors";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";

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
import { createServer } from "http";
import { initSocket } from "./socket.js";

const app = express();
const httpServer = createServer(app);
const PORT = config.port;

// 1. CORS DEBE IR PRIMERO PARA EVITAR BLOQUEOS EN PREFLIGHT
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(cookieParser());

// 2. SEGURIDAD (HELMET)
app.use(helmet());

// Configuración de CSP para desarrollo
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: [
        "'self'",
        "http://localhost:*",
        "ws://localhost:*",
        "http://gc.kis.v2.scr.kaspersky-labs.com",
        "ws://gc.kis.v2.scr.kaspersky-labs.com",
      ],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  })
);

// 3. RATE LIMITING (Solo para API)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  limit: 500, // Aumentado para evitar bloqueos durante pruebas intensas
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Demasiadas peticiones, intente de nuevo más tarde." },
  skipSuccessfulRequests: false,
});
app.use("/api/", limiter);

// 4. PARSERS
app.use(express.json());

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
  initSocket(httpServer, config.corsOrigin);
  httpServer.listen(PORT, () => {
    logger.info(`[server] Escuchando en http://localhost:${PORT} (Express + Socket.io)`);
  });
}

export { app, httpServer };
export default app;
