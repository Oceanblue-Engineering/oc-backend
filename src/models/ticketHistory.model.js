import mongoose from "mongoose";

const ticketHistorySchema = new mongoose.Schema(
  {
    ticket_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: [true, "Ticket is required"],
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: [true, "User is required"],
    },
    action_performed: {
      type: String,
      required: [true, "Action is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
    id: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ticketHistorySchema.index({ ticket_id: 1, createdAt: 1 });

const TicketHistory = mongoose.model("TicketHistory", ticketHistorySchema);

export default TicketHistory;