const { ipcMain } = require('electron');
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

// Create axios instance with defaults
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30000,
});

// IPC Handlers for API calls
function setupApiHandlers() {
  // Generic request handler
  ipcMain.handle('api-request', async (event, config) => {
    try {
      const response = await api(config);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  });

  // Devices
  ipcMain.handle('api:listDevices', async () => {
    try {
      const response = await api.get('/devices');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('api:getDevice', async (event, id) => {
    try {
      const response = await api.get(`/devices/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('api:getDeviceBySerial', async (event, serial) => {
    try {
      const response = await api.get(`/devices/serial/${serial}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('api:createDevice', async (event, data) => {
    try {
      const response = await api.post('/devices', data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('api:updateDevice', async (event, { id, data }) => {
    try {
      const response = await api.put(`/devices/${id}`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('api:deleteDevice', async (event, id) => {
    try {
      const response = await api.delete(`/devices/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Clients
  ipcMain.handle('api:listClients', async () => {
    try {
      const response = await api.get('/clients');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('api:getClient', async (event, id) => {
    try {
      const response = await api.get(`/clients/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('api:createClient', async (event, data) => {
    try {
      const response = await api.post('/clients', data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('api:updateClient', async (event, { id, data }) => {
    try {
      const response = await api.put(`/clients/${id}`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('api:deleteClient', async (event, id) => {
    try {
      const response = await api.delete(`/clients/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Receptions
  ipcMain.handle('api:listReceptions', async (event, filters) => {
    try {
      const response = await api.get('/receptions', { params: filters });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('api:getReceptionDetails', async (event, id) => {
    try {
      const response = await api.get(`/receptions/${id}/details`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('api:createReception', async (event, data) => {
    try {
      const response = await api.post('/receptions', data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('api:updateReception', async (event, { id, data }) => {
    try {
      const response = await api.put(`/receptions/${id}`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Reports
  ipcMain.handle('api:listReports', async () => {
    try {
      const response = await api.get('/reports');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('api:getReportByReception', async (event, receptionId) => {
    try {
      const response = await api.get(`/reports/reception/${receptionId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('api:createReportFromReception', async (event, receptionId) => {
    try {
      const response = await api.post(`/reports/reception/${receptionId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Budgets
  ipcMain.handle('api:listBudgets', async () => {
    try {
      const response = await api.get('/budgets');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('api:getBudgetDetails', async (event, id) => {
    try {
      const response = await api.get(`/budgets/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('api:createBudget', async (event, data) => {
    try {
      const response = await api.post('/budgets', data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Auth
  ipcMain.handle('api:loginUser', async (event, { username, password }) => {
    try {
      const response = await api.post('/users/login', { username, password });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('api:logoutUser', async () => {
    try {
      const response = await api.post('/users/logout');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('api:getCurrentUser', async () => {
    try {
      const response = await api.get('/users/me');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

module.exports = { setupApiHandlers };
