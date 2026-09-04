import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
        default: null,
      },
      name: {
        type: String,
        default: "System / Anonymous",
      },
      email: {
        type: String,
        default: "",
      },
      role: {
        type: String,
        default: "unknown",
      },
    },
    method: {
      type: String,
      required: true,
      enum: ["POST", "PUT", "PATCH", "DELETE"],
      uppercase: true,
    },
    endpoint: {
      type: String,
      required: true,
      trim: true,
    },
    module: {
      type: String,
      required: true,
      default: "General",
      trim: true,
    },
    action: {
      type: String,
      required: true,
      default: "Perform Action",
      trim: true,
    },
    statusCode: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED"],
      default: "SUCCESS",
    },
    requestBody: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    requestParams: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    requestQuery: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    ipAddress: {
      type: String,
      default: "",
    },
    userAgent: {
      type: String,
      default: "",
    },
    durationMs: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound and single-field indexes for optimal query performance
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ module: 1, createdAt: -1 });
activityLogSchema.index({ "user._id": 1, createdAt: -1 });
activityLogSchema.index({ method: 1, createdAt: -1 });
activityLogSchema.index({ status: 1, createdAt: -1 });

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);

export default ActivityLog;
