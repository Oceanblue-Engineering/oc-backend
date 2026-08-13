import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    // ── Identification ─────────────────────────────
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    companyName: {
      type: String,
      trim: true,
    },
    businessName: {
      type: String,
      trim: true,
    },
    industry: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: {
        values: ["Signed", "In-Development", "Delivered"],
        message: "Invalid project status",
      },
      default: "Signed",
    },

    // ── Post-Sale Metadata ─────────────────────────
    projectId: {
      type: String,
      trim: true,
    },
    projectStartDate: {
      type: Date,
    },
    projectDeliveryDate: {
      type: Date,
    },
    deliverablesSummary: {
      type: String,
      trim: true,
    },
    purchasedServices: [
      {
        name: { type: String, trim: true },
        type: { type: String, trim: true },
        status: {
          type: String,
          enum: {
            values: ["pending", "active", "completed"],
            message: "Invalid service status",
          },
          default: "pending",
        },
      },
    ],

    // ── POS Integration ───
    creditPersonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CreditPerson",
      default: null,
    },

    // ── Original Lead Reference ───
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      default: null,
    },

    // ── Soft Delete ────────────────────────────────
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

clientSchema.index({ name: 1, isDeleted: 1 });
clientSchema.index({ status: 1 });

const Client = mongoose.model("Client", clientSchema);

export default Client;
