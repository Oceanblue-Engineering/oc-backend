import mongoose from "mongoose";

const projectTaskSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project ID is required"],
      index: true,
    },
    taskName: {
      type: String,
      required: [true, "Task name is required"],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      default: Date.now,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    remark: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["completed", "in-progress", "pending"],
      default: "completed",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

projectTaskSchema.index({ projectId: 1, date: -1 });
projectTaskSchema.index({ projectId: 1, category: 1 });

const ProjectTask = mongoose.model("ProjectTask", projectTaskSchema);

export default ProjectTask;
