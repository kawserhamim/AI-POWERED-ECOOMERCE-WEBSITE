import express from "express";
import {
  startPayment,
  viewMyPayments,
  viewPayment,
  adminViewPayments,
  adminRefundPayment,
  paymentSuccess,
  paymentFailed,
  paymentCancelled,
  paymentNotification,
} from "../controllers/payment.controller.js";
import { protect, requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

// SSLCommerz callback routes — must handle BOTH GET and POST.
// After OTP/card payment, SSLCommerz POSTs form data to success_url/fail_url/cancel_url,
// then the browser follows that POST. Registering only GET caused the POST to fall
// through past the protect wall → 401 "Not authorized, token missing".
router.route("/success").get(paymentSuccess).post(paymentSuccess);
router.route("/fail").get(paymentFailed).post(paymentFailed);
router.route("/cancel").get(paymentCancelled).post(paymentCancelled);
router.post("/ipn", paymentNotification);

router.use(protect);

router.post("/", startPayment);
router.get("/mine", viewMyPayments);
router.get("/:id", viewPayment);

// Admin
router.get("/", requireRole("admin"), adminViewPayments);
router.put("/:id/refund", requireRole("admin"), adminRefundPayment);

export default router;