import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: [true, "entityId is required"],
    },
    action: {
      type: String,
      required: [true, "action is required"],
      enum: ["CREATE", "UPDATE", "STATUS_CHANGE", "LOG_ADDED"],
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    user: {
      type: String,
      default: "system",
    },
  },
  {
    timestamps: true,
    id: false,
  }
);

// Fast lookup by entity, newest first
auditLogSchema.index({ entityId: 1, createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
