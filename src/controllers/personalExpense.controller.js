import { asyncErrorHandler } from "../utils/asyncErrorHandler.js";
import CustomError from "../utils/customError.js";
import PersonalExpense from "../models/personalExpense.model.js";
import mongoose from "mongoose";
import { createDateFilter } from "../utils/dateFilter.utils.js";
import moment from "moment-timezone";

const TIMEZONE = "Asia/Yangon";

export const createPersonalExpense = asyncErrorHandler(async (req, res, next) => {
  const { title, category, amount, date, paymentMethod, notes } = req.body;

  if (!title || !title.trim()) {
    return next(new CustomError(400, "Title is required"));
  }
  if (!category || !category.trim()) {
    return next(new CustomError(400, "Category is required"));
  }
  if (amount === undefined || amount === null || Number(amount) < 0) {
    return next(new CustomError(400, "Valid amount is required"));
  }

  const personalExpense = await PersonalExpense.create({
    title: title.trim(),
    category: category.trim(),
    amount: Number(amount),
    date: date ? new Date(date) : new Date(),
    paymentMethod: paymentMethod || "cash",
    notes: notes || "",
    adminId: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: "Personal expense created successfully.",
    data: personalExpense,
  });
});

export const getPersonalExpenses = asyncErrorHandler(async (req, res, next) => {
  const filter = {
    adminId: req.user._id,
    softDeleted: false,
  };

  const {
    category,
    search,
    page,
    limit,
    sortBy = "date",
    sortOrder = "desc",
  } = req.query;

  if (category && category !== "all") {
    filter.category = category;
  }

  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), "i");
    filter.$or = [{ title: searchRegex }, { notes: searchRegex }];
  }

  // Date filter
  try {
    const dateFilter = createDateFilter(req.query, "date", false);
    Object.assign(filter, dateFilter);
  } catch (error) {
    if (error instanceof CustomError) {
      return next(error);
    }
    return next(new CustomError(400, error.message || "Invalid date filter"));
  }

  const sort = {};
  sort[sortBy] = sortOrder === "asc" ? 1 : -1;

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const skip = (pageNum - 1) * limitNum;

  const totalItems = await PersonalExpense.countDocuments(filter);
  const expenses = await PersonalExpense.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limitNum)
    .populate({
      path: "adminId",
      select: "name role",
    });

  const totalPages = Math.ceil(totalItems / limitNum) || 1;

  res.status(200).json({
    success: true,
    message: "Personal expenses fetched successfully.",
    data: expenses,
    pagination: {
      currentPage: pageNum,
      totalPages,
      totalItems,
      limit: limitNum,
    },
  });
});

export const getPersonalExpenseSummary = asyncErrorHandler(async (req, res, next) => {
  const adminId = new mongoose.Types.ObjectId(req.user._id);

  const startOfMonth = moment().tz(TIMEZONE).startOf("month").toDate();
  const endOfMonth = moment().tz(TIMEZONE).endOf("month").toDate();

  const startOfWeek = moment().tz(TIMEZONE).startOf("isoWeek").toDate();
  const endOfWeek = moment().tz(TIMEZONE).endOf("isoWeek").toDate();

  // All active personal expenses for this owner
  const [allTimeStats, thisMonthStats, thisWeekStats, categoryStats] = await Promise.all([
    // All time
    PersonalExpense.aggregate([
      { $match: { adminId, softDeleted: false } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]),
    // This month
    PersonalExpense.aggregate([
      {
        $match: {
          adminId,
          softDeleted: false,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]),
    // This week
    PersonalExpense.aggregate([
      {
        $match: {
          adminId,
          softDeleted: false,
          date: { $gte: startOfWeek, $lte: endOfWeek },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]),
    // Category Breakdown (this month or all-time)
    PersonalExpense.aggregate([
      { $match: { adminId, softDeleted: false } },
      {
        $group: {
          _id: "$category",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]),
  ]);

  res.status(200).json({
    success: true,
    data: {
      allTime: {
        totalAmount: allTimeStats[0]?.totalAmount || 0,
        count: allTimeStats[0]?.count || 0,
      },
      thisMonth: {
        totalAmount: thisMonthStats[0]?.totalAmount || 0,
        count: thisMonthStats[0]?.count || 0,
      },
      thisWeek: {
        totalAmount: thisWeekStats[0]?.totalAmount || 0,
        count: thisWeekStats[0]?.count || 0,
      },
      categoryBreakdown: categoryStats.map((c) => ({
        category: c._id,
        totalAmount: c.totalAmount,
        count: c.count,
      })),
    },
  });
});

export const getPersonalExpenseById = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError(400, "Invalid personal expense ID"));
  }

  const expense = await PersonalExpense.findOne({
    _id: id,
    adminId: req.user._id,
    softDeleted: false,
  });

  if (!expense) {
    return next(new CustomError(404, "Personal expense not found"));
  }

  res.status(200).json({
    success: true,
    data: expense,
  });
});

export const updatePersonalExpense = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError(400, "Invalid personal expense ID"));
  }

  const { title, category, amount, date, paymentMethod, notes } = req.body;

  const expense = await PersonalExpense.findOne({
    _id: id,
    adminId: req.user._id,
    softDeleted: false,
  });

  if (!expense) {
    return next(new CustomError(404, "Personal expense not found"));
  }

  if (title !== undefined) expense.title = title.trim();
  if (category !== undefined) expense.category = category.trim();
  if (amount !== undefined) expense.amount = Number(amount);
  if (date !== undefined) expense.date = new Date(date);
  if (paymentMethod !== undefined) expense.paymentMethod = paymentMethod;
  if (notes !== undefined) expense.notes = notes;

  await expense.save();

  res.status(200).json({
    success: true,
    message: "Personal expense updated successfully.",
    data: expense,
  });
});

export const softDeletePersonalExpense = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError(400, "Invalid personal expense ID"));
  }

  const expense = await PersonalExpense.findOne({
    _id: id,
    adminId: req.user._id,
  });

  if (!expense) {
    return next(new CustomError(404, "Personal expense not found"));
  }

  expense.softDeleted = true;
  expense.deletedAt = new Date();
  await expense.save();

  res.status(200).json({
    success: true,
    message: "Personal expense deleted successfully.",
  });
});

export const deletePersonalExpense = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError(400, "Invalid personal expense ID"));
  }

  const expense = await PersonalExpense.findOneAndDelete({
    _id: id,
    adminId: req.user._id,
  });

  if (!expense) {
    return next(new CustomError(404, "Personal expense not found"));
  }

  res.status(200).json({
    success: true,
    message: "Personal expense permanently deleted successfully.",
  });
});
