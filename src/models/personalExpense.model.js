import mongoose from "mongoose";

const personalExpenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount must be a positive number"],
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "kpay", "wavepay", "ayapay", "uabpay", "bank_transfer", "other"],
      default: "cash",
    },
    notes: {
      type: String,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
      default: "",
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: [true, "Owner admin ID is required"],
    },
    softDeleted: {
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for fast searching and filtering
personalExpenseSchema.index({ adminId: 1, date: -1 });
personalExpenseSchema.index({ category: 1 });
personalExpenseSchema.index({ softDeleted: 1 });

const PersonalExpense = mongoose.model("PersonalExpense", personalExpenseSchema);

export default PersonalExpense;
