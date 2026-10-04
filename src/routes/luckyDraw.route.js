import express from "express";

import {
  createPromotion,
  getPromotions,
  getPromotion,
  updatePromotion,
  deletePromotion,
  processRedemption,
  getRedemptions,
} from "../controllers/luckyDraw.controller.js";
import { protect } from "../controllers/administrationPolicy.controller.js";
import { permissionGranted } from "../controllers/administrationPolicy.controller.js";

const router = express.Router();

// ─── Promotion Routes ──────────────────────────────────────────

router.post("/lucky-draw/promotions", protect, permissionGranted("owner", "manager"), createPromotion);
router.get("/lucky-draw/promotions", protect, permissionGranted("owner", "admin", "manager", "cashier"), getPromotions);
router.get("/lucky-draw/promotions/:id", protect, permissionGranted("owner", "admin", "manager", "cashier"), getPromotion);
router.patch("/lucky-draw/promotions/:id", protect, permissionGranted("owner", "manager"), updatePromotion);
router.delete("/lucky-draw/promotions/:id", protect, permissionGranted("owner", "manager"), deletePromotion);

// ─── Redemption Routes ─────────────────────────────────────────

router.post("/lucky-draw/redemptions", protect, permissionGranted("cashier", "admin", "manager", "owner"), processRedemption);
router.get("/lucky-draw/redemptions", protect, permissionGranted("owner", "admin", "manager", "cashier"), getRedemptions);

export default router;
