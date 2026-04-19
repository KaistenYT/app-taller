// API adapter that works with both HTTP and Electron IPC modes
const isElectron = window.electronAPI?.isElectron;

// Helper to make API calls via IPC when in Electron mode
const ipcRequest = async (endpoint, config) => {
  if (typeof config === 'string') {
    // Simple GET request
    const method = config.toLowerCase();
    const handlerName = `api:${endpoint}`;
    
    if (window.electronAPI[handlerName]) {
      return window.electronAPI[handlerName]();
    }
  }
  
  // Fallback to generic IPC request
  return window.electronAPI['api-request'](config);
};

// Create API object that matches the axios interface
const api = {
  _isIPC: isElectron,
  
  get: async (url, params = {}) => {
    if (isElectron) {
      const endpoint = url.replace('/api/', '').split('/')[0];
      const handlerName = `api:${endpoint}`;
      
      // Try to use specific handler
      if (window.electronAPI[handlerName]) {
        const result = await window.electronAPI[handlerName](params);
        return { data: result.data };
      }
      
      // Fallback to generic request
      const result = await window.electronAPI['api-request']({
        method: 'get',
        url,
        params,
      });
      return { data: result.data };
    }
    
    // HTTP mode - this should be handled by axios in the main API file
    throw new Error('HTTP mode not supported in this adapter');
  },
  
  post: async (url, data) => {
    if (isElectron) {
      const endpoint = url.replace('/api/', '').split('/')[0];
      const handlerName = `api:${endpoint}`;
      
      if (window.electronAPI[handlerName]) {
        const result = await window.electronAPI[handlerName](data);
        return { data: result.data };
      }
      
      const result = await window.electronAPI['api-request']({
        method: 'post',
        url,
        data,
      });
      return { data: result.data };
    }
    
    throw new Error('HTTP mode not supported in this adapter');
  },
  
  put: async (url, data) => {
    if (isElectron) {
      const result = await window.electronAPI['api-request']({
        method: 'put',
        url,
        data,
      });
      return { data: result.data };
    }
    
    throw new Error('HTTP mode not supported in this adapter');
  },
  
  delete: async (url) => {
    if (isElectron) {
      const result = await window.electronAPI['api-request']({
        method: 'delete',
        url,
      });
      return { data: result.data };
    }
    
    throw new Error('HTTP mode not supported in this adapter');
  },
};

export { api, isElectron };
