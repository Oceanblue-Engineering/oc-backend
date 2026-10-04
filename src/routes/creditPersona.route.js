import { Router } from "express";
import {
  createCreditPerson,
  getAllCreditPersons,
  getCreditPersonById,
  updateCreditPerson,
} from "../controllers/creditPersona.controller.js";
import { protect } from "../controllers/administrationPolicy.controller.js";
import { permissionGranted } from "../controllers/administrationPolicy.controller.js";

const router = Router();

router.post(
  "/credit-persona",
  protect,
  permissionGranted("owner", "admin", "manager", "cashier"),
  createCreditPerson
);
router.get(
  "/credit-persona",
  protect,
  permissionGranted("owner", "admin", "manager", "cashier"),
  getAllCreditPersons
);
router.get(
  "/credit-persona/:id",
  protect,
  permissionGranted("owner", "admin", "manager", "cashier"),
  getCreditPersonById
);
router.patch(
  "/credit-persona/:id",
  protect,
  permissionGranted("owner", "manager"),
  updateCreditPerson
);
export default router;
