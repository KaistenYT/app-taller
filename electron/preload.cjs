// electron/preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  // Devices
  listDevices: () => ipcRenderer.invoke("list-devices"),
  getDevice: (id) => ipcRenderer.invoke("get-device", id),
  getDeviceBySerial: (serial) =>
    ipcRenderer.invoke("get-device-by-serial", serial),
  createDevice: (data) => ipcRenderer.invoke("create-device", data),
  upsertDeviceBySerial: (data) =>
    ipcRenderer.invoke("upsert-device-by-serial", data),
  updateDevice: (id, data) => ipcRenderer.invoke("update-device", id, data),
  deleteDevice: (id) => ipcRenderer.invoke("delete-device", id),

  // Clients
  listClients: () => ipcRenderer.invoke("list-clients"),
  getClient: (id) => ipcRenderer.invoke("get-client", id),
  createClient: (data) => ipcRenderer.invoke("create-client", data),
  updateClient: (id, data) => ipcRenderer.invoke("update-client", id, data),
  deleteClient: (id) => ipcRenderer.invoke("delete-client", id),

  // Receptions
  listReceptions: () => ipcRenderer.invoke("list-receptions"),
  listArchivedReceptions: () => ipcRenderer.invoke("list-archived-receptions"),
  restoreReception: (id) => ipcRenderer.invoke("restore-reception", id),
  archiveReception: (id) => ipcRenderer.invoke("archive-reception", id),
  getReception: (id) => ipcRenderer.invoke("get-reception", id),
  createReception: (data) => ipcRenderer.invoke("create-reception", data),
  updateReception: (id, data) =>
    ipcRenderer.invoke("update-reception", { id, data }),

  deleteReception: (id) => ipcRenderer.invoke("delete-reception", id),
  receptionDetails: (id) => ipcRenderer.invoke("reception-details", id),

  //user
  loginUser: (username, password)=> ipcRenderer.invoke("login-user", username, password),
  registerUser: (userData) => ipcRenderer.invoke("register-user", userData),
  // Reports
  listReports: () => ipcRenderer.invoke("list-reports"),
  getReport: (id) => ipcRenderer.invoke("get-report", id),
  getReportByReception: (receptionId) =>
    ipcRenderer.invoke("get-report-by-reception", receptionId),
  createReport: (data) => ipcRenderer.invoke("create-report", data),
  updateReport: (id, data) => ipcRenderer.invoke("update-report", id, data),
  deleteReport: (id) => ipcRenderer.invoke("delete-report", id),

  // Reception history (audit)
  listReceptionHistory: (filters) => ipcRenderer.invoke('list-reception-history', filters),
  countReceptionHistory: (filters) => ipcRenderer.invoke('count-reception-history', filters),

  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
});
