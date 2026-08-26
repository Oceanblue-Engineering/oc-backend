import { asyncErrorHandler } from "../utils/asyncErrorHandler.js";
import CustomError from "../utils/customError.js";
import QuotationCategory from "../models/quotationCategory.model.js";

const DEFAULT_CATEGORIES = [
  { name: "Swimming Pool Shell", displayOrder: 1, isDefault: true },
  { name: "Tiling and Water Proofing", displayOrder: 2, isDefault: true },
  { name: "M & E", displayOrder: 3, isDefault: true },
  { name: "Filtration & Pump System", displayOrder: 4, isDefault: true },
  { name: "Decking & Landscaping", displayOrder: 5, isDefault: true },
  { name: "Chemicals & Water Treatment", displayOrder: 6, isDefault: true },
];

export const getQuotationCategories = asyncErrorHandler(
  async (req, res, next) => {
    let categories = await QuotationCategory.find().sort({
      displayOrder: 1,
      createdAt: 1,
    });

    // Auto-seed default categories if empty
    if (categories.length === 0) {
      await QuotationCategory.insertMany(DEFAULT_CATEGORIES);
      categories = await QuotationCategory.find().sort({
        displayOrder: 1,
        createdAt: 1,
      });
    }

    res.status(200).json({
      success: true,
      data: categories,
    });
  }
);

export const createQuotationCategory = asyncErrorHandler(
  async (req, res, next) => {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return next(new CustomError(400, "Category name is required"));
    }

    const trimmedName = name.trim();

    // Check if category already exists (case-insensitive)
    const existing = await QuotationCategory.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Category already exists",
        data: existing,
      });
    }

    const count = await QuotationCategory.countDocuments();
    const category = await QuotationCategory.create({
      name: trimmedName,
      description: description || "",
      displayOrder: count + 1,
      isDefault: false,
    });

    res.status(201).json({
      success: true,
      message: "Quotation category created successfully",
      data: category,
    });
  }
);

export const deleteQuotationCategory = asyncErrorHandler(
  async (req, res, next) => {
    const { id } = req.params;

    const category = await QuotationCategory.findByIdAndDelete(id);
    if (!category) {
      return next(new CustomError(404, "Category not found"));
    }

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  }
);
