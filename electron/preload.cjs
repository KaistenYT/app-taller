const { contextBridge, ipcRenderer } = require("electron");

// Expone métodos seguros para comunicación IPC
contextBridge.exposeInMainWorld("api", {
  // Dispositivos
  listDevices: () => ipcRenderer.invoke("list-devices"),
  getDevice: (id) => ipcRenderer.invoke("get-device", id),
  getDeviceBySerial: (serial) =>
    ipcRenderer.invoke("get-device-by-serial", serial),
  createDevice: (data) => ipcRenderer.invoke("create-device", data),
  upsertDeviceBySerial: (data) =>
    ipcRenderer.invoke("upsert-device-by-serial", data),
  updateDevice: (id, data) => ipcRenderer.invoke("update-device", id, data),
  deleteDevice: (id) => ipcRenderer.invoke("delete-device", id),

  // Clientes
  listClients: () => ipcRenderer.invoke("list-clients"),
  getClient: (id) => ipcRenderer.invoke("get-client", id),
  createClient: (data) => ipcRenderer.invoke("create-client", data),
  updateClient: (id, data) => ipcRenderer.invoke("update-client", id, data),
  deleteClient: (id) => ipcRenderer.invoke("delete-client", id),

  // Recepciones
  listReceptions: (filters) => ipcRenderer.invoke("list-receptions", filters),
  countReceptions: (filters) => ipcRenderer.invoke("count-receptions", filters),
  listArchivedReceptions: () => ipcRenderer.invoke("list-archived-receptions"),
  restoreReception: (id, user_id) =>
    ipcRenderer.invoke("restore-reception", { id, user_id }),
  archiveReception: (id, user_id) =>
    ipcRenderer.invoke("archive-reception", { id, user_id }),
  getReception: (id) => ipcRenderer.invoke("get-reception", id),
  createReception: (data, user_id) =>
    ipcRenderer.invoke("create-reception", { data, user_id }),
  updateReception: (id, data, user_id) =>
    ipcRenderer.invoke("update-reception", { id, data, user_id }),
  deleteReception: (id, user_id, user_role) =>
    ipcRenderer.invoke("delete-reception", { id, user_id, user_role }),
  receptionDetails: (id) => ipcRenderer.invoke("reception-details", id),

  // Usuarios
  loginUser: (username, password) =>
    ipcRenderer.invoke("login-user", username, password),
  registerUser: (userData) => ipcRenderer.invoke("register-user", userData),
  resetUserPassword: (data) => ipcRenderer.invoke("reset-user-password", data),

  // Reportes
  listReports: () => ipcRenderer.invoke("list-reports"),
  getReport: (id) => ipcRenderer.invoke("get-report", id),
  getReportByReception: (receptionId) =>
    ipcRenderer.invoke("get-report-by-reception", receptionId),
  createReport: (data) => ipcRenderer.invoke("create-report", data),
  updateReport: (id, data) => ipcRenderer.invoke("update-report", id, data),
  deleteReport: (id) => ipcRenderer.invoke("delete-report", id),
  openReport: (reportPath) => ipcRenderer.invoke("open-report", reportPath),

  // Historial
  listReceptionHistory: (filters) =>
    ipcRenderer.invoke("list-reception-history", filters),
  countReceptionHistory: (filters) =>
    ipcRenderer.invoke("count-reception-history", filters),

  // Utilidades
  seedData: () => ipcRenderer.invoke("seed-data"),
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
});
