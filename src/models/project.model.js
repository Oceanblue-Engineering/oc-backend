import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    siteName: {
      type: String,
      required: [true, "Site name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    customer: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: {
        values: ["Signed", "In-Development", "Delivered", "Completed"],
        message: "Invalid project status",
      },
      default: "Signed",
    },
    workers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Worker",
      },
    ],
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

projectSchema.index({ siteName: 1, isDeleted: 1 });
projectSchema.index({ status: 1 });

const Project = mongoose.model("Project", projectSchema);

export default Project;
