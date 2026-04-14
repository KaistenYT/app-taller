import { Server } from "socket.io";
import logger from "./utils/logger.js";

let io;

export const initSocket = (httpServer, corsOrigin) => {
  const allowedOrigins = corsOrigin.split(",").map(o => o.trim());
  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  logger.info("[socket] Socket.io inicializado (Single Tenant).");

  io.on("connection", (socket) => {
    logger.info(`[socket] Nuevo cliente conectado: ${socket.id}`);

    socket.on("disconnect", () => {
      logger.info(`[socket] Cliente desconectado: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io no ha sido inicializado.");
  }
  return io;
};

// Emitir a todos los clientes conectados (single tenant - sin rooms por empresa)
export const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

// Mantener compatibilidad con código antiguo
export const emitToCompany = (_companyId, event, data) => {
  emitToAll(event, data);
};
