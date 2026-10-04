import express from "express";
import {
  createOrUpdateShopSetting,
  uploadShopLogo,
  getCurrentShopSettings,
  deleteShopLogo,
  getAllShopSettings,
  updateCronTime,
  upload,
} from "../controllers/shopSetting.controller.js";
import { protect } from "../controllers/administrationPolicy.controller.js";
import { permissionGranted } from "../controllers/administrationPolicy.controller.js";

const router = express.Router();

// Create or update shop settings
router.post(
  "/shop-settings",
  protect,
  permissionGranted("owner", "admin", "manager"),
  createOrUpdateShopSetting
);

// Upload shop logo
router.post(
  "/shop-settings/logo",
  protect,
  permissionGranted("owner", "admin", "manager"),
  upload.single("logo"),
  uploadShopLogo
);

// Get current shop settings
router.get(
  "/shop-settings",
  getCurrentShopSettings
);

// Delete shop logo
router.delete(
  "/shop-settings/logo",
  protect,
  permissionGranted("owner", "admin", "manager"),
  deleteShopLogo
);

// Get all shop settings history (for audit trail)
router.get(
  "/shop-settings/history",
  protect,
  permissionGranted("owner", "admin", "manager"),
  getAllShopSettings
);

// Update cron schedule time
router.put(
  "/shop-settings/cron-time",
  protect,
  permissionGranted("owner", "admin", "manager"),
  updateCronTime
);

export default router;
