import { Router } from "express";
import {
  getTownships,
  createTownship,
  updateTownship,
  deleteTownship,
} from "../controllers/township.controller.js";
import { protect } from "../controllers/administrationPolicy.controller.js";
import { permissionGranted } from "../controllers/administrationPolicy.controller.js";

const router = Router();

router.get(
  "/townships",
  protect,
  permissionGranted("owner", "admin", "manager", "cashier"),
  getTownships
);
router.post(
  "/townships",
  protect,
  permissionGranted("owner", "admin", "manager"),
  createTownship
);
router.patch(
  "/townships/:id",
  protect,
  permissionGranted("owner", "admin", "manager"),
  updateTownship
);
router.delete(
  "/townships/:id",
  protect,
  permissionGranted("owner", "manager"),
  deleteTownship
);

export default router;