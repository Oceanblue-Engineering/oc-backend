import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
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
          "Sale Inquiry",
          "Product Explain",
          "Sent Quotation",
          "Purchased",
          "Service Inquiry",
          "Service Explain",
          "Meeting Made",
          "Sent Contract",
          "Follow-up",
          "Ghost",
          "Converted",
        ],
        message: "Invalid lead status",
      },
      default: "Sale Inquiry",
    },
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

// Indexes
leadSchema.index({ name: 1, isDeleted: 1 });
leadSchema.index({ status: 1, leadType: 1 });

const Lead = mongoose.model("Lead", leadSchema);

export default Lead;
