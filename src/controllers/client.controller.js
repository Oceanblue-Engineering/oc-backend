import mongoose from "mongoose";
import Client from "../models/client.model.js";
import AuditLog from "../models/auditLog.model.js";
import { asyncErrorHandler } from "../utils/asyncErrorHandler.js";
import CustomError from "../utils/customError.js";
import {
  updateClientStatus,
  createAudit,
} from "../services/client.service.js";

// CREATE — new inquiry (defaults to pre-sale + pipeline initial stage)
export const createClient = asyncErrorHandler(async (req, res, next) => {
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

  const client = await Client.create({
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
    isPostSale: false,
  });

  // Audit: CREATE
  await createAudit({
    entityId: client._id,
    action: "CREATE",
    details: { name, sourceChannel },
    user: req.user?.name || "system",
  });

  res.status(201).json({
    success: true,
    message: "Client inquiry created successfully",
    data: { client },
  });
});

// READ ALL — with isPostSale / status / search filters + pagination
export const getClients = asyncErrorHandler(async (req, res, next) => {
  const {
    isPostSale,
    status,
    leadType,
    search,
    page = 1,
    limit = 20,
  } = req.query;

  const filter = { isDeleted: false };

  if (isPostSale !== undefined) {
    filter.isPostSale = isPostSale === "true";
  }
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
  const [clients, total] = await Promise.all([
    Client.find(filter)
      .populate("creditPersonId", "name phone")
      .skip(skip)
      .limit(Number(limit))
      .sort({ updatedAt: -1 }),
    Client.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    message: "Clients fetched successfully",
    data: { clients },
    pagination: {
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      totalItems: total,
      itemsPerPage: Number(limit),
    },
  });
});

// READ ONE
export const getClientById = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError(400, "Invalid client ID format"));
  }

  const client = await Client.findOne({
    _id: id,
    isDeleted: false,
  }).populate("creditPersonId", "name phone address");

  if (!client) {
    return next(new CustomError(404, "Client not found"));
  }

  // Audit trail (newest first)
  const auditLogs = await AuditLog.find({ entityId: id })
    .sort({ createdAt: -1 })
    .select("action details user createdAt updatedAt");

  res.status(200).json({
    success: true,
    message: "Client fetched successfully",
    data: { client, auditLogs },
  });
});

// UPDATE — routes through service for lifecycle + POS credit sync
export const updateClient = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError(400, "Invalid client ID format"));
  }

  const client = await updateClientStatus(id, req.body, req.user?.name);

  res.status(200).json({
    success: true,
    message: "Client updated successfully",
    data: { client },
  });
});

// ADD CONVERSATION LOG — pushes a note into conversationLogs + audit LOG_ADDED
export const addClientLog = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const { text } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError(400, "Invalid client ID format"));
  }
  if (!text || !text.trim()) {
    return next(new CustomError(400, "Text is required"));
  }

  const client = await Client.findOne({ _id: id, isDeleted: false });
  if (!client) {
    return next(new CustomError(404, "Client not found"));
  }

  client.conversationLogs.push({
    text: text.trim(),
    date: new Date(),
  });
  await client.save();

  // Audit: LOG_ADDED
  await createAudit({
    entityId: client._id,
    action: "LOG_ADDED",
    details: { text: text.trim() },
    user: req.user?.name || "system",
  });

  res.status(200).json({
    success: true,
    message: "Conversation log added successfully",
    data: { client },
  });
});

// SOFT DELETE
export const deleteClient = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError(400, "Invalid client ID format"));
  }

  const client = await Client.findByIdAndUpdate(
    id,
    { isDeleted: true, deletedAt: new Date() },
    { new: true }
  );

  if (!client) {
    return next(new CustomError(404, "Client not found"));
  }

  res.status(200).json({
    success: true,
    message: "Client deleted successfully",
    data: { client },
  });
});