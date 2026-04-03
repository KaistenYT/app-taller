import { ClientService } from "../service/clientService.js";

export const listClients = async (req, res) => {
  try {
    const clients = await ClientService.listClients(req.user.company_id);
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getClient = async (req, res) => {
  try {
    const client = await ClientService.getClient(
      req.params.id,
      req.user.company_id,
    );
    if (!client) return res.json(null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
  res.json(client);
};

export const createClient = async (req, res) => {
  try {
    const client = await ClientService.createClient({
      ...req.body,
      company_id: req.user.company_id,
    });
    res.status(201).json(client);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateClient = async (req, res) => {
  try {
    const client = await ClientService.updateClient(
      req.params.id,
      req.user.company_id,
      req.body,
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
  res.json(client);
};

export const deleteClient = async (req, res) => {
  try {
    await ClientService.deleteClient(req.params.id, req.user.company_id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
