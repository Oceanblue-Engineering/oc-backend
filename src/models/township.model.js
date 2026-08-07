import mongoose from "mongoose";

const townshipSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Township name is required"],
      unique: true,
      trim: true,
    },
    deliveryFee: {
      type: Number,
      required: [true, "Delivery fee is required"],
      min: [0, "Delivery fee cannot be negative"],
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
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

townshipSchema.index({ name: 1, isActive: 1 });

const Township = mongoose.model("Township", townshipSchema);

export default Township;