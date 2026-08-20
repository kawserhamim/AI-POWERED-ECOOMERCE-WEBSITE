import express from "express";
import authRoutes from "./auth-routes.js";
import productRoutes from "./product-routes.js";
import orderRoutes from "./order-routes.js";
import paymentRoutes from "./payment-routes.js";
import cartRoutes from "./cart-routes.js";
import  airoutes  from "./ai-routes.js";

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "ecommerce-monolith",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/orders", orderRoutes);
router.use("/payments", paymentRoutes);
router.use("/cart", cartRoutes);
router.use("/smart-search", airoutes);

export default router;
