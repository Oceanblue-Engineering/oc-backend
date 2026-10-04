import express from "express";
import {
  createTool, getTools, getToolById, updateTool, deleteTool,
  searchTools, checkoutTool, checkinTool, getOverdueTools, getTransactions,
} from "../controllers/toolInventory.controller.js";
import {
  protect, permissionGranted,
} from "../controllers/administrationPolicy.controller.js";

const toolInventoryRouter = express.Router();
const ownerAdmin = permissionGranted("owner", "admin", "manager");

toolInventoryRouter.post("/tools", protect, ownerAdmin, createTool);
toolInventoryRouter.get("/tools/search", protect, ownerAdmin, searchTools);
toolInventoryRouter.get("/tools/overdue", protect, ownerAdmin, getOverdueTools);
toolInventoryRouter.get("/tools/transactions", protect, ownerAdmin, getTransactions);
toolInventoryRouter.get("/tools/:id", protect, ownerAdmin, getToolById);
toolInventoryRouter.get("/tools", protect, ownerAdmin, getTools);
toolInventoryRouter.put("/tools/:id", protect, ownerAdmin, updateTool);
toolInventoryRouter.delete("/tools/:id", protect, ownerAdmin, deleteTool);
toolInventoryRouter.post("/tools/checkout", protect, ownerAdmin, checkoutTool);
toolInventoryRouter.post("/tools/checkin", protect, ownerAdmin, checkinTool);

export default toolInventoryRouter;
