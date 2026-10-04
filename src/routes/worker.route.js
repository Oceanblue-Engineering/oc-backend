import { Router } from "express";
import {
  createWorker,
  getAllWorkers,
  getWorkerById,
  updateWorker,
  deleteWorker,
} from "../controllers/worker.controller.js";
import { protect } from "../controllers/administrationPolicy.controller.js";
import { permissionGranted } from "../controllers/administrationPolicy.controller.js";

const router = Router();

// Only owner, admin, cashier can CRUD workers
router.post(
  "/",
  protect,
  permissionGranted("owner", "admin", "manager", "cashier"),
  createWorker
);
router.get(
  "/",
  protect,
  permissionGranted("owner", "admin", "manager", "cashier"),
  getAllWorkers
);
router.get(
  "/:id",
  protect,
  permissionGranted("owner", "admin", "manager", "cashier"),
  getWorkerById
);
router.patch(
  "/:id",
  protect,
  permissionGranted("owner", "admin", "manager", "cashier"),
  updateWorker
);
router.delete(
  "/:id",
  protect,
  permissionGranted("owner", "admin", "manager"),
  deleteWorker
);

export default router;
