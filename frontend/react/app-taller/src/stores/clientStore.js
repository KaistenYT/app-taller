import { create } from "zustand";
import {
  listClients,
  createClient,
  updateClient,
  deleteClient,
} from "../api/httpApi";

export const useClientStore = create((set, get) => ({
  clients: [],
  loading: false,
  error: null,

  loadClients: async () => {
    set({ loading: true, error: null });
    try {
      const clients = await listClients();
      set({ clients, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  addClient: async (clientData) => {
    const newClient = await createClient(clientData);
    set((state) => ({
      clients: [...state.clients, newClient],
    }));
    return newClient;
  },

  updateClientData: async (id, clientData) => {
    const updatedClient = await updateClient(id, clientData);
    set((state) => ({
      clients: state.clients.map((client) =>
        client.id === id ? updatedClient : client
      ),
    }));
    return updatedClient;
  },

  removeClient: async (id) => {
    await deleteClient(id);
    set((state) => ({
      clients: state.clients.filter((client) => client.id !== id),
    }));
  },

  getClientById: (id) => {
    return get().clients.find((client) => client.id === id);
  },
}));
