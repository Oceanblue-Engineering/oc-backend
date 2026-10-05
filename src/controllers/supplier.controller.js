import SupplierProfile from "../models/supplierProfile.model.js";
import Purchasing from "../models/purchasing.model.js";
import { asyncErrorHandler } from "../utils/asyncErrorHandler.js";
import CustomError from "../utils/customError.js";
import mongoose from "mongoose";

export const createSupplierProfile = asyncErrorHandler(
  async (req, res, next) => {
    const { supplierName, contactNumber, address, township } = req.body;

    if (!supplierName || !contactNumber) {
      return next(new CustomError(400, "All fields are required"));
    }

    const supplier = await SupplierProfile.create({
      supplierName,
      contactNumber,
      address: address || undefined,
      township: township || undefined,
    });

    res.status(201).json({
      success: true,
      message: "Supplier profile created successfully",
      data: supplier,
    });
  }
);

export const getAllSupplierProfiles = asyncErrorHandler(
  async (req, res, next) => {
    const {
      page,
      limit,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      includeDeleted = false,
      isDeleted,
    } = req.query;

    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;
    let query = {};

    // Handle isDeleted filter
    if (isDeleted !== undefined) {
      // If isDeleted is explicitly provided, use its boolean value
      query.isDeleted = isDeleted === "true" || isDeleted === true;
    } else if (!includeDeleted || includeDeleted === "false") {
      // If includeDeleted is false or not provided, default to non-deleted only
      query.isDeleted = false;
    }
    // If includeDeleted is true and isDeleted is not provided, don't filter by isDeleted (show all)

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { supplierName: searchRegex },
        { contactNumber: searchRegex },
        { township: searchRegex },
        { address: searchRegex },
      ];
    }

    let supplierQuery = SupplierProfile.find(query).sort(sort);

    // Only apply pagination if limit is explicitly provided and not 'all' or '0'
    const shouldPaginate =
      limit !== undefined &&
      limit !== null &&
      limit !== "all" &&
      limit !== "0" &&
      !isNaN(parseInt(limit));

    if (shouldPaginate) {
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;
      supplierQuery = supplierQuery.skip(skip).limit(limitNum);
    }

    const suppliers = await supplierQuery;
    const total = await SupplierProfile.countDocuments(query);

    res.status(200).json({
      success: true,
      message: "Supplier profiles retrieved successfully",
      data: suppliers,
      pagination: {
        totalItems: total,
        ...(shouldPaginate
          ? {
              currentPage: parseInt(page) || 1,
              totalPages: Math.ceil(total / parseInt(limit)),
              itemsPerPage: parseInt(limit),
            }
          : {
              currentPage: 1,
              totalPages: 1,
              itemsPerPage: total,
            }),
      },
    });
  }
);

export const getSupplierProfileById = asyncErrorHandler(
  async (req, res, next) => {
    const { id } = req.params;
    const supplier = await SupplierProfile.findById(id);
    if (!supplier) {
      return next(new CustomError(404, "Supplier profile not found"));
    }
    res.status(200).json({
      success: true,
      message: "Supplier profile retrieved successfully",
      data: supplier,
    });
  }
);

export const updateSupplierProfile = asyncErrorHandler(
  async (req, res, next) => {
    const { id } = req.params;
    const { supplierName, contactNumber, address, township } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new CustomError(400, "Invalid supplier profile ID format"));
    }

    const updateFields = {};
    if (supplierName !== undefined) updateFields.supplierName = supplierName;
    if (contactNumber !== undefined) updateFields.contactNumber = contactNumber;
    if (address !== undefined) updateFields.address = address;
    if (township !== undefined) updateFields.township = township;

    const supplier = await SupplierProfile.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );
    if (!supplier) {
      return next(new CustomError(404, "Supplier profile not found"));
    }
    res.status(200).json({
      success: true,
      message: "Supplier profile updated successfully",
      data: supplier,
    });
  }
);

export const softDeleteSupplierProfile = asyncErrorHandler(
  async (req, res, next) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new CustomError(400, "Invalid supplier profile ID format"));
    }
    const supplier = await SupplierProfile.findById(id);
    if (!supplier) {
      return next(new CustomError(404, "Supplier profile not found"));
    }
    if (supplier.isDeleted) {
      return next(
        new CustomError(400, "Supplier profile is already soft deleted")
      );
    }
    const softDeletedSupplier = await SupplierProfile.findByIdAndUpdate(
      id,
      { $set: { isDeleted: true, deletedAt: Date.now() } },
      { new: true, runValidators: true }
    );
    if (!softDeletedSupplier) {
      return next(new CustomError(404, "Supplier profile not found"));
    }
    res.status(200).json({
      success: true,
      message: "Supplier profile soft deleted successfully",
      data: softDeletedSupplier,
    });
  }
);

export const restoreSupplierProfile = asyncErrorHandler(
  async (req, res, next) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new CustomError(400, "Invalid supplier profile ID format"));
    }
    const supplier = await SupplierProfile.findById(id);
    if (!supplier) {
      return next(new CustomError(404, "Supplier profile not found"));
    }
    if (!supplier.isDeleted) {
      return next(new CustomError(400, "Supplier profile is not soft deleted"));
    }
    const restoredSupplier = await SupplierProfile.findByIdAndUpdate(
      id,
      { $set: { isDeleted: false, deletedAt: null } },
      { new: true, runValidators: true }
    );
    if (!restoredSupplier) {
      return next(new CustomError(404, "Supplier profile not found"));
    }
    res.status(200).json({
      success: true,
      message: "Supplier profile restored successfully",
      data: restoredSupplier,
    });
  }
);

export const deleteSupplierProfile = asyncErrorHandler(
  async (req, res, next) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new CustomError(400, "Invalid supplier profile ID format"));
    }
    const deletedSupplier = await SupplierProfile.findByIdAndDelete(id);
    if (!deletedSupplier) {
      return next(new CustomError(404, "Supplier profile not found"));
    }
    res.status(200).json({
      success: true,
      message: "Supplier profile deleted successfully",
      data: deletedSupplier,
    });
  }
);

export const getSupplierPurchasingStats = asyncErrorHandler(
  async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new CustomError(400, "Invalid supplier ID format"));
    }

    const supplier = await SupplierProfile.findById(id);
    if (!supplier) {
      return next(new CustomError(404, "Supplier profile not found"));
    }

    // Retrieve all non-deleted purchase orders for this supplier sorted by date descending
    const purchaseOrders = await Purchasing.find({
      supplierId: id,
      isDeleted: false,
    })
      .populate("purchasedBy", "name role")
      .sort({ createdAt: -1 });

    // Calculate purchasing statistics
    const totalPurchasedAmount = purchaseOrders.reduce(
      (sum, po) => sum + (po.totalAmount || 0),
      0
    );
    const totalPaidAmount = purchaseOrders.reduce(
      (sum, po) => sum + (po.paidAmount || 0),
      0
    );
    const totalDebt = totalPurchasedAmount - totalPaidAmount;

    res.status(200).json({
      success: true,
      message: "Supplier purchasing statistics retrieved successfully",
      data: {
        statistics: {
          totalPurchasedAmount,
          totalPaidAmount,
          totalDebt,
        },
        purchaseOrders,
      },
    });
  }
);
