import express from "express";
import {
  createSupplierProfile,
  getAllSupplierProfiles,
  getSupplierProfileById,
  updateSupplierProfile,
  softDeleteSupplierProfile,
  restoreSupplierProfile,
  deleteSupplierProfile,
  getSupplierPurchasingStats,
} from "../controllers/supplier.controller.js";
import { protect } from "../controllers/administrationPolicy.controller.js";
import { permissionGranted } from "../controllers/administrationPolicy.controller.js";
const router = express.Router();

router.post(
  "/supplier-profile",
  protect,
  permissionGranted("owner", "admin", "manager"),
  createSupplierProfile
);
router.get(
  "/supplier-profile",
  protect,
  permissionGranted("owner", "admin", "manager"),
  getAllSupplierProfiles
);
router.get(
  "/supplier-profile/:id",
  protect,
  permissionGranted("owner", "admin", "manager"),
  getSupplierProfileById
);
router.get(
  "/supplier/:id/purchasing-stats",
  protect,
  permissionGranted("owner", "admin", "manager"),
  getSupplierPurchasingStats
);
router.get(
  "/supplier-profile/:id/purchasing-stats",
  protect,
  permissionGranted("owner", "admin", "manager"),
  getSupplierPurchasingStats
);
router.patch(
  "/supplier-profile/:id",
  protect,
  permissionGranted("owner", "manager"),
  updateSupplierProfile
);
router.patch(
  "/supplier-profile/:id/soft-delete",
  protect,
  permissionGranted("owner", "manager"),
  softDeleteSupplierProfile
);
router.patch(
  "/supplier-profile/:id/restore",
  protect,
  permissionGranted("owner", "manager"),
  restoreSupplierProfile
);
router.delete(
  "/supplier-profile/:id",
  protect,
  permissionGranted("owner", "manager"),
  deleteSupplierProfile
);
export default router;
