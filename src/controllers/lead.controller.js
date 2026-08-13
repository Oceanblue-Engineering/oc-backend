import mongoose from "mongoose";
import Lead from "../models/lead.model.js";
import AuditLog from "../models/auditLog.model.js";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import CustomError from "../utils/customError.js";
import {
  updateLeadStatusAndTransition,
  createAudit,
} from "../services/client.service.js";

// CREATE Lead
export const createLead = asyncErrorHandler(async (req, res, next) => {
  const {
    name,
    phone,
    address,
    email,
    companyName,
    businessName,
    industry,
    sourceChannel,
    currentProblems,
    desiredOutcome,
    inquiryDate,
    leadType = "sales",
  } = req.body;

  if (!name) {
    return next(new CustomError(400, "Name is required"));
  }

  if (!["sales", "service"].includes(leadType)) {
    return next(new CustomError(400, "leadType must be sales or service"));
  }

  const lead = await Lead.create({
    name,
    phone,
    address,
    email,
    companyName,
    businessName,
    industry,
    sourceChannel,
    currentProblems,
    desiredOutcome,
    inquiryDate,
    leadType,
    status: leadType === "service" ? "Service Inquiry" : "Sale Inquiry",
    isDeleted: false,
  });

  // Audit
  await createAudit({
    entityId: lead._id,
    action: "CREATE",
    details: { name, sourceChannel },
    user: req.user?.name || "system",
  });

  res.status(201).json({
    success: true,
    message: "Lead inquiry created successfully",
    data: { lead },
  });
});

// GET ALL Leads
export const getLeads = asyncErrorHandler(async (req, res, next) => {
  const { status, leadType, search, page = 1, limit = 20 } = req.query;

  const filter = { isDeleted: false };

  if (status) {
    filter.status = status;
  }
  if (leadType) {
    filter.leadType = leadType;
  }
  if (search) {
    const regex = { $regex: search, $options: "i" };
    filter.$or = [{ name: regex }, { companyName: regex }, { email: regex }];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [leads, total] = await Promise.all([
    Lead.find(filter)
      .skip(skip)
      .limit(Number(limit))
      .sort({ updatedAt: -1 }),
    Lead.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    message: "Leads fetched successfully",
    data: { clients: leads }, // Maintain same envelop key so frontend is easy to adapt
    pagination: {
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      totalItems: total,
      itemsPerPage: Number(limit),
    },
  });
});

// GET Lead By ID
export const getLeadById = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError(400, "Invalid Lead ID format"));
  }

  const lead = await Lead.findOne({ _id: id, isDeleted: false });
  if (!lead) {
    return next(new CustomError(404, "Lead not found"));
  }

  const auditLogs = await AuditLog.find({ entityId: id })
    .sort({ createdAt: -1 })
    .select("action details user createdAt updatedAt");

  res.status(200).json({
    success: true,
    message: "Lead fetched successfully",
    data: { client: lead, auditLogs }, // Keep same envelope key
  });
});

// UPDATE Lead
export const updateLead = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError(400, "Invalid Lead ID format"));
  }

  const transitionResult = await updateLeadStatusAndTransition(id, req.body, req.user?.name);

  res.status(200).json({
    success: true,
    message: "Lead updated successfully",
    data: {
      client: transitionResult.client || transitionResult.lead, // Send Client if converted, otherwise Lead
      converted: !!transitionResult.client,
    },
  });
});

// ADD CONVERSATION LOG
export const addLeadLog = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const { text } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError(400, "Invalid Lead ID format"));
  }
  if (!text || !text.trim()) {
    return next(new CustomError(400, "Text is required"));
  }

  const lead = await Lead.findOne({ _id: id, isDeleted: false });
  if (!lead) {
    return next(new CustomError(404, "Lead not found"));
  }

  lead.conversationLogs.push({
    text: text.trim(),
    date: new Date(),
  });
  await lead.save();

  // Audit
  await createAudit({
    entityId: lead._id,
    action: "LOG_ADDED",
    details: { text: text.trim() },
    user: req.user?.name || "system",
  });

  res.status(200).json({
    success: true,
    message: "Conversation log added successfully",
    data: { client: lead },
  });
});

// SOFT DELETE Lead
export const deleteLead = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError(400, "Invalid Lead ID format"));
  }

  const lead = await Lead.findByIdAndUpdate(
    id,
    { isDeleted: true, deletedAt: new Date() },
    { new: true }
  );

  if (!lead) {
    return next(new CustomError(404, "Lead not found"));
  }

  res.status(200).json({
    success: true,
    message: "Lead deleted successfully",
    data: { lead },
  });
});
