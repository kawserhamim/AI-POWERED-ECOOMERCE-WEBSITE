import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "BDT" },
    method: {
      type: String,
      enum: ["card", "cod", "paypal", "wallet", "sslcommerz"],
      default: "sslcommerz",
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    transactionId: { type: String, default: "" },
    gatewaySessionKey: { type: String, default: "" },
    gatewayUrl: { type: String, default: "" },
    bankTransactionId: { type: String, default: "" },
    validationId: { type: String, default: "" },
    gatewayResponse: { type: mongoose.Schema.Types.Mixed, default: null },
    validationResponse: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
