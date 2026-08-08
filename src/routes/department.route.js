import { Router } from "express";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../controllers/department.controller.js";
import { protect } from "../controllers/administrationPolicy.controller.js";
import { permissionGranted } from "../controllers/administrationPolicy.controller.js";

const router = Router();

router.get("/departments", protect, getDepartments);
router.post(
  "/departments",
  protect,
  permissionGranted("owner", "admin"),
  createDepartment
);
router.patch(
  "/departments/:id",
  protect,
  permissionGranted("owner", "admin"),
  updateDepartment
);
router.delete(
  "/departments/:id",
  protect,
  permissionGranted("owner", "admin"),
  deleteDepartment
);

export default router;