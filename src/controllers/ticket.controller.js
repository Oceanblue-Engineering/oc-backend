import mongoose from "mongoose";
import Ticket from "../models/ticket.model.js";
import TicketComment from "../models/ticketComment.model.js";
import TicketHistory from "../models/ticketHistory.model.js";
import Worker from "../models/worker.model.js";
import { asyncErrorHandler } from "../utils/asyncErrorHandler.js";
import CustomError from "../utils/customError.js";
import {
  recordTicketHistory,
  deleteTicketCascade,
} from "../services/ticket.service.js";
import {
  notifyTicketAssigned,
  notifyTicketComment,
} from "../services/telegram.service.js";

// GET /tickets — list with filters
export const getTickets = asyncErrorHandler(async (req, res, next) => {
  const { search, status, priority, assigned_to, type, page = 1, limit = 20 } = req.query;

  const filter = { isDeleted: false };
  if (status) filter.status = status;
  if (type) filter.type = type;
  if (priority) filter.priority = priority;
  if (assigned_to) filter.assigned_to = assigned_to;
  if (search) {
    const regex = { $regex: search, $options: "i" };
    filter.$or = [{ title: regex }, { description: regex }];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [tickets, total] = await Promise.all([
    Ticket.find(filter)
      .populate("assigned_to", "name")
      .populate("created_by", "name")
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 }),
    Ticket.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    message: "Tickets fetched successfully",
    data: { tickets },
    pagination: {
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      totalItems: total,
      itemsPerPage: Number(limit),
    },
  });
});

// POST /tickets — create
export const createTicket = asyncErrorHandler(async (req, res, next) => {
  const { title, description, priority, type, project_details, retail_details } =
    req.body;
  if (!title || !description) {
    return next(new CustomError(400, "Title and description are required"));
  }

  const ticket = await Ticket.create({
    title,
    description,
    priority: priority || "Medium",
    created_by: req.user._id,
    status: "Open",
    type: type || "Retail Sale",
    ...(type === "Project" && project_details ? { project_details } : {}),
    ...(type !== "Project" && retail_details ? { retail_details } : {}),
  });

  await recordTicketHistory(ticket._id, req.user._id, "Created ticket");

  res.status(201).json({
    success: true,
    message: "Ticket created successfully",
    data: { ticket },
  });
});

// GET /tickets/:id — detail with comments + history
export const getTicketById = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError(400, "Invalid ticket ID format"));
  }

  const ticket = await Ticket.findOne({ _id: id, isDeleted: false })
    .populate("assigned_to", "name")
    .populate("created_by", "name");

  if (!ticket) return next(new CustomError(404, "Ticket not found"));

  const [comments, history] = await Promise.all([
    TicketComment.find({ ticket_id: id })
      .populate("user_id", "name")
      .sort({ createdAt: 1 }),
    TicketHistory.find({ ticket_id: id })
      .populate("user_id", "name")
      .sort({ createdAt: -1 }),
  ]);

  res.status(200).json({
    success: true,
    message: "Ticket fetched successfully",
    data: { ticket, comments, history },
  });
});

// PATCH /tickets/:id/assign — assign + telegram notify
export const assignTicket = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const { assigned_to } = req.body;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError(400, "Invalid ticket ID format"));
  }

  let assignedModel = "Admin";
  if (assigned_to) {
    const isWorker = await Worker.exists({ _id: assigned_to });
    if (isWorker) {
      assignedModel = "Worker";
    }
  }

  const ticket = await Ticket.findByIdAndUpdate(
    id,
    { 
      assigned_to: assigned_to || null,
      assigned_model: assigned_to ? assignedModel : "Admin"
    },
    { new: true }
  );
  if (!ticket || ticket.isDeleted) return next(new CustomError(404, "Ticket not found"));

  await recordTicketHistory(id, req.user._id, `Assigned ticket${assigned_to ? "" : " (unassigned)"}`);
  await notifyTicketAssigned(id);

  res.status(200).json({
    success: true,
    message: "Ticket assigned successfully",
    data: { ticket },
  });
});

// PATCH /tickets/:id/status — update status
export const updateTicketStatus = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError(400, "Invalid ticket ID format"));
  }
  const allowed = ["Open", "In Progress", "Pending", "Resolved"];
  if (!allowed.includes(status)) {
    return next(new CustomError(400, "Invalid status"));
  }

  const ticket = await Ticket.findById(id);
  if (!ticket || ticket.isDeleted) return next(new CustomError(404, "Ticket not found"));

  const prev = ticket.status;
  ticket.status = status;
  await ticket.save();
  await recordTicketHistory(id, req.user._id, `Changed status from ${prev} to ${status}`);

  res.status(200).json({
    success: true,
    message: "Ticket status updated successfully",
    data: { ticket },
  });
});

// POST /tickets/:id/comments — add comment + telegram notify
export const addTicketComment = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  const { message } = req.body;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError(400, "Invalid ticket ID format"));
  }
  if (!message) return next(new CustomError(400, "Message is required"));

  const ticket = await Ticket.findOne({ _id: id, isDeleted: false });
  if (!ticket) return next(new CustomError(404, "Ticket not found"));

  const comment = await TicketComment.create({
    ticket_id: id,
    user_id: req.user._id,
    message,
  });
  await recordTicketHistory(id, req.user._id, "Added a comment");
  await notifyTicketComment({ ticketId: id, commenterUserId: String(req.user._id) });

  res.status(201).json({
    success: true,
    message: "Comment added successfully",
    data: { comment },
  });
});

// DELETE /tickets/:id — soft delete + cascade
export const deleteTicket = asyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new CustomError(400, "Invalid ticket ID format"));
  }

  const ticket = await Ticket.findOne({ _id: id, isDeleted: false });
  if (!ticket) return next(new CustomError(404, "Ticket not found"));

  await deleteTicketCascade(id);

  res.status(200).json({
    success: true,
    message: "Ticket deleted successfully",
    data: { ticket },
  });
});