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
  const { status, search, page, limit } = req.query;

  const filter = { isDeleted: false };

  if (status) {
    filter.status = status;
  }
  if (search) {
    const regex = { $regex: search, $options: "i" };
    filter.$or = [{ siteName: regex }, { customer: regex }, { description: regex }];
  }

  // Determine pagination: if limit is '0' or 'all' or omitted without page, fetch all
  const hasExplicitLimit = limit !== undefined && limit !== null && limit !== "0" && limit !== "all";
  const shouldPaginate = hasExplicitLimit || page !== undefined;
  const limitNum = shouldPaginate ? Math.max(1, Number(limit) || 20) : 0;
  const pageNum = Math.max(1, Number(page) || 1);
  const skip = limitNum > 0 ? (pageNum - 1) * limitNum : 0;

  let queryChain = Project.find(filter).sort({ updatedAt: -1 });
  if (limitNum > 0) {
    queryChain = queryChain.skip(skip).limit(limitNum);
  }

  const [projects, total] = await Promise.all([
    queryChain,
    Project.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    message: "Projects fetched successfully",
    data: { clients: projects }, // Maintain similar enveloped name 'clients' to make it easy for table listings or rename as projects
    pagination: {
      currentPage: pageNum,
      totalPages: limitNum > 0 ? Math.ceil(total / limitNum) : 1,
      totalItems: total,
      itemsPerPage: limitNum > 0 ? limitNum : total,
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
