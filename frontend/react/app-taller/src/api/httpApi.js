import axios from "axios";
import axiosRetry from "axios-retry";
import { useAuthStore } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // para enviar cookies
});

// Interceptor de respuesta para manejar errores de autenticación y refresco de token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si el error es 401 o 403 y no es un reintento del refresh token ni el login
    const isAuthError = error.response?.status === 401 || error.response?.status === 403;
    const isRefreshRequest = originalRequest.url.includes("/users/refresh");
    const isLoginRequest = originalRequest.url.includes("/users/login");
    const isLogoutRequest = originalRequest.url.includes("/users/logout");

    if (isAuthError && !isRefreshRequest && !isLoginRequest && !isLogoutRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await api.post("/users/refresh");
        return api(originalRequest);
      } catch (refreshError) {
        // En lugar de redirigir con un reload brusco (causa bucles en initialization), 
        // simplemente limpiamos el estado. Los componentes (AuthInitializer/ProtectedRoute) 
        // reaccionarán a isAuthenticated=false y enviarán al login vía React Router.
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    // Para otros errores, simplemente los propagamos
    return Promise.reject(error);
  },
);

// Aplicar reintentos automáticos para fallos de red
axiosRetry(api, {
  retries: 3,
  retryDelay: (retryCount) => {
    return retryCount * 1000; // 1s, 2s, 3s
  },
  retryCondition: (error) => {
    // Reintentar solo en errores de red o 5xx, no en 4xx (errores de cliente)
    return (
      (axios.isAxiosError(error) && !error.response) ||
      error.response.status >= 500
    );
  },
});

// Helper genérico para extraer data o lanzar error estandarizado
const request = async (promise) => {
  try {
    const response = await promise;
    return response.data;
  } catch (error) {
    // El backend devuelve { error: { code, message } } — extraemos el mensaje anidado
    const serverError = error.response?.data?.error;
    const message =
      (typeof serverError === "object" ? serverError?.message : serverError) ||
      error.message ||
      "Error de red";
    throw new Error(message);
  }
};

// --- Devices ---
export const listDevices = () => request(api.get("/devices"));
export const getDevice = (id) => request(api.get(`/devices/${id}`));
export const getDeviceBySerial = (serial) =>
  request(api.get(`/devices/serial/${serial}`));
export const createDevice = (data) => request(api.post("/devices", data));
export const upsertDeviceBySerial = (data) =>
  request(api.post("/devices/upsert", data));
export const updateDevice = (id, data) =>
  request(api.put(`/devices/${id}`, data));
export const deleteDevice = (id) => request(api.delete(`/devices/${id}`));

// --- Clients ---
export const listClients = () => request(api.get("/clients"));
export const getClient = (id) => request(api.get(`/clients/${id}`));
export const createClient = (data) => request(api.post("/clients", data));
export const updateClient = (id, data) =>
  request(api.put(`/clients/${id}`, data));
export const deleteClient = (id) => request(api.delete(`/clients/${id}`));

// --- Receptions ---
export const listReceptions = (filters) =>
  request(api.get("/receptions", { params: filters }));
export const getReceptionStats = () =>
  request(api.get("/receptions/stats"));
export const countReceptions = (filters) =>
  request(api.get("/receptions/count", { params: filters })).then(
    (r) => r.count,
  );
export const listArchivedReceptions = () =>
  request(api.get("/receptions/archived"));
export const getReception = (id) => request(api.get(`/receptions/${id}`));
export const getReceptionDetails = (id) =>
  request(api.get(`/receptions/${id}/details`));
export const receptionDetails = getReceptionDetails; // Alias por compatibilidad
// El backend de recepción espera recibir directamente el objeto reception, no destructuring de { data } (porque saca user_id del jwt)
export const createReception = (data) =>
  request(api.post("/receptions", data.data || data));
export const updateReception = ({ id, data }) =>
  request(api.put(`/receptions/${id}`, data));
