import { Router } from "express";
import {
  getTickets,
  createTicket,
  getTicketById,
  assignTicket,
  updateTicketStatus,
  addTicketComment,
  deleteTicket,
} from "../controllers/ticket.controller.js";
import { protect } from "../controllers/administrationPolicy.controller.js";

const router = Router();

router.get("/tickets", protect, getTickets);
router.post("/tickets", protect, createTicket);
router.get("/tickets/:id", protect, getTicketById);
router.patch("/tickets/:id/assign", protect, assignTicket);
router.patch("/tickets/:id/status", protect, updateTicketStatus);
router.post("/tickets/:id/comments", protect, addTicketComment);
router.delete("/tickets/:id", protect, deleteTicket);

export default router;