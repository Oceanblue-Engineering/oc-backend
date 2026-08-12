import Admin from "../models/admin.model.js";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import CustomError from "../utils/customError.js";
import { signToken } from "../services/jwtToken.service.js";
import mongoose from "mongoose";

export const signup = asyncErrorHandler(async (req, res, next) => {
  const { name, password, confirmPassword, role, locationId, telegramChatId } =
    req.body;

  if (!name || !password || !confirmPassword) {
    return next(new CustomError(400, "Missing required fields for signup."));
  }

  if (password !== confirmPassword) {
    return next(new CustomError(400, "Passwords do not match."));
  }

  // Only store a Telegram chat id when a real value is provided; an empty
  // value must stay absent to avoid the partial unique-index collision.
  const telegramId = telegramChatId?.toString().trim();

  const admin = await Admin.create({
    name,
    password,
    confirmPassword,
    role,
    locationId,
    ...(telegramId ? { telegramChatId: telegramId } : {}),
  });

  res.status(200).json({
    success: true,
    message: "Admin created successfully.",
    data: {
      admin: {
        name: admin.name,
        role: admin.role,
      },
      token: signToken(admin._id, admin.role, admin.locationId),
    },
  });
});

export const login = asyncErrorHandler(async (req, res, next) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return next(new CustomError(400, "Missing required fields for login."));
  }

  const admin = await Admin.findOne({ name }).select("+password");

  if (!admin) {
    return next(new CustomError(400, "Invalid credentials."));
  }

  if (admin.softDeleted) {
    return next(new CustomError(401, "You can't login."));
  }

  const isPasswordCorrect = await admin.comparePasswordInDb(
    password,
    admin.password
  );

  if (!isPasswordCorrect) {
    return next(new CustomError(400, "Invalid Credentials."));
  }

  // Populate locationId if it exists
  if (admin.locationId) {
    await admin.populate(
      "locationId",
      "type locationName locationCode locationAddress"
    );
  }

  const token = signToken(admin._id, admin.role, admin.locationId);

  res.status(200).json({
    success: true,
    message: "Admin Dashboard.",
    data: {
      admin: {
        name: admin.name,
        role: admin.role,
        locationId: admin.locationId,
      },
      token,
    },
  });
});

export const updatePassword = asyncErrorHandler(async (req, res, next) => {
  const { accountId } = req.params;
  const { newPassword, confirmPassword } = req.body;

  if (!mongoose.Types.ObjectId.isValid(accountId)) {
    return next(new CustomError(400, "Invalid user ID format."));
  }

  if (!newPassword) {
    return next(new CustomError(400, "Please provide a new password."));
  }

  if (typeof newPassword !== "string" || newPassword.trim().length === 0) {
    return next(new CustomError(400, "New password cannot be empty."));
  }

  if (newPassword.length < 6) {
    return next(
      new CustomError(400, "New password must be at least 6 characters long.")
    );
  }

  if (confirmPassword && newPassword !== confirmPassword) {
    return next(
      new CustomError(400, "New password and confirm password do not match.")
    );
  }

  const admin = await Admin.findById(accountId);

  if (!admin) {
    return next(new CustomError(404, "User not found."));
  }

  if (admin.softDeleted) {
    return next(new CustomError(401, "User is deleted."));
  }

  admin.password = newPassword.trim();
  admin.updatedAt = Date.now();

  await admin.save({ validateBeforeSave: true });

  res.status(200).json({
    success: true,
    message: "Password updated successfully.",
    data: {
      accountId: admin._id,
      name: admin.name,
    },
  });
});

export const userSoftDelete = asyncErrorHandler(async (req, res, next) => {
  const { accountId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(accountId)) {
    return next(new CustomError(400, "Invalid user ID format."));
  }

  const admin = await Admin.findById(accountId);

  if (!admin) {
    return next(new CustomError(404, "User not found."));
  }

  admin.softDeleted = true;
  admin.deletedAt = Date.now();

  await admin.save({ validateBeforeSave: true });

  res.status(200).json({
    success: true,
    message: "User soft deleted successfully.",
    data: {
      accountId: admin._id,
      name: admin.name,
    },
  });
});

export const userRestore = asyncErrorHandler(async (req, res, next) => {
  const { accountId } = req.params;
  const admin = await Admin.findByIdAndUpdate(
    accountId,
    { softDeleted: false },
    { new: true }
  );
  if (!admin) {
    return next(new CustomError(404, "User not found."));
  }
  res.status(200).json({
    success: true,
    message: "User restored successfully.",
    data: {
      accountId: admin._id,
      name: admin.name,
    },
  });
});

export const userDelete = asyncErrorHandler(async (req, res, next) => {
  const { accountId } = req.params;
  const admin = await Admin.findByIdAndDelete(accountId);
  if (!admin) {
    return next(new CustomError(404, "User not found."));
  }
  res.status(200).json({
    success: true,
    message: "User deleted successfully.",
    data: {
      accountId: admin._id,
      name: admin.name,
    },
  });
});

export const getAllAccounts = asyncErrorHandler(async (req, res, next) => {
  const admin = await Admin.find()
    .select("-password")
    .populate("locationId", "type locationName locationCode locationAddress");

  res.status(200).json({
    success: true,
    message: "All users fetched successfully.",
    data: {
      accounts: admin,
    },
  });
});

export const getAccountById = asyncErrorHandler(async (req, res, next) => {
  const { accountId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(accountId)) {
    return next(new CustomError(400, "Invalid user ID format."));
  }

  const admin = await Admin.findById(accountId).populate(
    "locationId",
    "type locationName locationCode locationAddress"
  );

  if (!admin) {
    return next(new CustomError(404, "User not found."));
  }

  res.status(200).json({
    success: true,
    message: "User fetched successfully.",
    data: {
      accountId: admin._id,
      name: admin.name,
      role: admin.role,
      locationId: admin.locationId,
    },
  });
});

export const updateUser = asyncErrorHandler(async (req, res, next) => {
  const { accountId } = req.params;
  const { name, role, locationId, telegramChatId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(accountId)) {
    return next(new CustomError(400, "Invalid user ID format."));
  }

  const updateFields = {};
  if (name !== undefined) {
    updateFields.name = name;
  }
  if (role !== undefined) {
    updateFields.role = role;
  }
  if (locationId !== undefined) {
    updateFields.locationId = locationId;
  }

  // Telegram chat id: a real value sets the link, an empty value clears it
  // via $unset (never store "" — it would collide on the unique index).
  const unsetFields = {};
  if (telegramChatId !== undefined) {
    const telegramId = telegramChatId?.toString().trim();
    if (telegramId) {
      updateFields.telegramChatId = telegramId;
    } else {
      unsetFields.telegramChatId = 1;
    }
  }

  if (updateFields.softDeleted) {
    return next(new CustomError(401, "User is deleted."));
  }

  const updateQuery = { $set: updateFields };
  if (Object.keys(unsetFields).length > 0) {
    updateQuery.$unset = unsetFields;
  }

  const updatedUser = await Admin.findByIdAndUpdate(
    accountId,
    updateQuery,
    { new: true, runValidators: true }
  ).populate("locationId", "type locationName locationCode locationAddress");

  if (!updatedUser) {
    return next(new CustomError(404, "User not found."));
  }

  res.status(200).json({
    success: true,
    message: "User updated successfully.",
    data: updatedUser,
  });
});