export const deleteReception = ({ id, reason }) =>
  request(api.delete(`/receptions/${id}`, { data: { reason } }));
export const archiveReception = ({ id, reason }) =>
  request(api.post(`/receptions/${id}/archive`, { reason }));
export const restoreReception = ({ id }) =>
  request(api.post(`/receptions/${id}/restore`));

// --- Users (Auth) ---
export const loginUser = async (username, password) => {
  const { user } = await request(
    api.post("/users/login", { username, password }),
  );
  return user; // Ya no devolvemos el token, se maneja en cookie
};
export const logoutUser = () => request(api.post("/users/logout"));
export const registerUser = (userData) =>
  request(api.post("/users/register", userData));
export const resetUserPassword = ({ username, newPassword }) =>
  request(api.post("/users/reset-password", { username, newPassword }));
export const listUsers = () => request(api.get("/users"));
export const updateUser = ({ id, data }) =>
  request(api.put(`/users/${id}`, data));
export const deleteUser = ({ id }) => request(api.delete(`/users/${id}`));
export const getCurrentUser = () => request(api.get("/users/me"));

// --- Reports ---
export const listReports = () => request(api.get("/reports"));
export const getReport = (id) => request(api.get(`/reports/${id}`));
export const getReportByReception = (receptionId) =>
  request(api.get(`/reports/reception/${receptionId}`));
export const createReport = (data) => request(api.post("/reports", data));
export const createReportFromReception = (receptionId) =>
  request(api.post(`/reports/reception/${receptionId}`));
export const updateReport = (id, data) =>
  request(api.put(`/reports/${id}`, data));
export const deleteReport = (id) => request(api.delete(`/reports/${id}`));

// --- History ---
export const listReceptionHistory = (filters) =>
  request(api.get("/reception-history", { params: filters }));
export const countReceptionHistory = (filters) =>
  request(api.get("/reception-history/count", { params: filters })).then(
    (r) => r.count,
  );

// --- Budgets ---
export const listBudgets = () => request(api.get("/budgets"));
export const createBudget = (data) => request(api.post("/budgets", data));
export const getBudgetDetails = (id) => request(api.get(`/budgets/${id}`));
export const getBudgetByReception = (receptionId) =>
  request(api.get(`/budgets/reception/${receptionId}`));
export const updateBudget = ({ id, data }) =>
  request(api.put(`/budgets/${id}`, data));
export const deleteBudget = ({ id, reason }) =>
  request(api.delete(`/budgets/${id}`, { data: { reason } }));
export const getBudgetLog = (budgetId) =>
  request(api.get(`/budgets/${budgetId}/log`));
export const getAllBudgetLogs = () => request(api.get(`/budgets/logs/all`));

// --- Financial Budgets ---
export const getBudgetDashboard = (filters) =>
  request(api.get("/budgets/dashboard", { params: filters }));
export const listBudgetsFinancial = (filters) =>
  request(api.get("/budgets/financial", { params: filters }));
export const updateBudgetPayment = ({ id, data }) =>
  request(api.put(`/budgets/${id}/payment`, data));

// --- Ventanas / Compatibilidad (Opcional, ahora la app manejará rutas web) ---
const getBaseUrl = () => {
  const base = window.location.origin + window.location.pathname;
  return base.endsWith('/') ? base : base + '/';
};

export const openReport = (reportId) => {
  window.open(`${getBaseUrl()}#/report/${reportId}`, "_blank");
  return Promise.resolve({ ok: true });
};

export const openBudgetWindow = (budgetId) => {
  window.open(`${getBaseUrl()}#/budget/${budgetId}`, "_blank");
  return Promise.resolve({ ok: true });
};

// --- Companies ---
export const getMyCompany = () => request(api.get("/companies/me"));
export const updateMyCompany = (data) =>
  request(api.put("/companies/me", data));

// --- Setup ---
export const getSetupStatus = () => request(api.get("/setup/status"));
export const initializeSystem = (data) => request(api.post("/setup/initialize", data));
