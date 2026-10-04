import express from "express";
import {
  createOrder,
  getOrders,
  getOrdersByStorefrontId,
  getAllOrders,
  updateOrderCreditPersonId,
  updateOrderPaidAmount,
  addOrderItems,
  removeOrderItems,
  hardDeleteOrder,
  updateOrderDeliveryStatus,
  updateEntireOrder,
} from "../controllers/order.controller.js";

const router = express.Router();
import { protect } from "../controllers/administrationPolicy.controller.js";
import { permissionGranted } from "../controllers/administrationPolicy.controller.js";

// Create new order
router.post(
  "/order",
  protect,
  permissionGranted("owner", "admin", "manager", "cashier"),
  createOrder
);
router.get(
  "/order",
  protect,
  permissionGranted("owner", "admin", "manager", "cashier"),
  getAllOrders
);
router.get(
  "/order/:orderId",
  protect,
  permissionGranted("owner", "admin", "manager", "cashier"),
  getOrders
);
router.get(
  "/order/storefront/:storefrontId",
  protect,
  permissionGranted("owner", "admin", "manager", "cashier"),
  getOrdersByStorefrontId
);

// Update/add credit person ID to an order
router.patch(
  "/order/:orderId/credit-person",
  protect,
  permissionGranted("owner", "admin", "manager", "cashier"),
  updateOrderCreditPersonId
);

// Update order paid amount
router.patch(
  "/order/:orderId/paid-amount",
  protect,
  permissionGranted("owner", "manager"),
  updateOrderPaidAmount
);

// Update order delivery status
router.patch(
  "/order/:orderId/delivery-status",
  protect,
  permissionGranted("owner", "admin", "manager"),
  updateOrderDeliveryStatus
);

// Add order items to existing order
router.patch(
  "/order/:orderId/items/add",
  protect,
  permissionGranted("owner", "manager"),
  addOrderItems
);

// Remove order items from existing order
router.patch(
  "/order/:orderId/items/remove",
  protect,
  permissionGranted("owner", "manager"),
  removeOrderItems
);

// Update entire order (POS-style edit)
router.patch(
  "/order/:orderId",
  protect,
  permissionGranted("owner", "admin", "manager", "cashier"),
  updateEntireOrder
);

// Hard delete order
router.delete(
  "/order/:orderId",
  protect,
  permissionGranted("owner", "manager"),
  hardDeleteOrder
);

export default router;
