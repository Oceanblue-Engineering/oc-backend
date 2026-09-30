import mongoose from "mongoose";
import ProjectTask from "../models/projectTask.model.js";
import Project from "../models/project.model.js";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import CustomError from "../utils/customError.js";

// GET All Tasks for a Project
export const getProjectTasks = asyncErrorHandler(async (req, res, next) => {
  const { projectId } = req.params;
  const { category, search } = req.query;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return next(new CustomError(400, "Invalid Project ID"));
  }

  const filter = {
    projectId,
    isDeleted: false,
  };

  if (category && category !== "all") {
    filter.category = { $regex: new RegExp(`^${category}$`, "i") };
  }

  if (search && search.trim()) {
    const regex = { $regex: search.trim(), $options: "i" };
    filter.$or = [{ taskName: regex }, { remark: regex }, { category: regex }];
  }

  const tasks = await ProjectTask.find(filter)
    .populate("createdBy", "name role")
    .sort({ date: -1, createdAt: -1 });

  res.status(200).json({
    success: true,
    message: "Project tasks fetched successfully",
    data: { tasks },
  });
});

// CREATE Task for a Project
export const createProjectTask = asyncErrorHandler(async (req, res, next) => {
  const { projectId } = req.params;
  const { taskName, date, category, remark, status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return next(new CustomError(400, "Invalid Project ID"));
  }

  const projectExists = await Project.findOne({ _id: projectId, isDeleted: false });
  if (!projectExists) {
    return next(new CustomError(404, "Project not found"));
  }

  if (!taskName || !taskName.trim()) {
    return next(new CustomError(400, "Task name is required"));
  }

  if (!category || !category.trim()) {
    return next(new CustomError(400, "Category is required"));
  }

  if (!date) {
    return next(new CustomError(400, "Date is required"));
  }

  const task = await ProjectTask.create({
    projectId,
    taskName: taskName.trim(),
    date: new Date(date),
    category: category.trim(),
    remark: remark ? remark.trim() : "",
    status: status || "completed",
    createdBy: req.admin?._id || null,
  });

  const populatedTask = await ProjectTask.findById(task._id).populate(
    "createdBy",
    "name role"
  );

  res.status(201).json({
    success: true,
    message: "Project task created successfully",
    data: { task: populatedTask },
  });
});

// UPDATE Task
export const updateProjectTask = asyncErrorHandler(async (req, res, next) => {
  const { taskId } = req.params;
  const { taskName, date, category, remark, status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    return next(new CustomError(400, "Invalid Task ID"));
  }

  const task = await ProjectTask.findOne({ _id: taskId, isDeleted: false });
  if (!task) {
    return next(new CustomError(404, "Task not found"));
  }

  if (taskName !== undefined) task.taskName = taskName.trim();
  if (category !== undefined) task.category = category.trim();
  if (date !== undefined) task.date = new Date(date);
  if (remark !== undefined) task.remark = remark.trim();
  if (status !== undefined) task.status = status;

  await task.save();

  const populatedTask = await ProjectTask.findById(task._id).populate(
    "createdBy",
    "name role"
  );

  res.status(200).json({
    success: true,
    message: "Project task updated successfully",
    data: { task: populatedTask },
  });
});

// DELETE Task
export const deleteProjectTask = asyncErrorHandler(async (req, res, next) => {
  const { taskId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    return next(new CustomError(400, "Invalid Task ID"));
  }

  const task = await ProjectTask.findOne({ _id: taskId, isDeleted: false });
  if (!task) {
    return next(new CustomError(404, "Task not found"));
  }

  task.isDeleted = true;
  task.deletedAt = new Date();
  await task.save();

  res.status(200).json({
    success: true,
    message: "Project task deleted successfully",
  });
});
