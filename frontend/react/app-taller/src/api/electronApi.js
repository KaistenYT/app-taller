// Wrapper de API Electron para el frontend
const api = typeof window !== "undefined" ? window.api : null;

const noOp = (..._args) => {
  console.warn("Electron API no disponible.");
  return Promise.resolve(null);
};

const wrap = (fn) => (api && fn ? fn : noOp);

// Dispositivos
export const listDevices = wrap(api?.listDevices);
export const getDevice = wrap(api?.getDevice);
export const getDeviceBySerial = wrap(api?.getDeviceBySerial);
export const createDevice = wrap(api?.createDevice);
export const upsertDeviceBySerial = wrap(api?.upsertDeviceBySerial);
export const updateDevice = wrap(api?.updateDevice);
export const deleteDevice = wrap(api?.deleteDevice);

// Clientes
export const listClients = wrap(api?.listClients);
export const getClient = wrap(api?.getClient);
export const createClient = wrap(api?.createClient);
export const updateClient = wrap(api?.updateClient);
export const deleteClient = wrap(api?.deleteClient);

// Recepciones
export const listReceptions = wrap(api?.listReceptions);
export const countReceptions = wrap(api?.countReceptions);
export const listArchivedReceptions = wrap(api?.listArchivedReceptions);
export const getReception = wrap(api?.getReception);
export const createReception = wrap(api?.createReception);
export const updateReception = wrap(api?.updateReception);
export const deleteReception = wrap(api?.deleteReception);
export const archiveReception = wrap(api?.archiveReception);
export const restoreReception = wrap(api?.restoreReception);
export const receptionDetails = wrap(api?.receptionDetails);

// Usuarios
export const loginUser = wrap(api?.loginUser);
export const registerUser = wrap(api?.registerUser);
export const resetUserPassword = wrap(api?.resetUserPassword);

// Reportes
export const listReports = wrap(api?.listReports);
export const getReport = wrap(api?.getReport);
export const getReportByReception = wrap(api?.getReportByReception);
export const createReport = wrap(api?.createReport);
export const updateReport = wrap(api?.updateReport);
export const deleteReport = wrap(api?.deleteReport);

// Historial
export const listReceptionHistory = wrap(api?.listReceptionHistory);
export const countReceptionHistory = wrap(api?.countReceptionHistory);

// Utilidades
export const openReport = wrap(api?.openReport);
export const seedData = wrap(api?.seedData);
export const invoke = wrap(api?.invoke);
