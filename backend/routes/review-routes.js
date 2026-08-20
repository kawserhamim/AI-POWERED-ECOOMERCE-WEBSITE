import express from "express";
import {
  listProductReviews,
  createReview,
  updateReview,
  deleteReview,
} from "../controllers/review.controller.js";
import { protect } from "../middleware/auth.middleware.js";

// Mounted at /products/:productId/reviews
// req.params.productId is set by the parent router.
const router = express.Router({ mergeParams: true });

router.get("/", listProductReviews);
router.post("/", protect, createReview);
router.put("/:reviewId", protect, updateReview);
router.delete("/:reviewId", protect, deleteReview);

export default router;