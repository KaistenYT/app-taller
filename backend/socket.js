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

  logger.info("[socket] Socket.io inicializado en modo memoria local (In-Memory).");

  io.on("connection", (socket) => {
    logger.info(`[socket] Nuevo cliente conectado: ${socket.id}`);

    socket.on("joinCompany", (companyId) => {
      if (companyId) {
        const roomName = `company_${companyId}`;
        socket.join(roomName);
        logger.info(`[socket] Cliente ${socket.id} unido a sala: ${roomName}`);
      }
    });

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

export const emitToCompany = (companyId, event, data) => {
  if (io) {
    io.to(`company_${companyId}`).emit(event, data);
  }
};
