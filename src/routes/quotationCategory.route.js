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
    permissionGranted("cashier", "admin", "owner", "store-manager"),
    getQuotationCategories
  )
  .post(
    protect,
    permissionGranted("admin", "owner", "store-manager"),
    createQuotationCategory
  );

router
  .route("/quotation-categories/:id")
  .delete(
    protect,
    permissionGranted("admin", "owner"),
    deleteQuotationCategory
  );

export default router;
