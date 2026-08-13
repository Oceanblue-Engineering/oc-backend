import express from "express";
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from "../controllers/project.controller.js";
import { protect } from "../controllers/administrationPolicy.controller.js";

const router = express.Router();

router.post("/projects", protect, createProject);
router.get("/projects", protect, getProjects);
router.get("/projects/:id", protect, getProjectById);
router.patch("/projects/:id", protect, updateProject);
router.delete("/projects/:id", protect, deleteProject);

export default router;
