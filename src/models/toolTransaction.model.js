import mongoose from "mongoose";

const toolTransactionSchema = new mongoose.Schema(
  {
    toolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ToolItem",
      required: [true, "Tool reference is required"],
    },
    allocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectToolAllocation",
      required: [true, "Allocation reference is required"],
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worker",
      required: [true, "Worker reference is required"],
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project reference is required"],
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: [true, "IssuedBy (admin) reference is required"],
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
      default: 1,
    },
    checkedOutAt: {
      type: Date,
      default: () => new Date(),
    },
    expectedReturnAt: {
      type: Date,
      default: null,
    },
    returnedAt: {
      type: Date,
      default: null,
    },
    // On return breakdown (must sum to quantity)
    returnedQty: { type: Number, default: 0 },
    damagedQty:  { type: Number, default: 0 },
    lostQty:     { type: Number, default: 0 },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
    id: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

toolTransactionSchema.index({ toolId: 1, returnedAt: 1 });
toolTransactionSchema.index({ allocationId: 1 });
toolTransactionSchema.index({ workerId: 1 });
toolTransactionSchema.index({ projectId: 1 });
toolTransactionSchema.index({ expectedReturnAt: 1, returnedAt: 1 });
toolTransactionSchema.index({ checkedOutAt: -1 });

const ToolTransaction = mongoose.model("ToolTransaction", toolTransactionSchema);
export default ToolTransaction;
