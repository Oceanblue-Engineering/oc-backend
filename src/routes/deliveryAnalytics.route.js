import { Router } from "express";
import { getDeliveryAnalyticsController } from "../controllers/deliveryAnalytics.controller.js";
import { protect } from "../controllers/administrationPolicy.controller.js";
import { permissionGranted } from "../controllers/administrationPolicy.controller.js";

const router = Router();

router.get(
  "/delivery-analytics",
  protect,
  permissionGranted("owner", "admin"),
  getDeliveryAnalyticsController
);

export default router;
