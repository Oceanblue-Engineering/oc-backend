import ActivityLog from "../models/activityLog.model.js";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import CustomError from "../utils/customError.js";
import { createDateFilter } from "../utils/dateFilter.utils.js";
import mongoose from "mongoose";
import moment from "moment-timezone";

// Get paginated activity logs with filters & search
export const getActivityLogs = asyncErrorHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    search,
    module,
    method,
    status,
    userId,
    startDate,
    endDate,
  } = req.query;

  const query = {};

  // Module filter
  if (module && module !== "ALL") {
    query.module = module;
  }

  // Method filter (POST, PUT, PATCH, DELETE)
  if (method && method !== "ALL") {
    query.method = method.toUpperCase();
  }

  // Status filter (SUCCESS, FAILED)
  if (status && status !== "ALL") {
    query.status = status.toUpperCase();
  }

  // User filter
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    query["user._id"] = new mongoose.Types.ObjectId(userId);
  }

  // Date range filter
  if (startDate || endDate) {
    try {
      const dateFilter = createDateFilter(req.query, "createdAt", false);
      Object.assign(query, dateFilter);
    } catch (err) {
      console.warn("Date filter error:", err.message);
    }
  }

  // Search keyword (matches action, endpoint, user name, user email)
  if (search && search.trim()) {
    const term = search.trim();
    query.$or = [
      { action: { $regex: term, $options: "i" } },
      { endpoint: { $regex: term, $options: "i" } },
      { "user.name": { $regex: term, $options: "i" } },
      { "user.email": { $regex: term, $options: "i" } },
      { module: { $regex: term, $options: "i" } },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [logs, total] = await Promise.all([
    ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    ActivityLog.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    message: "Activity logs retrieved successfully",
    data: logs,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      totalItems: total,
      itemsPerPage: limitNum,
    },
  });
});

// Get summary statistics for activity logs
export const getActivityLogStats = asyncErrorHandler(async (req, res, next) => {
  const startOfToday = moment.tz("Asia/Yangon").startOf("day").toDate();
  const startOfWeek = moment.tz("Asia/Yangon").startOf("day").subtract(7, "days").toDate();

  const [
    totalLogs,
    logsToday,
    logsThisWeek,
    methodStats,
    statusStats,
    topUsers,
    moduleStats,
  ] = await Promise.all([
    ActivityLog.countDocuments(),
    ActivityLog.countDocuments({ createdAt: { $gte: startOfToday } }),
    ActivityLog.countDocuments({ createdAt: { $gte: startOfWeek } }),
    ActivityLog.aggregate([
      { $group: { _id: "$method", count: { $sum: 1 } } },
    ]),
    ActivityLog.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    ActivityLog.aggregate([
      { $match: { "user._id": { $ne: null } } },
      {
        $group: {
          _id: "$user._id",
          name: { $first: "$user.name" },
          role: { $first: "$user.role" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
    ActivityLog.aggregate([
      { $group: { _id: "$module", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
  ]);

  const methodBreakdown = {
    POST: 0,
    PUT: 0,
    PATCH: 0,
    DELETE: 0,
  };
  methodStats.forEach((m) => {
    if (m._id) methodBreakdown[m._id] = m.count;
  });

  const successfulLogs = statusStats.find((s) => s._id === "SUCCESS")?.count || 0;
  const failedLogs = statusStats.find((s) => s._id === "FAILED")?.count || 0;

  res.status(200).json({
    success: true,
    data: {
      totalLogs,
      logsToday,
      logsThisWeek,
      successfulLogs,
      failedLogs,
      methodBreakdown,
      topUsers,
      topModules: moduleStats,
    },
  });
});

// Get single activity log detail by ID
export const getActivityLogById = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError(400, "Invalid activity log ID format"));
  }

  const log = await ActivityLog.findById(id).lean();
  if (!log) {
    return next(new CustomError(404, "Activity log not found"));
  }

  res.status(200).json({
    success: true,
    data: log,
  });
});

// Delete old logs older than specified days (Owner only)
export const cleanupOldLogs = asyncErrorHandler(async (req, res, next) => {
  const { days = 90 } = req.body;
  const daysNum = Math.max(7, parseInt(days, 10) || 90);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysNum);

  const result = await ActivityLog.deleteMany({ createdAt: { $lt: cutoffDate } });

  res.status(200).json({
    success: true,
    message: `Successfully cleaned up ${result.deletedCount} logs older than ${daysNum} days`,
    deletedCount: result.deletedCount,
  });
});
