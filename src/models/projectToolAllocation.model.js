import mongoose from "mongoose";

const projectToolAllocationSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project reference is required"],
    },
    toolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ToolItem",
      required: [true, "Tool reference is required"],
    },
    allocatedQty: {
      type: Number,
      required: [true, "Allocated quantity is required"],
      min: [1, "Allocated quantity must be at least 1"],
    },
    // Live counters — updated on checkout / checkin
    checkedOutQty: { type: Number, default: 0 },
    returnedQty:   { type: Number, default: 0 },
    damagedQty:    { type: Number, default: 0 },
    lostQty:       { type: Number, default: 0 },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  {
    timestamps: true,
    id: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// One tool per project allocation record
projectToolAllocationSchema.index({ projectId: 1, toolId: 1 }, { unique: true });
projectToolAllocationSchema.index({ projectId: 1 });
projectToolAllocationSchema.index({ toolId: 1 });

const ProjectToolAllocation = mongoose.model(
  "ProjectToolAllocation",
  projectToolAllocationSchema
);
export default ProjectToolAllocation;
