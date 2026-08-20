import mongoose from "mongoose";
import Review from "../models/Review.js";
import Product from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Recompute Product.rating + reviewsCount from the Review collection.
const recomputeProductRating = async (productId) => {
  const [stats] = await Review.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: "$productId",
        avg: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);
  await Product.findByIdAndUpdate(productId, {
    rating: stats ? Math.round(stats.avg * 10) / 10 : 0,
    reviewsCount: stats ? stats.count : 0,
  });
};

export const listProductReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ productId: req.params.productId })
    .populate("userId", "name email")
    .sort({ createdAt: -1 });
  res.json({ count: reviews.length, reviews });
});

export const createReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || !comment) {
    return res
      .status(400)
      .json({ message: "Both 'rating' and 'comment' are required" });
  }
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5" });
  }

  const product = await Product.findById(req.params.productId);
  if (!product) return res.status(404).json({ message: "Product Not Found" });

  const existing = await Review.findOne({
    userId: req.user._id,
    productId: product._id,
  });
  if (existing) {
    return res
      .status(400)
      .json({ message: "You already reviewed this product" });
  }

  const review = await Review.create({
    userId: req.user._id,
    productId: product._id,
    rating,
    comment,
  });
  await recomputeProductRating(product._id);
  res.status(201).json({ review });
});

export const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.reviewId);
  if (!review) return res.status(404).json({ message: "Review Not Found" });
  if (review.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Not allowed to edit this review" });
  }
  if (req.body.rating !== undefined) {
    if (req.body.rating < 1 || req.body.rating > 5)
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    review.rating = req.body.rating;
  }
  if (req.body.comment !== undefined) review.comment = req.body.comment;
  await review.save();
  await recomputeProductRating(review.productId);
  res.json({ review });
});

export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.reviewId);
  if (!review) return res.status(404).json({ message: "Review Not Found" });
  const isOwner = review.userId.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ message: "Not allowed to delete this review" });
  }
  const productId = review.productId;
  await review.deleteOne();
  await recomputeProductRating(productId);
  res.json({ message: "Review Deleted" });
});