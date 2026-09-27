import { asyncErrorHandler } from "../utils/asyncErrorHandler.js";
import CustomError from "../utils/customError.js";
import ProjectToolAllocation from "../models/projectToolAllocation.model.js";
import ToolItem from "../models/toolItem.model.js";
import ToolTransaction from "../models/toolTransaction.model.js";
import mongoose from "mongoose";

// ─────────────────────────────────────────────
// GET all allocations for a project
// ─────────────────────────────────────────────
export const getAllocations = asyncErrorHandler(async (req, res, next) => {
  const { projectId } = req.params;

  const allocations = await ProjectToolAllocation.find({ projectId })
    .populate("toolId", "name category serialNumber totalQuantity description")
    .populate("addedBy", "name")
    .sort({ createdAt: -1 });

  // Project-level summary
  const summary = allocations.reduce(
    (acc, a) => {
      acc.totalAllocated += a.allocatedQty;
      acc.totalCheckedOut += a.checkedOutQty;
      acc.totalReturned += a.returnedQty;
      acc.totalDamaged += a.damagedQty;
      acc.totalLost += a.lostQty;
      return acc;
    },
    { totalAllocated: 0, totalCheckedOut: 0, totalReturned: 0, totalDamaged: 0, totalLost: 0 }
  );

  res.status(200).json({ success: true, data: allocations, summary });
});

// ─────────────────────────────────────────────
// ADD tool to project (allocate) — supports single or multiple
// ─────────────────────────────────────────────
export const addAllocation = asyncErrorHandler(async (req, res, next) => {
  const { projectId } = req.params;
  const { toolId, allocatedQty, notes, tools } = req.body;

  // Support batch insert if tools array is provided
  if (Array.isArray(tools) && tools.length > 0) {
    const createdAllocations = [];

    for (const item of tools) {
      if (!item.toolId || !item.allocatedQty || Number(item.allocatedQty) < 1) continue;

      const existing = await ProjectToolAllocation.findOne({ projectId, toolId: item.toolId });
      if (existing) {
        existing.allocatedQty += Number(item.allocatedQty);
        if (item.notes) existing.notes = item.notes.trim();
        await existing.save();
        createdAllocations.push(existing);
      } else {
        const created = await ProjectToolAllocation.create({
          projectId,
          toolId: item.toolId,
          allocatedQty: Number(item.allocatedQty),
          notes: item.notes?.trim() || "",
          addedBy: req.user._id,
        });
        createdAllocations.push(created);
      }
    }

    return res.status(201).json({
      success: true,
      message: `${createdAllocations.length} tool(s) allocated to project.`,
      data: createdAllocations,
    });
  }

  // Single tool fallback
  if (!toolId) return next(new CustomError(400, "Tool is required"));
  if (!allocatedQty || Number(allocatedQty) < 1)
    return next(new CustomError(400, "Allocated quantity must be at least 1"));

  const tool = await ToolItem.findOne({ _id: toolId, softDeleted: false });
  if (!tool) return next(new CustomError(404, "Tool not found"));

  // Check if already allocated — upsert style
  const existing = await ProjectToolAllocation.findOne({ projectId, toolId });
  if (existing) {
    existing.allocatedQty += Number(allocatedQty);
    if (notes) existing.notes = notes.trim();
    await existing.save();
    const populated = await ProjectToolAllocation.findById(existing._id).populate(
      "toolId",
      "name category serialNumber totalQuantity"
    );
    return res.status(200).json({ success: true, message: "Tool allocation updated.", data: populated });
  }

  const allocation = await ProjectToolAllocation.create({
    projectId,
    toolId,
    allocatedQty: Number(allocatedQty),
    notes: notes?.trim() || "",
    addedBy: req.user._id,
  });

  const populated = await ProjectToolAllocation.findById(allocation._id).populate(
    "toolId",
    "name category serialNumber totalQuantity"
  );

  res.status(201).json({ success: true, message: "Tool allocated to project.", data: populated });
});

// ─────────────────────────────────────────────
// UPDATE allocation qty / notes
// ─────────────────────────────────────────────
export const updateAllocation = asyncErrorHandler(async (req, res, next) => {
  const { allocationId } = req.params;
  const { allocatedQty, notes } = req.body;

  const allocation = await ProjectToolAllocation.findById(allocationId);
  if (!allocation) return next(new CustomError(404, "Allocation not found"));

  if (allocatedQty !== undefined) {
    if (Number(allocatedQty) < allocation.checkedOutQty) {
      return next(
        new CustomError(
          400,
          `Cannot reduce to ${allocatedQty} — ${allocation.checkedOutQty} units are currently checked out`
        )
      );
    }
    allocation.allocatedQty = Number(allocatedQty);
  }
  if (notes !== undefined) allocation.notes = notes.trim();

  await allocation.save();
  const populated = await ProjectToolAllocation.findById(allocationId).populate(
    "toolId",
    "name category serialNumber totalQuantity"
  );
  res.status(200).json({ success: true, message: "Allocation updated.", data: populated });
});

// ─────────────────────────────────────────────
// DELETE allocation (only if nothing checked out)
// ─────────────────────────────────────────────
export const deleteAllocation = asyncErrorHandler(async (req, res, next) => {
  const { allocationId } = req.params;

  const allocation = await ProjectToolAllocation.findById(allocationId);
  if (!allocation) return next(new CustomError(404, "Allocation not found"));

  if (allocation.checkedOutQty > 0) {
    return next(
      new CustomError(400, `Cannot delete — ${allocation.checkedOutQty} units are still checked out`)
    );
  }

  await allocation.deleteOne();
  res.status(200).json({ success: true, message: "Allocation removed." });
});

// ─────────────────────────────────────────────
// GET active checkouts for a project's allocation
// ─────────────────────────────────────────────
export const getAllocationTransactions = asyncErrorHandler(async (req, res, next) => {
  const { allocationId } = req.params;
  const { isReturned } = req.query;

  const filter = { allocationId };
  if (isReturned === "true") filter.returnedAt = { $ne: null };
  if (isReturned === "false") filter.returnedAt = null;

  const transactions = await ToolTransaction.find(filter)
    .populate("workerId", "name phone position")
    .populate("issuedBy", "name")
    .sort({ checkedOutAt: -1 });

  res.status(200).json({ success: true, data: transactions });
});
