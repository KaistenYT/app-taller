import { ReceptionService } from "../service/receptionService.js";

export const listReceptions = async (req, res) => {
  const filters = { ...req.query, company_id: req.user.company_id };
  const receptions = await ReceptionService.listReceptions(filters);
  res.json(receptions);
};

export const countReceptions = async (req, res) => {
  const filters = { ...req.query, company_id: req.user.company_id };
  const count = await ReceptionService.countReceptions(filters);
  res.json({ count });
};

export const listArchivedReceptions = async (req, res) => {
  const receptions = await ReceptionService.listArchivedReceptions(req.user.company_id);
  res.json(receptions);
};

export const getReception = async (req, res) => {
  const reception = await ReceptionService.getReception(req.params.id, req.user.company_id);
  if (!reception)
    return res.status(404).json({ error: "Recepción no encontrada" });
  res.json(reception);
};

export const getReceptionDetails = async (req, res) => {
  const details = await ReceptionService.getReceptionDetails(req.params.id, req.user.company_id);
  res.json(details);
};

export const createReception = async (req, res) => {
  const reception = await ReceptionService.createReception(
    req.body,
    req.user.id,
    req.user.company_id
  );
  res.status(201).json(reception);
};

export const updateReception = async (req, res) => {
  const reception = await ReceptionService.updateReception(
    req.params.id,
    req.body,
    req.user.id,
    req.user.company_id
  );
  res.json(reception);
};

export const deleteReception = async (req, res) => {
  await ReceptionService.deleteReception(
    req.params.id,
    req.user.id,
    req.user.role,
    req.body.reason,
    req.user.company_id
  );
  res.json({ ok: true });
};

export const archiveReception = async (req, res) => {
  await ReceptionService.archiveReception(req.params.id, req.user.id, req.body.reason, req.user.company_id);
  res.json({ ok: true });
};

export const restoreReception = async (req, res) => {
  await ReceptionService.restoreReception(req.params.id, req.user.id, req.user.company_id);
  res.json({ ok: true });
};
