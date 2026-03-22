import { create } from "zustand";
import { loginUser, logoutUser, getCurrentUser } from "../api/httpApi";

// 1. Define el store de Zustand
export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // Para saber si estamos verificando la sesión inicial

  // La acción de login ahora solo necesita credenciales
  login: async (username, password) => {
    const userData = await loginUser(username, password);
    set({ user: userData, isAuthenticated: true });
  },

  // La acción de logout limpia el estado y llama a la API para borrar cookies
  logout: async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout failed:", error); // Aún así deslogueamos del frontend
    }
    set({ user: null, isAuthenticated: false });
  },

  // Acción para verificar si hay una sesión activa (usando las cookies)
  checkAuth: async () => {
    try {
      const userData = await getCurrentUser();
      set({ user: userData, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

// 2. Para mantener compatibilidad, exportamos un hook `useAuth`
export const useAuth = useAuthStore;

// (Opcional pero recomendado) Componente que llama a checkAuth al inicio
import { useEffect } from "react";

export function AuthInitializer({ children }) {
  const { checkAuth, isLoading } = useAuth();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Podríamos mostrar un spinner de carga aquí mientras isLoading es true
  return isLoading ? null : children;
}
