import express from "express";
import {
  createPurchase,
  getAllPurchases,
  getPurchaseById,
  updatePurchase,
  updatePurchaseStatus,
  softDeletePurchase,
  restorePurchase,
} from "../controllers/purchase.controller.js";
import { getPurchasingReport } from "../controllers/purchasingReport.controller.js";
import {
  createSupplierPayment,
  getPaymentsByPurchaseId,
  getPaymentsBySupplierId,
  hardDeleteSupplierPayment,
} from "../controllers/supplierPayment.controller.js";
import {
  protect,
  permissionGranted,
} from "../controllers/administrationPolicy.controller.js";

const router = express.Router();

router.post(
  "/purchase",
  protect,
  permissionGranted("owner", "admin", "manager"),
  createPurchase
);
router.put(
  "/purchase/:id",
  protect,
  permissionGranted("owner", "admin", "manager"),
  updatePurchase
);
router.get(
  "/purchase",
  protect,
  permissionGranted("owner", "admin", "manager"),
  getAllPurchases
);
router.get(
  "/purchase/report",
  protect,
  permissionGranted("owner", "admin", "manager"),
  getPurchasingReport
);
router.get(
  "/purchasing/report",
  protect,
  permissionGranted("owner", "admin", "manager"),
  getPurchasingReport
);
router.get(
  "/purchase/:id",
  protect,
  permissionGranted("owner", "admin", "manager"),
  getPurchaseById
);
router.patch(
  "/purchase/:id/status",
  protect,
  permissionGranted("owner", "admin", "manager"),
  updatePurchaseStatus
);
router.patch(
  "/purchase/:id/soft-delete",
  protect,
  permissionGranted("owner", "manager"),
  softDeletePurchase
);
router.patch(
  "/purchase/:id/restore",
  protect,
  permissionGranted("owner", "manager"),
  restorePurchase
);

// Supplier Payment Routes
router.post(
  "/purchase/:id/payment",
  protect,
  permissionGranted("owner", "admin", "manager"),
  createSupplierPayment
);

router.get(
  "/purchase/:id/payments",
  protect,
  permissionGranted("owner", "admin", "manager"),
  getPaymentsByPurchaseId
);

router.get(
  "/supplier/:supplierId/payments",
  protect,
  permissionGranted("owner", "admin", "manager"),
  getPaymentsBySupplierId
);

router.delete(
  "/supplier-payment/:id",
  protect,
  permissionGranted("owner", "admin", "manager"),
  hardDeleteSupplierPayment
);

export default router;
