import express from "express";
import { protect } from "../controllers/administrationPolicy.controller.js";
import { permissionGranted } from "../controllers/administrationPolicy.controller.js";
import {
  getProjectExpenses,
  getProjectPayrollSummary,
  getProjectFinancialSummary,
} from "../controllers/projectAnalytics.controller.js";

const router = express.Router();

// All routes require authentication and owner/admin/cashier roles
// Route prefix: /api/v1/projects/:id/...

// GET /api/v1/projects/:id/expenses - ပရောဂျက်တစ်ခုချင်းစီ၏ ကုန်ကျစရိတ်များ
router.get(
  "/projects/:id/expenses",
  protect,
  permissionGranted("owner", "admin", "cashier"),
  getProjectExpenses
);

// GET /api/v1/projects/:id/payroll-summary - ပရောဂျက်အလိုက် လုပ်ခအကျဉ်းချုပ်
router.get(
  "/projects/:id/payroll-summary",
  protect,
  permissionGranted("owner", "admin", "cashier"),
  getProjectPayrollSummary
);

// GET /api/v1/projects/:id/financial-summary - ပရောဂျက်၏ ဘဏ္ဍာရေးအကျဉ်းချုပ်
router.get(
  "/projects/:id/financial-summary",
  protect,
  permissionGranted("owner", "admin", "cashier"),
  getProjectFinancialSummary
);

export default router;