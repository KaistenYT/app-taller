import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_URL,
});

// Interceptor para inyectar token en cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper genérico para extraer data o lanzar error estandarizado
const request = async (promise) => {
  try {
    const response = await promise;
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || error.message || "Error de red");
  }
};

// --- Devices ---
export const listDevices = () => request(api.get("/devices"));
export const getDevice = (id) => request(api.get(`/devices/${id}`));
export const getDeviceBySerial = (serial) => request(api.get(`/devices/serial/${serial}`));
export const createDevice = (data) => request(api.post("/devices", data));
export const upsertDeviceBySerial = (data) => request(api.post("/devices/upsert", data));
export const updateDevice = (id, data) => request(api.put(`/devices/${id}`, data));
export const deleteDevice = (id) => request(api.delete(`/devices/${id}`));

// --- Clients ---
export const listClients = () => request(api.get("/clients"));
export const getClient = (id) => request(api.get(`/clients/${id}`));
export const createClient = (data) => request(api.post("/clients", data));
export const updateClient = (id, data) => request(api.put(`/clients/${id}`, data));
export const deleteClient = (id) => request(api.delete(`/clients/${id}`));

// --- Receptions ---
export const listReceptions = (filters) => request(api.get("/receptions", { params: filters }));
export const countReceptions = (filters) => request(api.get("/receptions/count", { params: filters })).then(r => r.count);
export const listArchivedReceptions = () => request(api.get("/receptions/archived"));
export const getReception = (id) => request(api.get(`/receptions/${id}`));
export const getReceptionDetails = (id) => request(api.get(`/receptions/${id}/details`));
export const receptionDetails = getReceptionDetails; // Alias por compatibilidad
// El backend de recepción espera recibir directamente el objeto reception, no destructuring de { data } (porque saca user_id del jwt)
export const createReception = (data) => request(api.post("/receptions", data.data || data)); 
export const updateReception = ({ id, data }) => request(api.put(`/receptions/${id}`, data));
export const deleteReception = ({ id }) => request(api.delete(`/receptions/${id}`));
export const archiveReception = ({ id }) => request(api.post(`/receptions/${id}/archive`));
export const restoreReception = ({ id }) => request(api.post(`/receptions/${id}/restore`));

// --- Users (Auth) ---
// Retorna { token, user }
export const loginUser = (username, password) => request(api.post("/users/login", { username, password }));
export const registerUser = (userData) => request(api.post("/users/register", userData));
export const resetUserPassword = ({ username, newPassword }) => request(api.post("/users/reset-password", { username, newPassword }));
export const listUsers = () => request(api.get("/users"));
export const updateUser = ({ id, data }) => request(api.put(`/users/${id}`, data));
export const deleteUser = ({ id }) => request(api.delete(`/users/${id}`));
export const getCurrentUser = () => request(api.get("/users/me"));

// --- Reports ---
export const listReports = () => request(api.get("/reports"));
export const getReport = (id) => request(api.get(`/reports/${id}`));
export const getReportByReception = (receptionId) => request(api.get(`/reports/reception/${receptionId}`));
export const createReport = (data) => request(api.post("/reports", data));
export const createReportFromReception = (receptionId) => request(api.post(`/reports/reception/${receptionId}`));
export const updateReport = (id, data) => request(api.put(`/reports/${id}`, data));
export const deleteReport = (id) => request(api.delete(`/reports/${id}`));

// --- History ---
export const listReceptionHistory = (filters) => request(api.get("/reception-history", { params: filters }));
export const countReceptionHistory = (filters) => request(api.get("/reception-history/count", { params: filters })).then(r => r.count);

// --- Budgets ---
export const listBudgets = () => request(api.get("/budgets"));
export const createBudget = ({ reception_id }) => request(api.post("/budgets", { reception_id }));
export const getBudgetDetails = (id) => request(api.get(`/budgets/${id}`));
export const getBudgetByReception = (receptionId) => request(api.get(`/budgets/reception/${receptionId}`));
export const updateBudget = ({ id, data }) => request(api.put(`/budgets/${id}`, data));
export const deleteBudget = ({ id }) => request(api.delete(`/budgets/${id}`));
export const getBudgetLog = (budgetId) => request(api.get(`/budgets/${budgetId}/log`));


// --- Ventanas / Compatibilidad (Opcional, ahora la app manejará rutas web) ---
export const openReport = (reportId) => {
  // En vez de ipcRenderer, abrimos una nueva pestaña (o el router lo manejará vía link)
  window.open(`/#/report/${reportId}`, "_blank");
  return Promise.resolve({ ok: true });
};

export const openBudgetWindow = (budgetId) => {
  window.open(`/#/budget/${budgetId}`, "_blank");
  return Promise.resolve({ ok: true });
};
