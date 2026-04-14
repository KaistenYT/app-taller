import { ReceptionHistoryService } from "../service/receptionHistoryService.js";

export const listHistory = async (req, res) => {
  try {
    const filters = { ...req.query };
    const history = await ReceptionHistoryService.listHistory(filters);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const countHistory = async (req, res) => {
  try {
    const filters = { ...req.query };
    const count = await ReceptionHistoryService.countHistory(filters);
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
