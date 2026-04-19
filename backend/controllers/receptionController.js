import { ReceptionService } from "../service/receptionService.js";

export const listReceptions = async (req, res) => {
  const filters = { ...req.query };
  const receptions = await ReceptionService.listReceptions(filters);
  res.json(receptions);
};

export const getReceptionStats = async (req, res) => {
  const stats = await ReceptionService.getStatusStats();
  res.json(stats);
};

export const countReceptions = async (req, res) => {
  const filters = { ...req.query };
  const count = await ReceptionService.countReceptions(filters);
  res.json({ count });
};

export const listArchivedReceptions = async (req, res) => {
  const receptions = await ReceptionService.listArchivedReceptions();
  res.json(receptions);
};

export const getReception = async (req, res) => {
  const reception = await ReceptionService.getReception(req.params.id);
  if (!reception)
    return res.status(404).json({
      error: { code: 404, message: "Recepción no encontrada" }
    });
  res.json(reception);
};

export const getReceptionDetails = async (req, res) => {
  const details = await ReceptionService.getReceptionDetails(req.params.id);
  res.json(details);
};

export const createReception = async (req, res) => {
  const reception = await ReceptionService.createReception(
    req.body,
    req.user.id
  );
  res.status(201).json(reception);
};

export const updateReception = async (req, res) => {
  const reception = await ReceptionService.updateReception(
    req.params.id,
    req.body,
    req.user.id
  );
  res.json(reception);
};

export const deleteReception = async (req, res) => {
  await ReceptionService.deleteReception(
    req.params.id,
    req.user.id,
    req.user.role,
    req.body.reason
  );
  res.json({ ok: true });
};

export const archiveReception = async (req, res) => {
  await ReceptionService.archiveReception(req.params.id, req.user.id, req.body.reason);
  res.json({ ok: true });
};

export const restoreReception = async (req, res) => {
  await ReceptionService.restoreReception(req.params.id, req.user.id);
  res.json({ ok: true });
};
