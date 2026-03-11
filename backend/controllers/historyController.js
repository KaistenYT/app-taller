import { ReceptionHistoryService } from "../service/receptionHistoryService.js";

export const listHistory = async (req, res) => {
  const history = await ReceptionHistoryService.listHistory(req.query);
  res.json(history);
};

export const countHistory = async (req, res) => {
  const count = await ReceptionHistoryService.countHistory(req.query);
  res.json({ count });
};
