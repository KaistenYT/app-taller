import { ClientService } from "../service/clientService.js";

export const listClients = async (_req, res) => {
  const clients = await ClientService.listClients();
  res.json(clients);
};

export const getClient = async (req, res) => {
  const client = await ClientService.getClient(req.params.id);
  if (!client) return res.json(null);
  res.json(client);
};

export const createClient = async (req, res) => {
  const client = await ClientService.createClient(req.body);
  res.status(201).json(client);
};

export const updateClient = async (req, res) => {
  const client = await ClientService.updateClient(req.params.id, req.body);
  res.json(client);
};

export const deleteClient = async (req, res) => {
  await ClientService.deleteClient(req.params.id);
  res.json({ ok: true });
};
