import express from "express";
import {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  cancelMyOrder,
  updateOrderStatus,
} from "../controllers/order.controller.js";
import { protect, requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

// User
router.post("/", createOrder);
router.get("/mine", getMyOrders);
router.get("/:id", getOrderById);
router.put("/:id/cancel", cancelMyOrder);

// Admin
router.get("/", requireRole("admin"), getAllOrders);
router.put("/:id/status", requireRole("admin"), updateOrderStatus);

export default router;
