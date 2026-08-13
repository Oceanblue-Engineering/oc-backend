import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project ID is required"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worker",
      required: [true, "User (Worker) ID is required"],
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    status: {
      type: String,
      enum: ["present", "half_day", "absent", "overtime_only"],
      required: [true, "Status is required"],
    },
    shift: {
      type: String,
      enum: ["day", "night", "full_day"],
      default: "day",
    },
    overtimeWage: {
      type: Number,
      default: 0,
    },
    dailyWageEarned: {
      type: Number,
      required: [true, "Daily wage earned is required"],
      default: 0,
    },
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

// Compound unique index to enforce single entry per worker per project per day
attendanceSchema.index({ projectId: 1, userId: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;
