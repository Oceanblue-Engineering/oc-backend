import mongoose from "mongoose";

const workerSchema = new mongoose.Schema(
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
    position: {
      type: String,
      trim: true,
      default: "",
    },
    dailyRate: {
      type: Number,
      default: 0,
    },
    telegramId: {
      type: String,
      trim: true,
      default: "",
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
  }
);

const Worker = mongoose.model("Worker", workerSchema);
export default Worker;
