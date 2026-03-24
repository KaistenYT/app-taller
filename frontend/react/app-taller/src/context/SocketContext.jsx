import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const user = useAuth(state => state.user);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (user && user.company_id) {
      // Usar el puerto 3001 que es el que usa el backend
      const apiUrl = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/api$/, "");
      
      const newSocket = io(apiUrl, {
        withCredentials: true,
      });

      newSocket.on("connect", () => {
        console.log("[socket] Conectado al servidor");
        newSocket.emit("joinCompany", user.company_id);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
        console.log("[socket] Desconectado");
      };
    }
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
