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
  permissionGranted("owner", "admin"),
  createClient
);
router.get(
  "/clients",
  protect,
  permissionGranted("owner", "admin"),
  getClients
);
router.get(
  "/clients/:id",
  protect,
  permissionGranted("owner", "admin"),
  getClientById
);
router.patch(
  "/clients/:id",
  protect,
  permissionGranted("owner", "admin"),
  updateClient
);
router.post(
  "/clients/:id/logs",
  protect,
  permissionGranted("owner", "admin"),
  addClientLog
);
router.patch(
  "/clients/:id/soft-delete",
  protect,
  permissionGranted("owner"),
  deleteClient
);

export default router;
