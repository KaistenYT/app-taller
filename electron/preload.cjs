// electron/preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  //Device
  listDevices: () => ipcRenderer.invoke("list-devices"),
  getDevice: (id) => ipcRenderer.invoke("get-device", id),
  createDevice: (data) => ipcRenderer.invoke("create-device", data),
  updateDevice: (id, data) => ipcRenderer.invoke("update-device", id, data),
  deleteDevice: (id) => ipcRenderer.invoke("delete-device", id),

  //Client
  listClients: () => ipcRenderer.invoke("list-clients"),
  getClient: (id) => ipcRenderer.invoke("get-client", id),
  createClient: (data) => ipcRenderer.invoke("create-client", data),
  updateClient: (id, data) => ipcRenderer.invoke("update-client", id, data),
  deleteClient: (id) => ipcRenderer.invoke("delete-client", id),

  //Reception
  listReceptions: () => ipcRenderer.invoke("list-receptions"),
  listArchivedReceptions: () => ipcRenderer.invoke("list-archived-receptions"),
  restoreReception: (id) => ipcRenderer.invoke("restore-reception", id),
  archiveReception: (id) => ipcRenderer.invoke("archive-reception", id),
  getReception: (id) => ipcRenderer.invoke("get-reception", id),
  createReception: (data) => ipcRenderer.invoke("create-reception", data),
  updateReception: (id, data) =>
    ipcRenderer.invoke("update-reception", id, data),
  deleteReception: (id) => ipcRenderer.invoke("delete-reception", id),
  receptionDetails: (id) => ipcRenderer.invoke("reception-details", id),
});
