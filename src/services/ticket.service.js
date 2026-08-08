import mongoose from "mongoose";
import Ticket from "../models/ticket.model.js";
import TicketHistory from "../models/ticketHistory.model.js";
import TicketComment from "../models/ticketComment.model.js";

/**
 * Record a ticket-history entry (used by controller + telegram service).
 */
export const recordTicketHistory = async (ticketId, userId, action) => {
  return TicketHistory.create({
    ticket_id: ticketId,
    user_id: userId,
    action_performed: action,
  });
};

/**
 * Soft-delete a ticket and cascade-delete its comments + history.
 */
export const deleteTicketCascade = async (ticketId) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await Ticket.findByIdAndUpdate(
        ticketId,
        { isDeleted: true, deletedAt: new Date() },
        { session }
      );
      await TicketComment.deleteMany({ ticket_id: ticketId }).session(session);
      await TicketHistory.deleteMany({ ticket_id: ticketId }).session(session);
    });
    await session.endSession();
  } catch (error) {
    await session.endSession();
    throw error;
  }
};