import { asyncErrorHandler } from "../utils/asyncErrorHandler.js";
import CustomError from "../utils/customError.js";
import ToolItem from "../models/toolItem.model.js";
import ToolTransaction from "../models/toolTransaction.model.js";
import ProjectToolAllocation from "../models/projectToolAllocation.model.js";
import mongoose from "mongoose";

// ─────────────────────────────────────────────
// TOOL CRUD
// ─────────────────────────────────────────────

export const createTool = asyncErrorHandler(async (req, res, next) => {
  const { name, category, serialNumber, totalQuantity, description } = req.body;
  if (!name?.trim()) return next(new CustomError(400, "Tool name is required"));
  if (!category?.trim()) return next(new CustomError(400, "Category is required"));
  if (!totalQuantity || Number(totalQuantity) < 1)
    return next(new CustomError(400, "Total quantity must be at least 1"));

  const tool = await ToolItem.create({
    name: name.trim(),
    category: category.trim(),
    serialNumber: serialNumber?.trim() || "",
    totalQuantity: Number(totalQuantity),
    description: description?.trim() || "",
  });
  res.status(201).json({ success: true, message: "Tool created successfully.", data: tool });
});

export const getTools = asyncErrorHandler(async (req, res, next) => {
  const { category, search, page = 1, limit = 50 } = req.query;
  const filter = { softDeleted: false };
  if (category) filter.category = { $regex: category, $options: "i" };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { serialNumber: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
    ];
  }
  const skip = (Number(page) - 1) * Number(limit);
  const [tools, total] = await Promise.all([
    ToolItem.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    ToolItem.countDocuments(filter),
  ]);
  res.status(200).json({
    success: true,
    data: tools,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
  });
});

export const getToolById = asyncErrorHandler(async (req, res, next) => {
  const tool = await ToolItem.findOne({ _id: req.params.id, softDeleted: false });
  if (!tool) return next(new CustomError(404, "Tool not found"));
  res.status(200).json({ success: true, data: tool });
});

export const updateTool = asyncErrorHandler(async (req, res, next) => {
  const { name, category, serialNumber, totalQuantity, description } = req.body;
  const tool = await ToolItem.findOne({ _id: req.params.id, softDeleted: false });
  if (!tool) return next(new CustomError(404, "Tool not found"));
  if (name) tool.name = name.trim();
  if (category) tool.category = category.trim();
  if (serialNumber !== undefined) tool.serialNumber = serialNumber.trim();
  if (totalQuantity !== undefined) tool.totalQuantity = Number(totalQuantity);
  if (description !== undefined) tool.description = description.trim();
  await tool.save();
  res.status(200).json({ success: true, message: "Tool updated.", data: tool });
});

export const deleteTool = asyncErrorHandler(async (req, res, next) => {
  const tool = await ToolItem.findOne({ _id: req.params.id, softDeleted: false });
  if (!tool) return next(new CustomError(404, "Tool not found"));

  // Check no active checkouts
  const activeCheckout = await ToolTransaction.findOne({ toolId: tool._id, returnedAt: null });
  if (activeCheckout) return next(new CustomError(400, "Cannot delete — tool has active checkouts"));

  tool.softDeleted = true;
  tool.deletedAt = new Date();
  await tool.save();
  res.status(200).json({ success: true, message: "Tool deleted." });
});

// ─────────────────────────────────────────────
// SEARCH (for checkout lookup)
// ─────────────────────────────────────────────
export const searchTools = asyncErrorHandler(async (req, res, next) => {
  const { q = "" } = req.query;
  const filter = { softDeleted: false };
  if (q.trim()) {
    filter.$or = [
      { name: { $regex: q.trim(), $options: "i" } },
      { serialNumber: { $regex: q.trim(), $options: "i" } },
      { category: { $regex: q.trim(), $options: "i" } },
    ];
  }
  const tools = await ToolItem.find(filter).sort({ name: 1 }).limit(100);
  res.status(200).json({ success: true, data: tools });
});

// ─────────────────────────────────────────────
// CHECK-OUT  (uses allocationId + qty)
// ─────────────────────────────────────────────
export const checkoutTool = asyncErrorHandler(async (req, res, next) => {
  const { allocationId, workerId, quantity = 1, expectedReturnAt } = req.body;
  if (!allocationId) return next(new CustomError(400, "Allocation is required"));
  if (!workerId) return next(new CustomError(400, "Worker is required"));
  const qty = Number(quantity);
  if (qty < 1) return next(new CustomError(400, "Quantity must be at least 1"));

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const allocation = await ProjectToolAllocation.findById(allocationId)
      .populate("toolId")
      .session(session);
    if (!allocation) {
      await session.abortTransaction();
      return next(new CustomError(404, "Allocation not found"));
    }

    const available = allocation.allocatedQty - allocation.checkedOutQty - allocation.returnedQty - allocation.damagedQty - allocation.lostQty;
    if (qty > available) {
      await session.abortTransaction();
      return next(new CustomError(400, `Only ${available} unit(s) available for checkout`));
    }

    const [transaction] = await ToolTransaction.create(
      [{
        toolId: allocation.toolId._id,
        allocationId: allocation._id,
        workerId,
        projectId: allocation.projectId,
        issuedBy: req.user._id,
        quantity: qty,
        checkedOutAt: new Date(),
        expectedReturnAt: expectedReturnAt ? new Date(expectedReturnAt) : null,
      }],
      { session }
    );

    allocation.checkedOutQty += qty;
    await allocation.save({ session });
    await session.commitTransaction();

    const populated = await ToolTransaction.findById(transaction._id)
      .populate("toolId", "name category")
      .populate("workerId", "name phone position")
      .populate("projectId", "siteName customer")
      .populate("issuedBy", "name");

    res.status(201).json({ success: true, message: "Tool checked out successfully.", data: populated });
  } catch (err) {
    await session.abortTransaction();
    return next(new CustomError(500, err.message || "Checkout failed"));
  } finally {
    session.endSession();
  }
});

