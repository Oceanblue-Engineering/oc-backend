import { asyncErrorHandler } from "../utils/asyncErrorHandler.js";
import CustomError from "../utils/customError.js";
import Invoice from "../models/invoice.model.js";
import mongoose from "mongoose";

export const createInvoice = asyncErrorHandler(async (req, res, next) => {
  const {
    invoiceNo,
    quotationNo,
    invoiceDate,
    paymentTerms,
    validityTerms,
    paymentMethod,
    paymentReceivedDate,
    billTo,
    items,
    subTotal,
    discountOrTaxLabel,
    discountOrTaxAmount,
    totalAmount,
    remarks,
    currency,
    status,
    preparedBy,
    orderId,
    projectId,
    storefrontId,
  } = req.body;

  if (!invoiceNo) {
    return next(new CustomError(400, "Invoice Number is required"));
  }
  if (!billTo || !billTo.name) {
    return next(new CustomError(400, "Customer Name is required"));
  }

  const existing = await Invoice.findOne({ invoiceNo, softDeleted: false });
  if (existing) {
    return next(
      new CustomError(400, `Invoice Number ${invoiceNo} already exists`)
    );
  }

  const adminId = req.user?._id || null;

  const invoice = await Invoice.create({
    invoiceNo,
    quotationNo: quotationNo || invoiceNo.replace(/^OB-/, "OB-Q-"),
    invoiceDate: invoiceDate || new Date(),
    paymentTerms: paymentTerms || "50% Advance, 50% on Completion",
    validityTerms: validityTerms || "Valid for 14 Days",
    paymentMethod: paymentMethod || "KBZ Pay",
    paymentReceivedDate:
      status === "paid"
        ? paymentReceivedDate || new Date()
        : paymentReceivedDate || null,
    billTo,
    items: items || [],
    subTotal: subTotal || 0,
    discountOrTaxLabel: discountOrTaxLabel || "Discount / Tax (%)",
    discountOrTaxAmount: discountOrTaxAmount || 0,
    totalAmount: totalAmount || 0,
    remarks: remarks || [],
    currency: currency || "MMK",
    status: status || "issued",
    preparedBy: preparedBy || "Prepared By: Ocean Blue",
    orderId:
      orderId && mongoose.Types.ObjectId.isValid(orderId) ? orderId : null,
    projectId:
      projectId && mongoose.Types.ObjectId.isValid(projectId)
        ? projectId
        : null,
    adminId,
    storefrontId:
      storefrontId && mongoose.Types.ObjectId.isValid(storefrontId)
        ? storefrontId
        : null,
  });

  res.status(201).json({
    success: true,
    message: "Invoice created successfully",
    data: invoice,
  });
});

export const getInvoices = asyncErrorHandler(async (req, res, next) => {
  const {
    search,
    status,
    startDate,
    endDate,
    projectId,
    page = 1,
    limit = 50,
  } = req.query;

  const filter = { softDeleted: false };

  if (projectId) {
    if (mongoose.Types.ObjectId.isValid(projectId)) {
      filter.projectId = new mongoose.Types.ObjectId(projectId);
    } else {
      filter.projectId = projectId;
    }
  }

  if (status && status !== "all") {
    filter.status = status;
  }

  if (search) {
    const searchRegex = new RegExp(search, "i");
    filter.$or = [
      { invoiceNo: searchRegex },
      { quotationNo: searchRegex },
      { "billTo.name": searchRegex },
      { "billTo.company": searchRegex },
      { "billTo.phone": searchRegex },
    ];
  }

  if (startDate || endDate) {
    filter.invoiceDate = {};
    if (startDate) {
      filter.invoiceDate.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.invoiceDate.$lte = end;
    }
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [invoices, total] = await Promise.all([
    Invoice.find(filter)
      .sort({ invoiceDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Invoice.countDocuments(filter),
  ]);

  // Aggregate stats
  const statsMatch = { softDeleted: false };
  if (projectId) {
    if (mongoose.Types.ObjectId.isValid(projectId)) {
      statsMatch.projectId = new mongoose.Types.ObjectId(projectId);
    } else {
      statsMatch.projectId = projectId;
    }
  }

  const statsAggregation = await Invoice.aggregate([
    { $match: statsMatch },
    {
      $group: {
        _id: null,
        totalInvoicedAmount: { $sum: "$totalAmount" },
        paidAmount: {
          $sum: {
            $cond: [{ $eq: ["$status", "paid"] }, "$totalAmount", 0],
          },
        },
        totalCount: { $sum: 1 },
        paidCount: {
          $sum: {
            $cond: [{ $eq: ["$status", "paid"] }, 1, 0],
          },
        },
        issuedCount: {
          $sum: {
            $cond: [{ $eq: ["$status", "issued"] }, 1, 0],
          },
        },
      },
    },
  ]);

  const stats = statsAggregation[0] || {
    totalInvoicedAmount: 0,
    paidAmount: 0,
    totalCount: 0,
    paidCount: 0,
    issuedCount: 0,
  };

  res.status(200).json({
    success: true,
    data: invoices,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    },
    stats,
  });
});

export const getInvoiceById = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError(400, "Invalid invoice ID format"));
  }

  const invoice = await Invoice.findOne({ _id: id, softDeleted: false });
  if (!invoice) {
    return next(new CustomError(404, "Invoice not found"));
  }

  res.status(200).json({
    success: true,
    data: invoice,
  });
});

export const updateInvoice = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError(400, "Invalid invoice ID format"));
  }

  const updateData = { ...req.body };
  if (updateData.status === "paid" && !updateData.paymentReceivedDate) {
    updateData.paymentReceivedDate = new Date();
  }

  const invoice = await Invoice.findOneAndUpdate(
    { _id: id, softDeleted: false },
    updateData,
    { new: true, runValidators: true }
  );

  if (!invoice) {
    return next(new CustomError(404, "Invoice not found"));
  }

  res.status(200).json({
    success: true,
    message: "Invoice updated successfully",
    data: invoice,
  });
});

export const deleteInvoice = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError(400, "Invalid invoice ID format"));
  }

  const invoice = await Invoice.findOneAndUpdate(
    { _id: id, softDeleted: false },
    { softDeleted: true },
    { new: true }
  );

  if (!invoice) {
    return next(new CustomError(404, "Invoice not found"));
  }

  res.status(200).json({
    success: true,
    message: "Invoice deleted successfully",
  });
});

export const updateInvoiceStatus = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status, paymentReceivedDate, paymentMethod } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError(400, "Invalid invoice ID format"));
  }

  if (!["draft", "issued", "paid", "cancelled"].includes(status)) {
    return next(new CustomError(400, "Invalid status"));
  }

  const updateFields = { status };
  if (status === "paid") {
    updateFields.paymentReceivedDate = paymentReceivedDate || new Date();
  }
  if (paymentMethod) {
    updateFields.paymentMethod = paymentMethod;
  }

  const invoice = await Invoice.findOneAndUpdate(
    { _id: id, softDeleted: false },
    updateFields,
    { new: true }
  );

  if (!invoice) {
    return next(new CustomError(404, "Invoice not found"));
  }

  res.status(200).json({
    success: true,
    message: `Invoice status updated to ${status}`,
    data: invoice,
  });
});
