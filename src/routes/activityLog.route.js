import express from "express";
import {
  getActivityLogs,
  getActivityLogStats,
  getActivityLogById,
  cleanupOldLogs,
} from "../controllers/activityLog.controller.js";
import { protect, permissionGranted } from "../controllers/administrationPolicy.controller.js";

const router = express.Router();

router.use(protect);
router.use(permissionGranted("owner", "admin"));

router.get("/activity-logs", getActivityLogs);
router.get("/activity-logs/stats", getActivityLogStats);
router.get("/activity-logs/:id", getActivityLogById);
router.delete("/activity-logs/cleanup", permissionGranted("owner"), cleanupOldLogs);

export default router;
