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
  const login = useCallback((userData, rememberMe = false) => {
    const currentUser = {
      id: userData.id,
      username: userData.username,
      role: userData.role || "user",
    };
    setUser(currentUser);
    const sessionObj = { ...userData };
    if (rememberMe) {
      sessionObj.expires = Date.now() + 30 * 24 * 60 * 60 * 1000;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionObj));
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch (_) {}
    } else {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sessionObj));
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (_) {}
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_) {}
    try {
      sessionStorage.removeItem(STORAGE_KEY);
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
