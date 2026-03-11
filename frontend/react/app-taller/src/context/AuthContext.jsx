import { createContext, useContext, useState, useCallback } from "react";

const STORAGE_KEY = "app_user";
const AuthContext = createContext(null);

// Intenta recuperar sesión de sessionStorage primero, luego localStorage.
// Si la sesión expiró (solo aplica con "Recordarme"), la descarta.
function getInitialUser() {
  let sessionRaw = null;
  try {
    sessionRaw = sessionStorage.getItem(STORAGE_KEY);
  } catch (_) {}
  if (!sessionRaw) {
    try {
      sessionRaw = localStorage.getItem(STORAGE_KEY);
    } catch (_) {}
  }
  if (sessionRaw) {
    try {
      const session = JSON.parse(sessionRaw);
      if (session && session.id) {
        if (
          session.expires &&
          Number(session.expires) &&
          Date.now() > Number(session.expires)
        ) {
          try {
            localStorage.removeItem(STORAGE_KEY);
          } catch (_) {}
          return null;
        }
        return {
          id: session.id,
          username: session.username,
          role: session.role || "user",
        };
      }
    } catch (_) {}
  }
  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getInitialUser);

  // "Recordarme" → localStorage con expiración de 30 días; sino → sessionStorage
  const login = useCallback((loginResponse, rememberMe = false) => {
    // loginResponse ahora trae { token, user: { id, username, role } }
    const { token, user: userData } = loginResponse;

    const currentUser = {
      id: userData.id,
      username: userData.username,
      role: userData.role || "user",
    };
    setUser(currentUser);
    
    // Guardar token en storage de la app para httpApi
    if (rememberMe) {
      localStorage.setItem("auth_token", token);
      sessionStorage.removeItem("auth_token");
      
      const sessionObj = { ...userData };
      sessionObj.expires = Date.now() + 30 * 24 * 60 * 60 * 1000;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionObj));
      sessionStorage.removeItem(STORAGE_KEY);
    } else {
      sessionStorage.setItem("auth_token", token);
      localStorage.removeItem("auth_token");
      
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("auth_token");
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem("auth_token");
    } catch (_) {}
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
