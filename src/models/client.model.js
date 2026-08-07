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

    // ── State Flags ────────────────────────────────
    isPostSale: {
      type: Boolean,
      default: false,
    },
    // Pipeline type: "sales" | "service"
    leadType: {
      type: String,
      enum: {
        values: ["sales", "service"],
        message: "Invalid lead type",
      },
      default: "sales",
    },
    status: {
      type: String,
      enum: {
        values: [
          // Sales pipeline
          "Sale Inquiry",
          "Product Explain",
          "Sent Quotation",
          "Purchased",
          // Service pipeline
          "Service Inquiry",
          "Service Explain",
          "Meeting Made",
          "Sent Contract",
          // Shared
          "Follow-up",
          "Ghost",
          // Post-sale
          "Signed",
          "In-Development",
          "Delivered",
        ],
        message: "Invalid client status",
      },
      default: "Sale Inquiry",
    },

    // ── Pre-Sale Metadata ──────────────────────────
    inquiryDate: {
      type: Date,
    },
    sourceChannel: {
      type: String,
      trim: true,
    },
    currentProblems: {
      type: String,
      trim: true,
    },
    desiredOutcome: {
      type: String,
      trim: true,
    },
    nextActionDate: {
      type: Date,
    },
    conversationLogs: [
      {
        text: { type: String, trim: true },
        date: { type: Date, default: Date.now },
      },
    ],

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

    // ── POS Integration (auto-created on Signed) ───
    creditPersonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CreditPerson",
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

// Search-friendly indexes
clientSchema.index({ name: 1, isDeleted: 1 });
clientSchema.index({ isPostSale: 1, status: 1 });

const Client = mongoose.model("Client", clientSchema);

export default Client;
