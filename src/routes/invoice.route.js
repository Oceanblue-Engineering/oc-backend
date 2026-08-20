import express from "express";
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  updateInvoiceStatus,
} from "../controllers/invoice.controller.js";
import {
  protect,
  permissionGranted,
} from "../controllers/administrationPolicy.controller.js";

const router = express.Router();

router.post(
  "/invoices",
  protect,
  permissionGranted("cashier", "admin", "owner"),
  createInvoice
);

router.get(
  "/invoices",
  protect,
  permissionGranted("cashier", "admin", "owner"),
  getInvoices
);

router.get(
  "/invoices/:id",
  protect,
  permissionGranted("cashier", "admin", "owner"),
  getInvoiceById
);

router.put(
  "/invoices/:id",
  protect,
  permissionGranted("cashier", "admin", "owner"),
  updateInvoice
);

router.patch(
  "/invoices/:id/status",
  protect,
  permissionGranted("cashier", "admin", "owner"),
  updateInvoiceStatus
);

router.delete(
  "/invoices/:id",
  protect,
  permissionGranted("admin", "owner"),
  deleteInvoice
);

export default router;
