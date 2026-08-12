import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: {
        values: ["Retail Sale", "Project"],
        message: "Invalid ticket type",
      },
      default: "Retail Sale",
    },
    project_details: {
      project_name: { type: String, trim: true },
      time: { type: Date },
      desc: { type: String, trim: true },
      number_of_worker: { type: Number, min: 0 },
      time_duration: { type: String, trim: true },
      note: { type: String, trim: true },
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ["Open", "In Progress", "Pending", "Resolved"],
        message: "Invalid ticket status",
      },
      default: "Open",
    },
    priority: {
      type: String,
      enum: {
        values: ["Low", "Medium", "High"],
        message: "Invalid ticket priority",
      },
      default: "Medium",
    },
    assigned_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: [true, "Creator is required"],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    id: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ticketSchema.index({ status: 1 });
ticketSchema.index({ created_by: 1 });

const Ticket = mongoose.model("Ticket", ticketSchema);

export default Ticket;