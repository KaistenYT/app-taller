import { ReceptionHistoryService } from "../service/receptionHistoryService.js";

export const listHistory = async (req, res) => {
  const filters = { ...req.query, company_id: req.user.company_id };
  const history = await ReceptionHistoryService.listHistory(filters);
  res.json(history);
};

export const countHistory = async (req, res) => {
  const filters = { ...req.query, company_id: req.user.company_id };
  const count = await ReceptionHistoryService.countHistory(filters);
  res.json({ count });
};
