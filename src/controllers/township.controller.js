import mongoose from "mongoose";
import Township from "../models/township.model.js";
import { asyncErrorHandler } from "../utils/asyncErrorHandler.js";
import CustomError from "../utils/customError.js";

// GET — fetch townships (default: active only)
export const getTownships = asyncErrorHandler(async (req, res, next) => {
  const { isActive } = req.query;

  const filter = { isDeleted: false };
  if (isActive !== undefined) {
    filter.isActive = isActive === "true";
  }

  const townships = await Township.find(filter).sort({ name: 1 });

  res.status(200).json({
    success: true,
    message: "Townships fetched successfully",
    data: { townships },
  });
});

// POST — create township
export const createTownship = asyncErrorHandler(async (req, res, next) => {
  const { name, deliveryFee, isActive } = req.body;

  if (!name) {
    return next(new CustomError(400, "Township name is required"));
  }
  if (deliveryFee === undefined || deliveryFee === null) {
    return next(new CustomError(400, "Delivery fee is required"));
  }

  const township = await Township.create({
    name,
    deliveryFee,
    isActive: isActive !== undefined ? isActive : true,
  });

  res.status(201).json({
    success: true,
    message: "Township created successfully",
    data: { township },
  });
});

// PATCH — update township
export const updateTownship = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError(400, "Invalid township ID format"));
  }

  const { name, deliveryFee, isActive } = req.body;

  const township = await Township.findByIdAndUpdate(
    id,
    { name, deliveryFee, isActive },
    { new: true, runValidators: true }
  );

  if (!township || township.isDeleted) {
    return next(new CustomError(404, "Township not found"));
  }

  res.status(200).json({
    success: true,
    message: "Township updated successfully",
    data: { township },
  });
});

// DELETE — soft disable township (isActive=false) + soft delete
export const deleteTownship = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError(400, "Invalid township ID format"));
  }

  const township = await Township.findById(id);
  if (!township || township.isDeleted) {
    return next(new CustomError(404, "Township not found"));
  }

  township.isDeleted = true;
  township.isActive = false;
  township.deletedAt = new Date();
  await township.save();

  res.status(200).json({
    success: true,
    message: "Township deleted successfully",
    data: { township },
  });
});