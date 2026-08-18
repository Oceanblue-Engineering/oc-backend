import mongoose from "mongoose";
import Project from "../models/project.model.js";
import Expense from "../models/expense.model.js";
import Attendance from "../models/attendance.model.js";
import Worker from "../models/worker.model.js";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import CustomError from "../utils/customError.js";

// GET /api/v1/projects/:id/expenses - ပရောဂျက်တစ်ခုချင်းစီ၏ ကုန်ကျစရိတ်များ
export const getProjectExpenses = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const { startDate, endDate, groupBy } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError(400, "Invalid project ID format"));
  }

  // Check if project exists and is not deleted
  const project = await Project.findOne({ _id: id, isDeleted: false });
  if (!project) {
    return next(new CustomError(404, "Project not found"));
  }

  // Build expense filter
  const filter = {
    projectId: id,
    softDeleted: false,
  };

  // Add date range filter if provided
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) {
      filter.date.$gte = new Date(startDate);
    }
    if (endDate) {
      filter.date.$lte = new Date(endDate);
    }
  }

  // Fetch expenses
  const expenses = await Expense.find(filter)
    .populate({
      path: "adminId",
      select: "name role",
    })
    .populate({
      path: "locationId",
      select: "locationName locationCode",
    })
    .select("-softDeleted -deletedAt")
    .sort({ date: -1 });

  // Calculate summary
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Group by category
  const byCategory = expenses.reduce((acc, exp) => {
    const category = exp.category || "other";
    acc[category] = (acc[category] || 0) + exp.amount;
    return acc;
  }, {});

  // Group by month if requested
  let monthlyTotals = [];
  if (groupBy === "month" || !groupBy) {
    const monthlyData = expenses.reduce((acc, exp) => {
      if (!exp.date) return acc;

      const dateObj = new Date(exp.date);
      const month = !isNaN(dateObj.getTime())
        ? dateObj.toISOString().substring(0, 7)
        : "";
      if (month) {
        acc[month] = (acc[month] || 0) + exp.amount;
      }
      return acc;
    }, {});

    monthlyTotals = Object.entries(monthlyData)
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => b.month.localeCompare(a.month));
  }

  res.status(200).json({
    success: true,
    message: "Project expenses fetched successfully",
    data: {
      expenses,
      summary: {
        totalExpenses,
        byCategory,
        monthlyTotals,
        expenseCount: expenses.length,
      },
    },
  });
});

// GET /api/v1/projects/:id/payroll-summary - ပရောဂျက်အလိုက် လုပ်ခအကျဉ်းချုပ်
export const getProjectPayrollSummary = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const { month } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError(400, "Invalid project ID format"));
  }

  // Check if project exists
  const project = await Project.findOne({ _id: id, isDeleted: false })
    .populate("workers", "name position dailyRate");

  if (!project) {
    return next(new CustomError(404, "Project not found"));
  }

  // Build attendance filter
  const filter = {
    projectId: id,
    isDeleted: false,
  };

  // Add month filter if provided
  if (month) {
    const [year, monthNum] = month.split("-").map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

    filter.date = {
      $gte: startDate,
      $lte: endDate,
    };
  }

  // Fetch attendance records
  const attendanceRecords = await Attendance.find(filter)
    .populate("workerId", "name position dailyRate")
    .select("workerId hoursWorked dailyWage date status");

  // Group by worker and calculate payroll
  const workerMap = new Map();
  let totalHoursWorked = 0;
  let totalPayroll = 0;

  attendanceRecords.forEach((record) => {
    if (!record.workerId) return;

    const workerId = record.workerId._id.toString();
    const worker = workerId in workerMap
      ? workerMap[workerId]
      : {
          _id: workerId,
          name: record.workerId.name,
          position: record.workerId.position || "General",
          dailyRate: record.workerId.dailyRate || 0,
          hoursWorked: 0,
          totalWage: 0,
          attendanceCount: 0,
        };

    const hours = record.hoursWorked || 8;
    const dailyRate = record.workerId.dailyRate || 0;
    const wage = hours * (dailyRate / 8);

    worker.hoursWorked += hours;
    worker.totalWage += wage;
    worker.attendanceCount += 1;

    workerMap[workerId] = worker;
    totalHoursWorked += hours;
    totalPayroll += wage;
  });

  const workers = Object.values(workerMap);

  // Group by position
  const byPosition = workers.reduce((acc, worker) => {
    const position = worker.position || "General";
    acc[position] = (acc[position] || 0) + worker.totalWage;
    return acc;
  }, {});

  // Calculate average daily rate
  const avgDailyRate = workers.length > 0
    ? workers.reduce((sum, worker) => sum + worker.dailyRate, 0) / workers.length
    : 0;

  res.status(200).json({
    success: true,
    message: "Payroll summary fetched successfully",
    data: {
      workers,
      summary: {
        totalWorkers: workers.length,
        totalHoursWorked,
        totalPayroll,
        avgDailyRate,
        byPosition,
        attendanceRecordCount: attendanceRecords.length,
      },
    },
  });
});

