import { create } from "zustand";
import {
  listDevices,
  createDevice,
  updateDevice,
  deleteDevice,
  getDeviceBySerial,
} from "../api/httpApi";

export const useDeviceStore = create((set, get) => ({
  devices: [],
  loading: false,
  error: null,

  loadDevices: async () => {
    set({ loading: true, error: null });
    try {
      const devices = await listDevices();
      set({ devices, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  addDevice: async (deviceData) => {
    const newDevice = await createDevice(deviceData);
    set((state) => ({
      devices: [...state.devices, newDevice],
    }));
    return newDevice;
  },

  updateDeviceData: async (id, deviceData) => {
    const updatedDevice = await updateDevice(id, deviceData);
    set((state) => ({
      devices: state.devices.map((device) =>
        device.id === id ? updatedDevice : device
      ),
    }));
    return updatedDevice;
  },

  removeDevice: async (id) => {
    await deleteDevice(id);
    set((state) => ({
      devices: state.devices.filter((device) => device.id !== id),
    }));
  },

  getDeviceBySerial: async (serial) => {
    try {
      return await getDeviceBySerial(serial);
    } catch (error) {
      return null;
    }
  },

  getDeviceById: (id) => {
    return get().devices.find((device) => device.id === id);
  },
}));
