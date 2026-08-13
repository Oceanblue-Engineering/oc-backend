import mongoose from "mongoose";
import Project from "../models/project.model.js";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import CustomError from "../utils/customError.js";

// CREATE Project
export const createProject = asyncErrorHandler(async (req, res, next) => {
  const { siteName, description, customer, startDate, endDate, status } = req.body;

  if (!siteName) {
    return next(new CustomError(400, "Site name is required"));
  }
  if (!customer) {
    return next(new CustomError(400, "Customer name is required"));
  }

  const project = await Project.create({
    siteName,
    description,
    customer,
    startDate,
    endDate,
    status,
    isDeleted: false,
  });

  res.status(201).json({
    success: true,
    message: "Project created successfully",
    data: { project },
  });
});

// READ ALL Projects
export const getProjects = asyncErrorHandler(async (req, res, next) => {
  const { status, search, page = 1, limit = 20 } = req.query;

  const filter = { isDeleted: false };

  if (status) {
    filter.status = status;
  }
  if (search) {
    const regex = { $regex: search, $options: "i" };
    filter.$or = [{ siteName: regex }, { customer: regex }, { description: regex }];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [projects, total] = await Promise.all([
    Project.find(filter)
      .skip(skip)
      .limit(Number(limit))
      .sort({ updatedAt: -1 }),
    Project.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    message: "Projects fetched successfully",
    data: { clients: projects }, // Maintain similar enveloped name 'clients' to make it easy for table listings or rename as projects
    pagination: {
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      totalItems: total,
      itemsPerPage: Number(limit),
    },
  });
});

// READ ONE Project
export const getProjectById = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError(400, "Invalid project ID format"));
  }

  const project = await Project.findOne({ _id: id, isDeleted: false }).populate("workers", "name phone role position dailyRate");
  if (!project) {
    return next(new CustomError(404, "Project not found"));
  }

  res.status(200).json({
    success: true,
    message: "Project fetched successfully",
    data: { client: project }, // keeps envelope key client/project
  });
});

// UPDATE Project
export const updateProject = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError(400, "Invalid project ID format"));
  }

  const project = await Project.findOneAndUpdate(
    { _id: id, isDeleted: false },
    req.body,
    { new: true, runValidators: true }
  ).populate("workers", "name phone role position dailyRate");

  if (!project) {
    return next(new CustomError(404, "Project not found"));
  }

  res.status(200).json({
    success: true,
    message: "Project updated successfully",
    data: { client: project },
  });
});

// DELETE Project (Soft Delete)
export const deleteProject = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError(400, "Invalid project ID format"));
  }

  const project = await Project.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true, deletedAt: new Date() },
    { new: true }
  );

  if (!project) {
    return next(new CustomError(404, "Project not found"));
  }

  res.status(200).json({
    success: true,
    message: "Project deleted successfully",
    data: { project },
  });
});
