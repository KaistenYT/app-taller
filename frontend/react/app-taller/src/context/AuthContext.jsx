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
    localStorage.setItem("apptaller_auth_hint", "true");
    set({ user: userData, isAuthenticated: true });
  },

  // La acción de logout limpia el estado y llama a la API para borrar cookies
  logout: async () => {
    // Si ya no estamos autenticados localmente, solo limpiamos y salimos
    if (!useAuthStore.getState().isAuthenticated) {
      localStorage.setItem("apptaller_auth_hint", "false");
      set({ user: null, isAuthenticated: false });
      return;
    }

    try {
      await logoutUser();
    } catch (error) {
      // Ya no logueamos nada en consola para mantenerla limpia
    } finally {
      localStorage.setItem("apptaller_auth_hint", "false");
      set({ user: null, isAuthenticated: false });
    }
  },

  // Acción para verificar si hay una sesión activa (usando las cookies)
  checkAuth: async () => {
    // Si no hay rastro de una sesión previa ("hint"), evitamos el hit 401
    const authHint = localStorage.getItem("apptaller_auth_hint");
    if (authHint !== "true") {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const userData = await getCurrentUser();
      set({ user: userData, isAuthenticated: true, isLoading: false });
    } catch (error) {
      localStorage.setItem("apptaller_auth_hint", "false");
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

// 2. Para mantener compatibilidad, exportamos un hook `useAuth`
export const useAuth = useAuthStore;

// (Opcional pero recomendado) Componente que llama a checkAuth al inicio
import { useEffect, useRef } from "react";

export function AuthInitializer({ children }) {
  const { checkAuth, isLoading } = useAuth();
  const hasChecked = useRef(false);

  useEffect(() => {
    if (!hasChecked.current) {
      hasChecked.current = true;
      checkAuth();
    }
  }, [checkAuth]);

  // Si isLoading es true, podemos mostrar un micro-spinner o nada (null)
  return isLoading ? null : children;
}
