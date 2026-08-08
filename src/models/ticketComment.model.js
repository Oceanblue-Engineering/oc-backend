import mongoose from "mongoose";

const ticketCommentSchema = new mongoose.Schema(
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
    message: {
      type: String,
      required: [true, "Message is required"],
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

ticketCommentSchema.index({ ticket_id: 1, createdAt: 1 });

const TicketComment = mongoose.model("TicketComment", ticketCommentSchema);

export default TicketComment;