// GET /api/v1/projects/:id/financial-summary - ပရောဂျက်၏ ဘဏ္ဍာရေးအကျဉ်းချုပ်
export const getProjectFinancialSummary = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError(400, "Invalid project ID format"));
  }

  // Fetch project with populated workers
  const project = await Project.findOne({ _id: id, isDeleted: false })
    .populate("workers", "name position dailyRate");

  if (!project) {
    return next(new CustomError(404, "Project not found"));
  }

  // Get total expenses
  const expenseFilter = {
    projectId: id,
    softDeleted: false,
  };

  const expenses = await Expense.find(expenseFilter);
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Get payroll summary (reuse logic from payroll endpoint)
  const attendanceFilter = {
    projectId: id,
    isDeleted: false,
  };

  const attendanceRecords = await Attendance.find(attendanceFilter)
    .populate("workerId", "dailyRate");

  let totalPayroll = 0;
  attendanceRecords.forEach((record) => {
    if (!record.workerId) return;

    const hours = record.hoursWorked || 8;
    const dailyRate = record.workerId.dailyRate || 0;
    const wage = hours * (dailyRate / 8);
    totalPayroll += wage;
  });

  // Calculate timeline
  const timeline = { daysElapsed: 0, daysRemaining: 0, percentComplete: 0 };

  if (project.startDate && project.endDate) {
    const now = new Date();
    const start = new Date(project.startDate);
    const end = new Date(project.endDate);

    const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    const elapsedDays = Math.max(0, Math.ceil((now - start) / (1000 * 60 * 60 * 24)));
    const remainingDays = Math.max(0, totalDays - elapsedDays);

    timeline.daysElapsed = Math.min(elapsedDays, totalDays);
    timeline.daysRemaining = remainingDays;
    timeline.percentComplete = totalDays > 0
      ? Math.min(100, Math.round((elapsedDays / totalDays) * 100))
      : 0;
  }

  // Calculate financial metrics
  const totalCost = totalExpenses + totalPayroll;

  // For now, use a simple estimation formula (could be enhanced with project-specific revenue data)
  // estimatedRevenue = totalCost * 1.25 (25% profit margin as default)
  const estimatedRevenue = Math.round(totalCost * 1.25);
  const estimatedProfit = estimatedRevenue - totalCost;
  const profitMargin = totalCost > 0
    ? Math.round((estimatedProfit / totalCost) * 100)
    : 0;

  res.status(200).json({
    success: true,
    message: "Financial summary fetched successfully",
    data: {
      project: {
        _id: project._id,
        siteName: project.siteName,
        description: project.description,
        customer: project.customer,
        startDate: project.startDate,
        endDate: project.endDate,
        status: project.status,
        workers: project.workers,
      },
      financials: {
        totalExpenses,
        totalPayroll,
        totalCost,
        estimatedRevenue,
        estimatedProfit,
        profitMargin,
        expenseCount: expenses.length,
        attendanceCount: attendanceRecords.length,
      },
      timeline,
    },
  });
});