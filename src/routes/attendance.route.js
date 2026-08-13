import express from "express";
import {
  getAttendance,
  saveBulkAttendance,
  getAttendanceSummary,
} from "../controllers/attendance.controller.js";
import { protect, permissionGranted } from "../controllers/administrationPolicy.controller.js";

const router = express.Router();

// Attendance management operations (restricted to owners and admins)
router.get(
  "/projects/:projectId/attendance",
  protect,
  permissionGranted("owner", "admin"),
  getAttendance
);

router.post(
  "/projects/:projectId/attendance/bulk",
  protect,
  permissionGranted("owner", "admin"),
  saveBulkAttendance
);

router.get(
  "/projects/:projectId/attendance/summary",
  protect,
  permissionGranted("owner", "admin"),
  getAttendanceSummary
);

export default router;
