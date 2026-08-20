import express from "express";
import {
  getProducts,
  getProductById,
  getProductsByIds,
  getFeaturedProducts,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";
import { protect, requireRole } from "../middleware/auth.middleware.js";
import reviewRoutes from "./review-routes.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/featured", getFeaturedProducts);
router.get("/categories", getCategories);
router.get("/by-ids", getProductsByIds);
// Nested reviews under a product
router.use("/:productId/reviews", reviewRoutes);

// Must come AFTER static routes so /featured, /categories, /by-ids are matched first
router.get("/:id", getProductById);

// Admin-only mutations
router.post("/", protect, requireRole("admin"), createProduct);
router.put("/:id", protect, requireRole("admin"), updateProduct);
router.delete("/:id", protect, requireRole("admin"), deleteProduct);

export default router;
