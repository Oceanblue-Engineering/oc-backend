import Attendance from "../models/attendance.model.js";
import Worker from "../models/worker.model.js";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import CustomError from "../utils/customError.js";
import mongoose from "mongoose";

// Helper to normalize dates to midnight UTC to prevent time zone offset shifts
const normalizeToMidnightUTC = (dateStr) => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
};

export const getAttendance = asyncErrorHandler(async (req, res, next) => {
  const { projectId } = req.params;
  const { date } = req.query;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return next(new CustomError(400, "Invalid project ID format."));
  }

  if (!date) {
    return next(new CustomError(400, "Date query parameter is required."));
  }

  const queryDate = normalizeToMidnightUTC(date);
  if (!queryDate) {
    return next(new CustomError(400, "Invalid date format. Use YYYY-MM-DD."));
  }

  const records = await Attendance.find({
    projectId,
    date: queryDate,
  }).populate("userId", "name role position dailyRate");

  res.status(200).json({
    success: true,
    message: "Attendance records fetched successfully.",
    data: records,
  });
});

export const saveBulkAttendance = asyncErrorHandler(async (req, res, next) => {
  const { projectId } = req.params;
  const { date, records } = req.body;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return next(new CustomError(400, "Invalid project ID format."));
  }

  if (!date) {
    return next(new CustomError(400, "Date is required."));
  }

  const queryDate = normalizeToMidnightUTC(date);
  if (!queryDate) {
    return next(new CustomError(400, "Invalid date format."));
  }

  if (!Array.isArray(records) || records.length === 0) {
    return next(new CustomError(400, "Records must be a non-empty array."));
  }

  // Fetch workers to retrieve their base rates
  const userIds = records.map((r) => r.userId);
  const workers = await Worker.find({ _id: { $in: userIds } });
  const workerMap = new Map(workers.map((w) => [w._id.toString(), w]));

  const bulkOps = [];

  for (const record of records) {
    const { userId, status, shift = "day", overtimeWage = 0, notes = "" } = record;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return next(new CustomError(400, `Invalid user ID format: ${userId}`));
    }

    const worker = workerMap.get(userId.toString());
    if (!worker) {
      return next(new CustomError(404, `Worker not found: ${userId}`));
    }

    // Status Multipliers
    let statusMultiplier = 0;
    if (status === "present") statusMultiplier = 1.0;
    else if (status === "half_day") statusMultiplier = 0.5;
    else if (status === "absent" || status === "overtime_only") statusMultiplier = 0.0;

    const baseRate = worker.dailyRate || 0;
    const otWage = Number(overtimeWage) || 0;
    const dailyWageEarned = Math.round(baseRate * statusMultiplier + otWage);

    const updateDoc = {
      projectId,
      userId,
      date: queryDate,
      status,
      shift,
      overtimeWage: otWage,
      dailyWageEarned,
      notes,
    };

    bulkOps.push({
      updateOne: {
        filter: { projectId, userId, date: queryDate },
        update: { $set: updateDoc },
        upsert: true,
      },
    });
  }

  if (bulkOps.length > 0) {
    await Attendance.bulkWrite(bulkOps);
  }

  res.status(200).json({
    success: true,
    message: "Attendance records saved successfully.",
  });
});

export const getAttendanceSummary = asyncErrorHandler(async (req, res, next) => {
  const { projectId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return next(new CustomError(400, "Invalid project ID format."));
  }

  const summary = await Attendance.aggregate([
    { $match: { projectId: new mongoose.Types.ObjectId(projectId) } },
    {
      $group: {
        _id: "$userId",
        totalDaysPresent: {
          $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] },
        },
        totalHalfDays: {
          $sum: { $cond: [{ $eq: ["$status", "half_day"] }, 1, 0] },
        },
        totalDaysAbsent: {
          $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] },
        },
        totalOvertimeWage: { $sum: "$overtimeWage" },
        totalWageEarned: { $sum: "$dailyWageEarned" },
      },
    },
    {
      $lookup: {
        from: "workers",
        localField: "_id",
        foreignField: "_id",
        as: "workerInfo",
      },
    },
    { $unwind: "$workerInfo" },
    {
      $project: {
        _id: 1,
        workerName: "$workerInfo.name",
        role: "$workerInfo.role",
        position: "$workerInfo.position",
        dailyRate: "$workerInfo.dailyRate",
        totalDaysPresent: 1,
        totalHalfDays: 1,
        totalDaysAbsent: 1,
        totalOvertimeWage: 1,
        totalWageEarned: 1,
      },
    },
  ]);

  res.status(200).json({
    success: true,
    message: "Attendance summary generated successfully.",
    data: summary,
  });
});
