import { ClientService } from "../service/clientService.js";

export const listClients = async (req, res) => {
  try {
    const clients = await ClientService.listClients();
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getClient = async (req, res) => {
  try {
    const client = await ClientService.getClient(req.params.id);
    if (!client) return res.status(404).json(null);
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createClient = async (req, res) => {
  try {
    const client = await ClientService.createClient(req.body);
    res.status(201).json(client);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateClient = async (req, res) => {
  try {
    const client = await ClientService.updateClient(req.params.id, req.body);
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteClient = async (req, res) => {
  try {
    await ClientService.deleteClient(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
