import mongoose from "mongoose";
import Purchasing from "../models/purchasing.model.js";
import Order from "../models/orders.model.js";
import Expense from "../models/expense.model.js";
import { asyncErrorHandler } from "../utils/asyncErrorHandler.js";
import CustomError from "../utils/customError.js";
import { createDateFilter } from "../utils/dateFilter.utils.js";

/**
 * Get comprehensive purchasing report including:
 * 1. Purchasing Summary (totalPurchasedAmount, paidAmount, remainingBalance, poCount)
 * 2. Product Quantities Breakdown (totalQtyPurchased, totalQtyReceived, item breakdown)
 * 3. Profit & Loss Analysis (Revenue vs Purchasing Cost vs Expenses vs Net Profit)
 * 4. Supplier Breakdown
 * 5. Recent Purchase Orders in period
 */
export const getPurchasingReport = asyncErrorHandler(async (req, res, next) => {
  const { supplierId, status } = req.query;

  // Build filter for Purchasing
  const purchaseFilter = {
    isDeleted: false,
  };

  if (status && status !== "ALL") {
    purchaseFilter.status = status.toLowerCase();
  }

  if (supplierId && mongoose.Types.ObjectId.isValid(supplierId)) {
    purchaseFilter.supplierId = new mongoose.Types.ObjectId(supplierId);
  }

  // Build date filter
  let parsedStartDate = null;
  let parsedEndDate = null;
  let dateQuery = {};

  try {
    const dateFilter = createDateFilter(req.query, "createdAt", false);
    if (dateFilter.createdAt) {
      purchaseFilter.createdAt = dateFilter.createdAt;
      dateQuery.createdAt = dateFilter.createdAt;
      if (dateFilter.createdAt.$gte) parsedStartDate = dateFilter.createdAt.$gte;
      if (dateFilter.createdAt.$lte) parsedEndDate = dateFilter.createdAt.$lte;
    }
  } catch (error) {
    if (error instanceof CustomError) {
      return next(error);
    }
    return next(new CustomError(400, error.message || "Invalid date filter"));
  }

  // 1. Purchasing Summary Aggregation
  const summaryAgg = await Purchasing.aggregate([
    { $match: purchaseFilter },
    {
      $group: {
        _id: null,
        totalPurchasedAmount: { $sum: "$totalAmount" },
        totalPaidAmount: { $sum: "$paidAmount" },
        totalPOCount: { $sum: 1 },
        pendingPOCount: {
          $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
        },
        confirmedPOCount: {
          $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] },
        },
        arrivedPOCount: {
          $sum: { $cond: [{ $eq: ["$status", "arrived"] }, 1, 0] },
        },
        completedPOCount: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
        },
      },
    },
  ]);

  const summary = summaryAgg[0] || {
    totalPurchasedAmount: 0,
    totalPaidAmount: 0,
    totalPOCount: 0,
    pendingPOCount: 0,
    confirmedPOCount: 0,
    arrivedPOCount: 0,
    completedPOCount: 0,
  };

  summary.totalRemainingBalance = Math.max(
    0,
    summary.totalPurchasedAmount - summary.totalPaidAmount
  );

  // 2. Product Quantities Breakdown
  const productAgg = await Purchasing.aggregate([
    { $match: purchaseFilter },
    { $unwind: "$products" },
    {
      $group: {
        _id: "$products.inventoryId",
        productName: { $first: "$products.productName" },
        productCode: { $first: "$products.productCode" },
        totalPurchaseQuantity: { $sum: "$products.purchaseQuantity" },
        totalReceivedQuantity: { $sum: "$products.receivedQuantity" },
        totalCost: {
          $sum: {
            $multiply: ["$products.buyingPrice", "$products.purchaseQuantity"],
          },
        },
        avgBuyingPrice: { $avg: "$products.buyingPrice" },
        poOccurrences: { $sum: 1 },
      },
    },
    { $sort: { totalCost: -1 } },
  ]);

  const totalOrderedQuantity = productAgg.reduce(
    (sum, p) => sum + (p.totalPurchaseQuantity || 0),
    0
  );
  const totalReceivedQuantity = productAgg.reduce(
    (sum, p) => sum + (p.totalReceivedQuantity || 0),
    0
  );
  const uniqueProductsCount = productAgg.length;

  // 3. Supplier-wise Breakdown
  const supplierAgg = await Purchasing.aggregate([
    { $match: purchaseFilter },
    {
      $lookup: {
        from: "supplierprofiles",
        localField: "supplierId",
        foreignField: "_id",
        as: "supplierInfo",
      },
    },
    {
      $group: {
        _id: "$supplierId",
        supplierName: {
          $first: {
            $ifNull: [
              { $arrayElemAt: ["$supplierInfo.supplierName", 0] },
              "Unknown Supplier",
            ],
          },
        },
        supplierPhone: {
          $first: { $arrayElemAt: ["$supplierInfo.supplierPhone", 0] },
        },
        poCount: { $sum: 1 },
        totalPurchased: { $sum: "$totalAmount" },
        totalPaid: { $sum: "$paidAmount" },
      },
    },
    {
      $project: {
        _id: 1,
        supplierName: 1,
        supplierPhone: 1,
        poCount: 1,
        totalPurchased: 1,
        totalPaid: 1,
        remainingBalance: {
          $max: [0, { $subtract: ["$totalPurchased", "$totalPaid"] }],
        },
      },
    },
    { $sort: { totalPurchased: -1 } },
  ]);

  // 4. Profit & Loss Analysis in the same date range
  const orderFilter = {
    isDeleted: false,
    orderStatus: "completed",
  };
  if (dateQuery.createdAt) {
    orderFilter.createdAt = dateQuery.createdAt;
  }

  const orderRevenueAgg = await Order.aggregate([
    { $match: orderFilter },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$finalAmount" },
        totalSubTotal: { $sum: "$subTotal" },
        totalTax: { $sum: "$tax" },
        totalDiscount: { $sum: "$discount" },
        orderCount: { $sum: 1 },
      },
    },
  ]);

  const orderStats = orderRevenueAgg[0] || {
    totalRevenue: 0,
    totalSubTotal: 0,
    totalTax: 0,
    totalDiscount: 0,
    orderCount: 0,
  };

  const expenseFilter = {
    isDeleted: false,
  };
  if (dateQuery.createdAt) {
    expenseFilter.createdAt = dateQuery.createdAt;
  }

  const expenseAgg = await Expense.aggregate([
    { $match: expenseFilter },
    {
      $group: {
        _id: null,
        totalExpenses: { $sum: "$amount" },
        expenseCount: { $sum: 1 },
      },
    },
  ]);

  const expenseStats = expenseAgg[0] || {
    totalExpenses: 0,
    expenseCount: 0,
  };

  const totalRevenue = orderStats.totalRevenue || 0;
  const totalPurchasingCost = summary.totalPurchasedAmount || 0;
  const totalExpenses = expenseStats.totalExpenses || 0;

  const grossProfit = totalRevenue - totalPurchasingCost;
  const netProfit = totalRevenue - (totalPurchasingCost + totalExpenses);
  const profitMargin =
    totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(2)) : 0;
  const grossMargin =
    totalRevenue > 0
      ? Number(((grossProfit / totalRevenue) * 100).toFixed(2))
      : 0;

  const profitLoss = {
    totalRevenue,
    totalPurchasingCost,
    totalExpenses,
    grossProfit,
    grossMargin,
    netProfit,
    profitMargin,
    status: netProfit >= 0 ? "PROFIT" : "LOSS",
    orderCount: orderStats.orderCount,
    expenseCount: expenseStats.expenseCount,
  };

  // 5. Recent Purchase Orders List
  const recentPurchases = await Purchasing.find(purchaseFilter)
    .populate("supplierId", "supplierName supplierPhone")
    .populate("purchasedBy", "name email role")
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();

  res.status(200).json({
    success: true,
    message: "Purchasing report retrieved successfully",
    data: {
      summary,
      productQuantities: {
        totalOrderedQuantity,
        totalReceivedQuantity,
        uniqueProductsCount,
        products: productAgg,
      },
      supplierBreakdown: supplierAgg,
      profitLoss,
      recentPurchases,
      filter: {
        startDate: parsedStartDate,
        endDate: parsedEndDate,
      },
    },
  });
});
