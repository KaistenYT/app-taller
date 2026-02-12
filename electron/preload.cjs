// electron/preload.js
const { contextBridge, ipcRenderer } = require("electron");

/**
 * Expone APIs seguras desde el proceso de precarga al contexto de renderizado (ventana del navegador).
 * Esto permite que el código del frontend (JavaScript regular) interactúe con las funcionalidades
 * de Node.js y Electron de manera controlada y segura, sin exponer el proceso principal directamente.
 */
contextBridge.exposeInMainWorld("api", {
  // APIs para la gestión de Dispositivos
  listDevices: () => ipcRenderer.invoke("list-devices"), // Invoca IPC para listar dispositivos
  getDevice: (id) => ipcRenderer.invoke("get-device", id), // Invoca IPC para obtener un dispositivo por ID
  getDeviceBySerial: (serial) =>
    ipcRenderer.invoke("get-device-by-serial", serial), // Invoca IPC para obtener un dispositivo por número de serie
  createDevice: (data) => ipcRenderer.invoke("create-device", data), // Invoca IPC para crear un dispositivo
  upsertDeviceBySerial: (data) =>
    ipcRenderer.invoke("upsert-device-by-serial", data), // Invoca IPC para crear o actualizar un dispositivo por número de serie
  updateDevice: (id, data) => ipcRenderer.invoke("update-device", id, data), // Invoca IPC para actualizar un dispositivo
  deleteDevice: (id) => ipcRenderer.invoke("delete-device", id), // Invoca IPC para eliminar un dispositivo

  // APIs para la gestión de Clientes
  listClients: () => ipcRenderer.invoke("list-clients"), // Invoca IPC para listar clientes
  getClient: (id) => ipcRenderer.invoke("get-client", id), // Invoca IPC para obtener un cliente por ID
  createClient: (data) => ipcRenderer.invoke("create-client", data), // Invoca IPC para crear un cliente
  updateClient: (id, data) => ipcRenderer.invoke("update-client", id, data), // Invoca IPC para actualizar un cliente
  deleteClient: (id) => ipcRenderer.invoke("delete-client", id), // Invoca IPC para eliminar un cliente

  // APIs para la gestión de Recepciones
  listReceptions: (filters) => ipcRenderer.invoke("list-receptions", filters), // Invoca IPC para listar recepciones con filtros
  countReceptions: (filters) => ipcRenderer.invoke("count-receptions", filters), // Invoca IPC para contar recepciones con filtros
  listArchivedReceptions: () => ipcRenderer.invoke("list-archived-receptions"), // Invoca IPC para listar recepciones archivadas
  restoreReception: (id, user_id) => ipcRenderer.invoke("restore-reception", { id, user_id }), // Invoca IPC para restaurar una recepción
  archiveReception: (id, user_id) => ipcRenderer.invoke("archive-reception", { id, user_id }), // Invoca IPC para archivar una recepción
  getReception: (id) => ipcRenderer.invoke("get-reception", id), // Invoca IPC para obtener una recepción por ID
  createReception: (data, user_id) => ipcRenderer.invoke("create-reception", { data, user_id }), // Invoca IPC para crear una recepción
  updateReception: (id, data, user_id) => ipcRenderer.invoke("update-reception", { id, data, user_id }), // Invoca IPC para actualizar una recepción

  deleteReception: (id, user_id, user_role) => ipcRenderer.invoke("delete-reception", { id, user_id, user_role }), // Invoca IPC para eliminar una recepción
  receptionDetails: (id) => ipcRenderer.invoke("reception-details", id), // Invoca IPC para obtener detalles de una recepción

  // APIs para la gestión de Usuarios
  loginUser: (username, password)=> ipcRenderer.invoke("login-user", username, password), // Invoca IPC para autenticar un usuario
  registerUser: (userData) => ipcRenderer.invoke("register-user", userData), // Invoca IPC para registrar un nuevo usuario
  resetUserPassword: ({ username, newPassword }) => ipcRenderer.invoke("reset-user-password", { username, newPassword }), // Invoca IPC para resetear la contraseña de un usuario
  
  // APIs para la gestión de Reportes
  listReports: () => ipcRenderer.invoke("list-reports"), // Invoca IPC para listar reportes
  getReport: (id) => ipcRenderer.invoke("get-report", id), // Invoca IPC para obtener un reporte por ID
  getReportByReception: (receptionId) =>
    ipcRenderer.invoke("get-report-by-reception", receptionId), // Invoca IPC para obtener reportes por ID de recepción
  createReport: (data) => ipcRenderer.invoke("create-report", data), // Invoca IPC para crear un reporte
  updateReport: (id, data) => ipcRenderer.invoke("update-report", id, data), // Invoca IPC para actualizar un reporte
  deleteReport: (id) => ipcRenderer.invoke("delete-report", id), // Invoca IPC para eliminar un reporte

  // APIs para el historial de Recepciones (auditoría)
  listReceptionHistory: (filters) => ipcRenderer.invoke('list-reception-history', filters), // Invoca IPC para listar el historial de recepciones con filtros
  countReceptionHistory: (filters) => ipcRenderer.invoke('count-reception-history', filters), // Invoca IPC para contar el historial de recepciones con filtros

  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args), // Método genérico para invocar cualquier canal IPC
});
