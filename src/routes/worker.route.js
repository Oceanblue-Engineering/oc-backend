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
  permissionGranted("owner", "admin", "cashier"),
  createWorker
);
router.get(
  "/",
  protect,
  permissionGranted("owner", "admin", "cashier"),
  getAllWorkers
);
router.get(
  "/:id",
  protect,
  permissionGranted("owner", "admin", "cashier"),
  getWorkerById
);
router.patch(
  "/:id",
  protect,
  permissionGranted("owner", "admin", "cashier"),
  updateWorker
);
router.delete(
  "/:id",
  protect,
  permissionGranted("owner", "admin"),
  deleteWorker
);

export default router;
