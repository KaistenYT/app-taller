// electron/preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  listDevices: () => ipcRenderer.invoke("list-devices"),
  getDevice: (id) => ipcRenderer.invoke("get-device", id),
  createDevice: (data) => ipcRenderer.invoke("create-device", data),
  updateDevice: (id, data) => ipcRenderer.invoke("update-device", id, data),
  deleteDevice: (id) => ipcRenderer.invoke("delete-device", id),
});
