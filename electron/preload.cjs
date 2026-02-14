const { contextBridge, ipcRenderer } = require("electron");

// Puente seguro entre renderer y main process (contextIsolation activo)
contextBridge.exposeInMainWorld("api", {
  listDevices: () => ipcRenderer.invoke("list-devices"),
  getDevice: (id) => ipcRenderer.invoke("get-device", id),
  getDeviceBySerial: (serial) =>
    ipcRenderer.invoke("get-device-by-serial", serial),
  createDevice: (data) => ipcRenderer.invoke("create-device", data),
  upsertDeviceBySerial: (data) =>
    ipcRenderer.invoke("upsert-device-by-serial", data),
  updateDevice: (id, data) => ipcRenderer.invoke("update-device", id, data),
  deleteDevice: (id) => ipcRenderer.invoke("delete-device", id),

  listClients: () => ipcRenderer.invoke("list-clients"),
  getClient: (id) => ipcRenderer.invoke("get-client", id),
  createClient: (data) => ipcRenderer.invoke("create-client", data),
  updateClient: (id, data) => ipcRenderer.invoke("update-client", id, data),
  deleteClient: (id) => ipcRenderer.invoke("delete-client", id),

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

  loginUser: (username, password) =>
    ipcRenderer.invoke("login-user", username, password),
  registerUser: (userData) => ipcRenderer.invoke("register-user", userData),
  resetUserPassword: (data) => ipcRenderer.invoke("reset-user-password", data),
  listUsers: (data) => ipcRenderer.invoke("list-users", data),
  updateUser: (data) => ipcRenderer.invoke("update-user", data),
  deleteUser: (data) => ipcRenderer.invoke("delete-user", data),

  listReports: () => ipcRenderer.invoke("list-reports"),
  getReport: (id) => ipcRenderer.invoke("get-report", id),
  getReportByReception: (receptionId) =>
    ipcRenderer.invoke("get-report-by-reception", receptionId),
  createReport: (data) => ipcRenderer.invoke("create-report", data),
  updateReport: (id, data) => ipcRenderer.invoke("update-report", id, data),
  deleteReport: (id) => ipcRenderer.invoke("delete-report", id),
  openReport: (reportPath) => ipcRenderer.invoke("open-report", reportPath),

  listReceptionHistory: (filters) =>
    ipcRenderer.invoke("list-reception-history", filters),
  countReceptionHistory: (filters) =>
    ipcRenderer.invoke("count-reception-history", filters),

  seedData: () => ipcRenderer.invoke("seed-data"),
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
});
