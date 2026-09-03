import CreditPerson from "../models/creditPersona.model.js";
import { asyncErrorHandler } from "../utils/asyncErrorHandler.js";
import CustomError from "../utils/customError.js";
import mongoose from "mongoose";

export const createCreditPerson = asyncErrorHandler(async (req, res, next) => {
  const { name, phone, address, blacklist, blacklistReason } = req.body;

  if (!name || !phone) {
    return next(new CustomError(400, "Name and phone are required"));
  }

  const creditPerson = await CreditPerson.create({
    name,
    phone,
    address,
    blacklist: Boolean(blacklist),
    blacklistDate: blacklist ? new Date() : null,
    blacklistReason: blacklist ? (blacklistReason || "Manual blacklist") : null,
  });
  res.status(201).json({
    success: true,
    message: "Credit person created successfully",
    data: creditPerson,
  });
});

export const getAllCreditPersons = asyncErrorHandler(async (req, res, next) => {
  const creditPersons = await CreditPerson.find();
  res.status(200).json({
    success: true,
    message: "Credit persons fetched successfully",
    data: creditPersons,
  });
});

export const getCreditPersonById = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const creditPerson = await CreditPerson.findById(id);
  res.status(200).json({
    success: true,
    message: "Credit person fetched successfully",
    data: creditPerson,
  });
});

export const updateCreditPerson = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name, phone, address, blacklist, blacklistReason } = req.body;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError(400, "Invalid credit person ID format"));
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (phone !== undefined) updateData.phone = phone;
  if (address !== undefined) updateData.address = address;

  if (blacklist !== undefined) {
    updateData.blacklist = Boolean(blacklist);
    if (blacklist) {
      updateData.blacklistDate = new Date();
      updateData.blacklistReason = blacklistReason || "Manual blacklist";
    } else {
      updateData.blacklistDate = null;
      updateData.blacklistReason = null;
    }
  } else if (blacklistReason !== undefined) {
    updateData.blacklistReason = blacklistReason;
  }

  const creditPerson = await CreditPerson.findByIdAndUpdate(
    id,
    updateData,
    { new: true }
  );
  if (!creditPerson) {
    return next(new CustomError(404, "Credit person not found"));
  }
  res.status(200).json({
    success: true,
    message: "Credit person updated successfully",
    data: creditPerson,
  });
});
