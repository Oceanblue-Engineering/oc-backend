import express from "express";
import {
  getQuotationCategories,
  createQuotationCategory,
  deleteQuotationCategory,
} from "../controllers/quotationCategory.controller.js";
import {
  protect,
  permissionGranted,
} from "../controllers/administrationPolicy.controller.js";

const router = express.Router();

router
  .route("/quotation-categories")
  .get(
    protect,
    permissionGranted("cashier", "admin", "owner", "manager", "store-manager"),
    getQuotationCategories
  )
  .post(
    protect,
    permissionGranted("admin", "owner", "manager", "store-manager"),
    createQuotationCategory
  );

router
  .route("/quotation-categories/:id")
  .delete(
    protect,
    permissionGranted("admin", "owner", "manager"),
    deleteQuotationCategory
  );

export default router;
