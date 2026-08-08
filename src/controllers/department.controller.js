import mongoose from "mongoose";
import Department from "../models/department.model.js";
import { asyncErrorHandler } from "../utils/asyncErrorHandler.js";
import CustomError from "../utils/customError.js";

// GET /departments
export const getDepartments = asyncErrorHandler(async (req, res, next) => {
  const departments = await Department.find({ isDeleted: false }).sort({
    name: 1,
  });
  res.status(200).json({
    success: true,
    message: "Departments fetched successfully",
    data: { departments },
  });
});

// POST /departments
export const createDepartment = asyncErrorHandler(async (req, res, next) => {
  const { name } = req.body;
  if (!name) return next(new CustomError(400, "Department name is required"));

  const department = await Department.create({ name });
  res.status(201).json({
    success: true,
    message: "Department created successfully",
    data: { department },
  });
});

// PATCH /departments/:id
export const updateDepartment = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError(400, "Invalid department ID format"));
  }

  const department = await Department.findByIdAndUpdate(
    id,
    { name },
    { new: true, runValidators: true }
  );
  if (!department || department.isDeleted) {
    return next(new CustomError(404, "Department not found"));
  }

  res.status(200).json({
    success: true,
    message: "Department updated successfully",
    data: { department },
  });
});

// DELETE /departments/:id (soft)
export const deleteDepartment = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError(400, "Invalid department ID format"));
  }

  const department = await Department.findByIdAndUpdate(
    id,
    { isDeleted: true, deletedAt: new Date() },
    { new: true }
  );
  if (!department) return next(new CustomError(404, "Department not found"));

  res.status(200).json({
    success: true,
    message: "Department deleted successfully",
    data: { department },
  });
});