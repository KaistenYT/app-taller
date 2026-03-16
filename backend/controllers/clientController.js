import { ClientService } from "../service/clientService.js";

export const listClients = async (req, res) => {
  const clients = await ClientService.listClients(req.user.company_id);
  res.json(clients);
};

export const getClient = async (req, res) => {
  const client = await ClientService.getClient(req.params.id, req.user.company_id);
  if (!client) return res.json(null);
  res.json(client);
};

export const createClient = async (req, res) => {
  const client = await ClientService.createClient({ ...req.body, company_id: req.user.company_id });
  res.status(201).json(client);
};

export const updateClient = async (req, res) => {
  const client = await ClientService.updateClient(req.params.id, req.user.company_id, req.body);
  res.json(client);
};

export const deleteClient = async (req, res) => {
  await ClientService.deleteClient(req.params.id, req.user.company_id);
  res.json({ ok: true });
};
