import Worker from "../models/worker.model.js";
import { asyncErrorHandler } from "../utils/asyncErrorHandler.js";
import CustomError from "../utils/customError.js";
import mongoose from "mongoose";

// CREATE Worker
export const createWorker = asyncErrorHandler(async (req, res, next) => {
  const { name, phone, position, dailyRate, telegramId } = req.body;

  if (!name) {
    return next(new CustomError(400, "Name is required"));
  }

  const worker = await Worker.create({
    name,
    phone,
    position,
    dailyRate,
    telegramId,
  });

  res.status(201).json({
    success: true,
    message: "Worker created successfully",
    data: { worker },
  });
});

// READ ALL Workers
export const getAllWorkers = asyncErrorHandler(async (req, res, next) => {
  const workers = await Worker.find({ isDeleted: false }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: "Workers fetched successfully",
    data: { workers },
  });
});

// READ ONE Worker
export const getWorkerById = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError(400, "Invalid worker ID format"));
  }

  const worker = await Worker.findOne({ _id: id, isDeleted: false });
  if (!worker) {
    return next(new CustomError(404, "Worker not found"));
  }

  res.status(200).json({
    success: true,
    message: "Worker fetched successfully",
    data: { worker },
  });
});

// UPDATE Worker
export const updateWorker = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError(400, "Invalid worker ID format"));
  }

  const worker = await Worker.findOneAndUpdate(
    { _id: id, isDeleted: false },
    req.body,
    { new: true, runValidators: true }
  );

  if (!worker) {
    return next(new CustomError(404, "Worker not found"));
  }

  res.status(200).json({
    success: true,
    message: "Worker updated successfully",
    data: { worker },
  });
});

// DELETE Worker (Soft Delete)
export const deleteWorker = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError(400, "Invalid worker ID format"));
  }

  const worker = await Worker.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true, deletedAt: new Date() },
    { new: true }
  );

  if (!worker) {
    return next(new CustomError(404, "Worker not found"));
  }

  res.status(200).json({
    success: true,
    message: "Worker deleted successfully",
    data: null,
  });
});
