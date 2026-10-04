import express from "express";
import {
  getProjectTasks,
  createProjectTask,
  updateProjectTask,
  deleteProjectTask,
} from "../controllers/projectTask.controller.js";
import { protect, permissionGranted } from "../controllers/administrationPolicy.controller.js";

const router = express.Router();

// GET all tasks for a project
router.get(
  "/projects/:projectId/tasks",
  protect,
  permissionGranted("owner", "admin", "manager", "cashier"),
  getProjectTasks
);

// CREATE a task for a project
router.post(
  "/projects/:projectId/tasks",
  protect,
  permissionGranted("owner", "admin", "manager", "cashier"),
  createProjectTask
);

// UPDATE a task
router.put(
  "/projects/tasks/:taskId",
  protect,
  permissionGranted("owner", "admin", "manager", "cashier"),
  updateProjectTask
);

// DELETE a task
router.delete(
  "/projects/tasks/:taskId",
  protect,
  permissionGranted("owner", "admin", "manager", "cashier"),
  deleteProjectTask
);

export default router;
