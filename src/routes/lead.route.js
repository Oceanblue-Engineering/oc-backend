import express from "express";
import {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  addLeadLog,
  deleteLead,
} from "../controllers/lead.controller.js";
import { protect } from "../controllers/administrationPolicy.controller.js";

const router = express.Router();

router.post("/leads", protect, createLead);
router.get("/leads", protect, getLeads);
router.get("/leads/:id", protect, getLeadById);
router.patch("/leads/:id", protect, updateLead);
router.post("/leads/:id/log", protect, addLeadLog);
router.delete("/leads/:id", protect, deleteLead);

export default router;
