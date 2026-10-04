import { Router } from "express";
import {
  createClient,
  getClients,
  getClientById,
  updateClient,
  addClientLog,
  deleteClient,
} from "../controllers/client.controller.js";
import { protect } from "../controllers/administrationPolicy.controller.js";
import { permissionGranted } from "../controllers/administrationPolicy.controller.js";

const router = Router();

router.post(
  "/clients",
  protect,
  permissionGranted("owner", "admin", "manager"),
  createClient
);
router.get(
  "/clients",
  protect,
  permissionGranted("owner", "admin", "manager"),
  getClients
);
router.get(
  "/clients/:id",
  protect,
  permissionGranted("owner", "admin", "manager"),
  getClientById
);
router.patch(
  "/clients/:id",
  protect,
  permissionGranted("owner", "admin", "manager"),
  updateClient
);
router.post(
  "/clients/:id/logs",
  protect,
  permissionGranted("owner", "admin", "manager"),
  addClientLog
);
router.patch(
  "/clients/:id/soft-delete",
  protect,
  permissionGranted("owner", "manager"),
  deleteClient
);

export default router;
