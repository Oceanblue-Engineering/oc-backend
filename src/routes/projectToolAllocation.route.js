import express from "express";
import {
  getAllocations,
  addAllocation,
  updateAllocation,
  deleteAllocation,
  getAllocationTransactions,
} from "../controllers/projectToolAllocation.controller.js";
import {
  protect,
  permissionGranted,
} from "../controllers/administrationPolicy.controller.js";

const projectToolAllocationRouter = express.Router();
const ownerAdmin = permissionGranted("owner", "admin", "manager");

// Project-scoped allocation routes
projectToolAllocationRouter.get(
  "/projects/:projectId/tools",
  protect, ownerAdmin, getAllocations
);
projectToolAllocationRouter.post(
  "/projects/:projectId/tools",
  protect, ownerAdmin, addAllocation
);
projectToolAllocationRouter.put(
  "/projects/tools/:allocationId",
  protect, ownerAdmin, updateAllocation
);
projectToolAllocationRouter.delete(
  "/projects/tools/:allocationId",
  protect, ownerAdmin, deleteAllocation
);
projectToolAllocationRouter.get(
  "/projects/tools/:allocationId/transactions",
  protect, ownerAdmin, getAllocationTransactions
);

export default projectToolAllocationRouter;
