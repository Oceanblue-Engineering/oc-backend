import mongoose from "mongoose";

const toolItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tool name is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    serialNumber: {
      type: String,
      trim: true,
      default: "",
    },
    totalQuantity: {
      type: Number,
      required: [true, "Total quantity is required"],
      min: [1, "Quantity must be at least 1"],
      default: 1,
    },
    description: {
      type: String,
      trim: true,
      default: "",
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
    id: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

toolItemSchema.index({ name: "text" });
toolItemSchema.index({ category: 1 });
toolItemSchema.index({ softDeleted: 1 });

const ToolItem = mongoose.model("ToolItem", toolItemSchema);
export default ToolItem;