// ─────────────────────────────────────────────
// CHECK-IN  (returnedQty + damagedQty + lostQty)
// ─────────────────────────────────────────────
export const checkinTool = asyncErrorHandler(async (req, res, next) => {
  const { transactionId, returnedQty = 0, damagedQty = 0, lostQty = 0, notes } = req.body;
  if (!transactionId) return next(new CustomError(400, "Transaction ID is required"));

  const rQty = Number(returnedQty);
  const dQty = Number(damagedQty);
  const lQty = Number(lostQty);
  const totalReturn = rQty + dQty + lQty;

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const transaction = await ToolTransaction.findById(transactionId).session(session);
    if (!transaction) {
      await session.abortTransaction();
      return next(new CustomError(404, "Transaction not found"));
    }
    if (transaction.returnedAt) {
      await session.abortTransaction();
      return next(new CustomError(400, "This transaction is already returned"));
    }
    if (totalReturn !== transaction.quantity) {
      await session.abortTransaction();
      return next(new CustomError(400, `Total (${totalReturn}) must equal checked-out quantity (${transaction.quantity})`));
    }

    transaction.returnedAt = new Date();
    transaction.returnedQty = rQty;
    transaction.damagedQty = dQty;
    transaction.lostQty = lQty;
    transaction.notes = notes?.trim() || "";
    await transaction.save({ session });

    // Update allocation counters
    const allocation = await ProjectToolAllocation.findById(transaction.allocationId).session(session);
    if (allocation) {
      allocation.checkedOutQty = Math.max(0, allocation.checkedOutQty - transaction.quantity);
      allocation.returnedQty += rQty;
      allocation.damagedQty += dQty;
      allocation.lostQty += lQty;
      await allocation.save({ session });
    }

    await session.commitTransaction();

    const populated = await ToolTransaction.findById(transaction._id)
      .populate("toolId", "name category")
      .populate("workerId", "name phone position")
      .populate("projectId", "siteName customer");

    res.status(200).json({ success: true, message: "Tool checked in successfully.", data: populated });
  } catch (err) {
    await session.abortTransaction();
    return next(new CustomError(500, err.message || "Checkin failed"));
  } finally {
    session.endSession();
  }
});

// ─────────────────────────────────────────────
// OVERDUE TOOLS
// ─────────────────────────────────────────────
export const getOverdueTools = asyncErrorHandler(async (req, res, next) => {
  const { projectId } = req.query;
  const filter = { expectedReturnAt: { $lt: new Date() }, returnedAt: null };
  if (projectId) filter.projectId = new mongoose.Types.ObjectId(projectId);

  const overdue = await ToolTransaction.find(filter)
    .populate("toolId", "name category")
    .populate("workerId", "name phone position")
    .populate("projectId", "siteName customer")
    .sort({ expectedReturnAt: 1 });

  res.status(200).json({ success: true, total: overdue.length, data: overdue });
});

// ─────────────────────────────────────────────
// TRANSACTION HISTORY
// ─────────────────────────────────────────────
export const getTransactions = asyncErrorHandler(async (req, res, next) => {
  const { projectId, workerId, toolId, allocationId, isReturned, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (projectId) filter.projectId = new mongoose.Types.ObjectId(projectId);
  if (workerId) filter.workerId = new mongoose.Types.ObjectId(workerId);
  if (toolId) filter.toolId = new mongoose.Types.ObjectId(toolId);
  if (allocationId) filter.allocationId = new mongoose.Types.ObjectId(allocationId);
  if (isReturned === "true") filter.returnedAt = { $ne: null };
  if (isReturned === "false") filter.returnedAt = null;

  const skip = (Number(page) - 1) * Number(limit);
  const [transactions, total] = await Promise.all([
    ToolTransaction.find(filter)
      .populate("toolId", "name category")
      .populate("workerId", "name phone position")
      .populate("projectId", "siteName customer")
      .populate("issuedBy", "name")
      .sort({ checkedOutAt: -1 })
      .skip(skip).limit(Number(limit)),
    ToolTransaction.countDocuments(filter),
  ]);
  res.status(200).json({
    success: true,
    data: transactions,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
  });
});
