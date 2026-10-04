import express from "express";
import {
  createExpense,
  getExpenseById,
  getExpenses,
  updateExpense,
  softDeleteExpense,
  restoreExpense,
  deleteExpense,
} from "../controllers/expense.controller.js";
import {
  protect,
  permissionGranted,
} from "../controllers/administrationPolicy.controller.js";

const router = express.Router();

router.post(
  "/expense",
  protect,
  permissionGranted("cashier", "admin", "manager", "owner"),
  createExpense
);
router.get(
  "/expense",
  protect,
  permissionGranted("cashier", "admin", "manager", "owner"),
  getExpenses
);
router.get(
  "/expense/:id",
  protect,
  permissionGranted("cashier", "admin", "manager", "owner"),
  getExpenseById
);
router.patch(
  "/expense/:id",
  protect,
  permissionGranted("owner", "manager"),
  updateExpense
);
router.patch(
  "/expense/:id/soft-delete",
  protect,
  permissionGranted("owner", "manager"),
  softDeleteExpense
);
router.patch(
  "/expense/:id/restore",
  protect,
  permissionGranted("owner", "manager"),
  restoreExpense
);
router.delete(
  "/expense/:id",
  protect,
  permissionGranted("owner", "manager"),
  deleteExpense
);
export default router;
