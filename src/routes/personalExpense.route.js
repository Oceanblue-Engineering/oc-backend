import express from "express";
import {
  createPersonalExpense,
  getPersonalExpenses,
  getPersonalExpenseSummary,
  getPersonalExpenseById,
  updatePersonalExpense,
  softDeletePersonalExpense,
  deletePersonalExpense,
} from "../controllers/personalExpense.controller.js";
import {
  protect,
  permissionGranted,
} from "../controllers/administrationPolicy.controller.js";

const router = express.Router();

// Strict Owner-Only Enforcement on all routes
router.use(protect);
router.use(permissionGranted("owner"));

router.post("/personal-expense", createPersonalExpense);
router.get("/personal-expense", getPersonalExpenses);
router.get("/personal-expense/summary", getPersonalExpenseSummary);
router.get("/personal-expense/:id", getPersonalExpenseById);
router.patch("/personal-expense/:id", updatePersonalExpense);
router.patch("/personal-expense/:id/soft-delete", softDeletePersonalExpense);
router.delete("/personal-expense/:id", deletePersonalExpense);

export default router;
