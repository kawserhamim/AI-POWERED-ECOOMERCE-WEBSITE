// ============================================
// FILE: paymentController.js
// SUPER SIMPLE VERSION - No fancy stuff
// ============================================

// ============================================
// 1. GETTING OUR TOOLS
// ============================================
import crypto from "crypto";              // Makes random codes
import mongoose from "mongoose";         // Talks to database
import SSLCommerzPayment from "sslcommerz-lts"; // Payment machine
import Order from "../models/Order.js";   // Order data
import Payment from "../models/Payment.js"; // Payment data
import User from "../models/User.js";     // User data
import { asyncHandler } from "../utils/asyncHandler.js"; // Error catcher

// ============================================
// 2. SETTINGS (from .env file)
// ============================================
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const BACKEND_URL =
  process.env.BACKEND_URL ||
  `http://localhost:${process.env.PORT || 8000}`;
const CURRENCY = process.env.SSL_COMMERZ_CURRENCY || "BDT";

// ============================================
// 3. SIMPLE HELPER FUNCTIONS
// ============================================

// ---------- 3.1 Make a website address ----------
function makeWebsiteAddress(base, path) {
    // Example: makeWebsiteAddress(BACKEND_URL, "/payments")
    // Returns: "http://localhost:8000/payments"
    return new URL(path, base).toString();
}

// ---------- 3.2 Create the payment machine ----------
function getPaymentMachine() {
    // Get store keys from .env. Accept either the legacy (STORE_ID / STORE_PASSWD)
    // or the newer (SSLCOMMERZ_STORE_ID / SSLCOMMERZ_STORE_PASSWORD) names.
    const storeId =
        process.env.SSLCOMMERZ_STORE_ID || process.env.STORE_ID;
    const storePassword =
        process.env.SSLCOMMERZ_STORE_PASSWORD ||
        process.env.SSLCOMMERZ_STORE_PASSWD ||
        process.env.STORE_PASSWD;

    // If keys are missing, stop everything
    if (!storeId || !storePassword) {
        throw new Error(
            "Payment machine keys not found! Check .env file (SSLCOMMERZ_STORE_ID / SSLCOMMERZ_STORE_PASSWORD)"
        );
    }

    // Create the machine (sandbox or live)
    return new SSLCommerzPayment(
        storeId,
        storePassword,
        process.env.IS_LIVE === "true" // true = real money, false = test
    );
}

// ---------- 3.3 Clean phone number ----------
function cleanPhoneNumber(phone) {
    // Remove all non-number characters
    // "+880-1712-345678" becomes "8801712345678"
    const digits = String(phone || "").replace(/\D/g, "");
    
    // If empty, use default
    return digits || "01700000000";
}

// ---------- 3.4 Get customer address ----------
function getCustomerInfo(order, user) {
    // Get address from order or user
    const address = order.shippingAddress || user?.shippingAddress || {};

    return {
        fullName: address.fullName || user?.name || "Customer",
        phone: address.phone || "01700000000",
        street: address.line1 || "N/A",
        city: address.city || "Dhaka",
        postcode: address.postalCode || "1000",
        country: address.country || "Bangladesh",
    };
}

// ---------- 3.5 Make a unique transaction ID ----------
function makeTransactionId(orderId) {
    // Take last 6 letters of order ID
    const orderPart = orderId.toString().slice(-6).toUpperCase();
    
    // Make 6 random letters/numbers
    const randomPart = crypto.randomBytes(6).toString("hex").toUpperCase();
    
    // Combine: SC-123ABC-DEF456
    return `SC-${orderPart}-${randomPart}`;
}

// ---------- 3.6 Prepare data for SSLCommerz ----------
function preparePaymentData({ req, order, user, transactionId }) {
    const customer = getCustomerInfo(order, user);
    
    // Count how many items in order
    const totalItems = order.items.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0
    );

    // All the info SSLCommerz needs.
    // Backend is mounted at the root (see server.js: app.use("/", apiRoutes)),
    // so the callback URLs are /payments/..., not /api/payments/...
    return {
        // Money stuff
        total_amount: Number(order.totalAmount.toFixed(2)),
        currency: CURRENCY,
        tran_id: transactionId,

        // Where to send responses
        success_url: makeWebsiteAddress(BACKEND_URL,
            `/payments/success?orderId=${order._id}&tran_id=${transactionId}`
        ),
        fail_url: makeWebsiteAddress(BACKEND_URL,
            `/payments/fail?orderId=${order._id}&tran_id=${transactionId}`
        ),
        cancel_url: makeWebsiteAddress(BACKEND_URL,
            `/payments/cancel?orderId=${order._id}&tran_id=${transactionId}`
        ),
        ipn_url: makeWebsiteAddress(BACKEND_URL,
            `/payments/ipn?orderId=${order._id}&tran_id=${transactionId}`
        ),

        // Product info (sslcommerz-lts reads both `productcategory` and `product_category` —
        // we set both so it never falls back to empty).
        product_name: `Order #${order._id.toString().slice(-6).toUpperCase()}`,
        product_category: "Ecommerce",
        productcategory: "Ecommerce",
        product_profile: "general",
        shipping_method: "Courier",
        num_of_item: totalItems,

        // Customer info (cus_add2 / cus_state / cus_fax are required by the gateway)
        cus_name: customer.fullName,
        cus_email: user?.email || "customer@example.com",
        cus_phone: cleanPhoneNumber(customer.phone),
        cus_add1: customer.street,
        cus_add2: customer.state || customer.city || "N/A",
        cus_city: customer.city,
        cus_state: customer.state || customer.city || "N/A",
        cus_postcode: customer.postcode,
        cus_country: customer.country,
        cus_fax: cleanPhoneNumber(customer.phone),

        // Shipping info (same as customer)
        ship_name: customer.fullName,
        ship_add1: customer.street,
        ship_add2: customer.state || customer.city || "N/A",
        ship_city: customer.city,
        ship_state: customer.state || customer.city || "N/A",
        ship_postcode: customer.postcode,
        ship_country: customer.country,
    };
}

// ---------- 3.7 Make result page URL ----------
function makeResultPage(status, info) {
    const url = new URL(`/payment/${status}`, FRONTEND_URL);
    
    // Add info to the URL
    if (info.orderId) url.searchParams.set("orderId", String(info.orderId));
    if (info.paymentId) url.searchParams.set("paymentId", String(info.paymentId));
    if (info.transactionId) url.searchParams.set("transactionId", String(info.transactionId));
    
    return url.toString();
}

// ============================================
// 4. MAIN FUNCTIONS (What the app actually does)
// ============================================

// ---------- 4.1 START PAYMENT ----------
// This runs when user clicks "Pay Now"
export const startPayment = asyncHandler(async (req, res) => {
    console.log("🛒 STARTING PAYMENT...");

    // --- STEP 1: Get order ID from request ---
    const { orderId, paymentMethod = "sslcommerz" } = req.body;
    
    console.log(`📝 Order: ${orderId}, Method: ${paymentMethod}`);

    // --- STEP 2: Check if order ID exists ---
    if (!orderId) {
        return res.status(400).json({
            success: false,
            message: "Please provide an order ID"
        });
    }

    // --- STEP 3: Check if order ID is valid format ---
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid order ID format"
        });
    }

    // --- STEP 4: Find the order in database ---
    const order = await Order.findById(orderId);
    if (!order) {
        return res.status(404).json({
            success: false,
            message: "Order not found"
        });
    }
    console.log(`✅ Order found: ${order._id}, Total: $${order.totalAmount}`);

    // --- STEP 5: Check if user owns this order ---
    if (order.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: "You can't pay for someone else's order"
        });
    }

    // --- STEP 6: Check if order is cancelled ---
    if (order.status === "cancelled") {
        return res.status(400).json({
            success: false,
            message: "This order has been cancelled"
        });
    }

    // --- STEP 7: Check if already paid ---
    const alreadyPaid = await Payment.findOne({
        orderId: order._id,
        status: "success"
    });

    if (alreadyPaid) {
        return res.status(400).json({
            success: false,
            message: "Order already paid!",
            payment: alreadyPaid
        });
    }

    // --- STEP 8: CASH ON DELIVERY (simple) ---
    if (paymentMethod === "cod") {
        console.log("💰 Cash on Delivery selected");
        
        // Create payment record
        const payment = await Payment.create({
            orderId: order._id,
            userId: req.user._id,
            amount: order.totalAmount,
            currency: "BDT",
            method: "cod",
            status: "success", // COD is always "success" because they'll pay later
            transactionId: makeTransactionId(order._id),
        });

        // Update order status
        if (order.status === "created") {
            order.status = "processing";
        }
        order.paidAt = new Date();
        await order.save();

        return res.status(201).json({
            success: true,
            message: "Order placed! Pay when delivered.",
            payment
        });
    }

    // --- STEP 9: ONLINE PAYMENT (SSLCommerz) ---
    console.log("💳 Starting online payment...");

    // Make unique transaction ID
    const transactionId = makeTransactionId(order._id);
    console.log(`🔑 Transaction ID: ${transactionId}`);

    // Get user info
    const user = await User.findById(req.user._id)
        .select("name email shippingAddress");

    // Get payment machine
    const paymentMachine = getPaymentMachine();

    // Create payment record in database
    const payment = await Payment.create({
        orderId: order._id,
        userId: req.user._id,
        amount: order.totalAmount,
        currency: CURRENCY,
        method: "sslcommerz",
        status: "pending",
        transactionId,
    });
    console.log(`📦 Payment record created: ${payment._id}`);

    // --- STEP 10: Send to SSLCommerz ---
    try {
        // Prepare the data
        const paymentData = preparePaymentData({
            req,
            order,
            user,
            transactionId,
        });

        console.log("📤 Sending to SSLCommerz...");

        // Send to SSLCommerz
        const sslResponse = await paymentMachine.init(paymentData);

        // Save response from SSLCommerz
        payment.gatewaySessionKey = sslResponse?.SessionKey || "";
        payment.gatewayUrl = sslResponse?.GatewayPageURL || "";
        payment.gatewayResponse = sslResponse;
        await payment.save();

        // Check if we got a payment page URL
        if (!payment.gatewayUrl) {
            throw new Error("SSLCommerz didn't give us a payment URL");
        }

        console.log(`✅ SSLCommerz URL: ${payment.gatewayUrl}`);

        // Send back the payment URL
        return res.status(201).json({
            success: true,
            message: "Redirecting to payment page...",
            payment,
            gatewayUrl: payment.gatewayUrl, // Frontend will redirect here
        });

    } catch (error) {
        // Something went wrong
        console.log("❌ SSLCommerz error:", error.message);

        payment.status = "failed";
        payment.gatewayResponse = { error: error.message };
        await payment.save();

        return res.status(500).json({
            success: false,
            message: "Payment initialization failed",
            error: error.message,
        });
    }
});

// ---------- 4.2 PAYMENT SUCCESSFUL ----------
// SSLCommerz redirects the user's browser here when payment completes.
// The actual source of truth is the IPN, but we try to validate eagerly so
// the user sees the right status page immediately.
export const paymentSuccess = asyncHandler(async (req, res) => {
    console.log("✅ PAYMENT SUCCESSFUL (user redirect)", {
        query: req.query,
        body: req.body,
    });

    // Get info from SSLCommerz
    const transactionId = req.query.tran_id || req.body?.tran_id;
    const validationId = req.query.val_id || req.body?.val_id;

    if (!transactionId) {
        console.log("❌ No transaction ID on success redirect");
        return res.redirect(makeResultPage("failed", {}));
    }

    // Find the payment in our database
    const payment = await Payment.findOne({
        transactionId: transactionId,
        method: "sslcommerz",
    });

    if (!payment) {
        console.log("❌ Payment not found for tran_id:", transactionId);
        return res.redirect(makeResultPage("failed", {}));
    }

    console.log(`📦 Payment found: ${payment._id}`);

    // Find the order
    const order = await Order.findById(payment.orderId);

    // Try to verify with SSLCommerz using val_id. If this fails (e.g. localhost
    // is unreachable from their infra, or the user closed the tab before the
    // browser POST), we still treat the redirect as pending and let the IPN
    // reconcile later.
    if (validationId) {
        try {
            const paymentMachine = getPaymentMachine();
            const verification = await paymentMachine.validate({ val_id: validationId });

            // Inspect both top-level status and the nested "status" field the
            // sandbox sometimes returns wrapped.
            const status = String(
                verification?.status ||
                verification?.APIConnect ||
                ""
            ).toLowerCase();
            const isGood = ["valid", "validated", "success", "true", "ok"].includes(status);

            if (isGood) {
                console.log("✅ Payment verified by gateway!");
                payment.status = "success";
                payment.validationId = validationId;
                payment.bankTransactionId = verification?.bank_tran_id || "";
                payment.validationResponse = verification;
                await payment.save();

                if (order) {
                    if (order.status === "created") order.status = "processing";
                    order.paidAt = new Date();
                    await order.save();
                }

                return res.redirect(makeResultPage("success", {
                    orderId: order?._id,
                    paymentId: payment._id,
                    transactionId: payment.transactionId,
                }));
            }

            console.log("⚠️ Gateway returned non-success status:", verification);
        } catch (error) {
            console.log("⚠️ Validate() failed (expected if localhost is unreachable):", error.message);
            // Fall through to "pending" — the IPN will resolve this later.
        }
    }

    // No val_id, or validation failed: mark "pending" and send the user to the
    // frontend. The IPN (when reachable) will update the status later.
    if (payment.status === "pending") {
        // We were here because the user was redirected, but we couldn't fully
        // confirm. Keep as pending; frontend will show a "processing" message.
    }

    return res.redirect(makeResultPage("pending", {
        orderId: order?._id,
        paymentId: payment._id,
        transactionId: payment.transactionId,
    }));
});

// ---------- 4.3 PAYMENT FAILED ----------
// SSLCommerz calls this when payment fails
export const paymentFailed = asyncHandler(async (req, res) => {
    console.log("❌ PAYMENT FAILED");

    const transactionId = req.query.tran_id || req.body?.tran_id;

    // Update payment status
    const payment = await Payment.findOne({
        transactionId: transactionId,
        method: "sslcommerz",
    });

    if (payment) {
        payment.status = "failed";
        await payment.save();
        console.log(`📦 Payment marked failed: ${payment._id}`);
    }

    // Redirect to failed page
    return res.redirect(makeResultPage("failed", {
        orderId: payment?.orderId,
        paymentId: payment?._id,
        transactionId: payment?.transactionId,
    }));
});

// ---------- 4.4 PAYMENT CANCELLED ----------
// SSLCommerz calls this when user cancels
export const paymentCancelled = asyncHandler(async (req, res) => {
    console.log("⏹️ PAYMENT CANCELLED");

    const transactionId = req.query.tran_id || req.body?.tran_id;

    // Update payment status
    const payment = await Payment.findOne({
        transactionId: transactionId,
        method: "sslcommerz",
    });

    if (payment) {
        payment.status = "failed";
        await payment.save();
        console.log(`📦 Payment marked cancelled: ${payment._id}`);
    }

    // Redirect to cancelled page
    return res.redirect(makeResultPage("cancelled", {
        orderId: payment?.orderId,
        paymentId: payment?._id,
        transactionId: payment?.transactionId,
    }));
});

// ---------- 4.5 INSTANT PAYMENT NOTIFICATION ----------
// SSLCommerz sends this to confirm payment
export const paymentNotification = asyncHandler(async (req, res) => {
    console.log("📡 INSTANT PAYMENT NOTIFICATION");

    const transactionId = req.query.tran_id || req.body?.tran_id;
    const validationId = req.query.val_id || req.body?.val_id;

    if (!transactionId) {
        return res.status(200).json({ received: true });
    }

    // Find payment
    const payment = await Payment.findOne({
        transactionId: transactionId,
        method: "sslcommerz",
    });

    if (!payment) {
        return res.status(200).json({ received: true });
    }

    console.log(`📦 Payment found: ${payment._id}`);

    // Verify with SSLCommerz
    try {
        const paymentMachine = getPaymentMachine();
        const verification = validationId 
            ? await paymentMachine.validate({ val_id: validationId })
            : null;

        if (verification) {
            const status = String(verification.status || "").toLowerCase();
            const isGood = ["valid", "validated", "success", "true"].includes(status);

            if (isGood) {
                console.log("✅ IPN verified!");
                payment.status = "success";

                // Update order
                const order = await Order.findById(payment.orderId);
                if (order && order.status === "created") {
                    order.status = "processing";
                    order.paidAt = new Date();
                    await order.save();
                }
            }
        }

        await payment.save();

    } catch (error) {
        console.log("❌ IPN error:", error.message);
    }

    // Always return 200
    return res.status(200).json({ received: true });
});

// ---------- 4.6 VIEW MY PAYMENTS ----------
// User sees their own payments
export const viewMyPayments = asyncHandler(async (req, res) => {
    console.log("📋 VIEWING USER PAYMENTS");

    const payments = await Payment.find({
        userId: req.user._id,
    })
        .populate("orderId", "totalAmount status")
        .sort({ createdAt: -1 });

    console.log(`✅ Found ${payments.length} payments`);

    res.status(200).json({
        success: true,
        count: payments.length,
        payments,
    });
});

// ---------- 4.7 VIEW ONE PAYMENT ----------
// User sees one payment details
export const viewPayment = asyncHandler(async (req, res) => {
    console.log("🔍 VIEWING SINGLE PAYMENT");

    const paymentId = req.params.id;

    // Check if ID is valid
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid payment ID"
        });
    }

    // Find payment
    const payment = await Payment.findById(paymentId)
        .populate("orderId", "totalAmount status");

    if (!payment) {
        return res.status(404).json({
            success: false,
            message: "Payment not found"
        });
    }

    // Check if user owns this payment
    const isOwner = payment.userId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
        return res.status(403).json({
            success: false,
            message: "You can't see this payment"
        });
    }

    res.status(200).json({
        success: true,
        payment,
    });
});

// ---------- 4.8 ADMIN VIEW ALL PAYMENTS ----------
// Admin sees all payments
export const adminViewPayments = asyncHandler(async (req, res) => {
    console.log("👑 ADMIN VIEWING ALL PAYMENTS");

    // Build filters
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.method) filters.method = req.query.method;

    const payments = await Payment.find(filters)
        .populate("userId", "name email")
        .populate("orderId", "totalAmount status")
        .sort({ createdAt: -1 });

    console.log(`✅ Found ${payments.length} payments`);

    res.status(200).json({
        success: true,
        count: payments.length,
        payments,
    });
});

// ---------- 4.9 REFUND PAYMENT ----------
// Admin refunds a payment
export const adminRefundPayment = asyncHandler(async (req, res) => {
    console.log("💰 PROCESSING REFUND");

    const paymentId = req.params.id;

    // Find payment
    const payment = await Payment.findById(paymentId);

    if (!payment) {
        return res.status(404).json({
            success: false,
            message: "Payment not found"
        });
    }

    // Check if refundable
    if (payment.status !== "success") {
        return res.status(400).json({
            success: false,
            message: "Only successful payments can be refunded"
        });
    }

    // Process refund
    try {
        if (payment.method === "sslcommerz" && payment.bankTransactionId) {
            console.log("🏦 Processing SSLCommerz refund...");

            const paymentMachine = getPaymentMachine();
            const refundResponse = await paymentMachine.initiateRefund({
                refund_amount: payment.amount,
                refund_remarks: "Order refund",
                bank_tran_id: payment.bankTransactionId,
                refe_id: payment.transactionId,
            });

            payment.gatewayResponse = refundResponse;
            console.log("✅ SSLCommerz refund processed");
        }

        // Update payment
        payment.status = "refunded";
        await payment.save();

        console.log(`✅ Refund complete: ${payment._id}`);

        res.status(200).json({
            success: true,
            message: "Refund processed successfully",
            payment,
        });

    } catch (error) {
        console.log("❌ Refund error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Refund failed",
            error: error.message,
        });
    }
});

// ============================================
// 5. EXPORT ALL FUNCTIONS
// ============================================
export default {
    startPayment,           // User starts payment
    paymentSuccess,         // SSLCommerz says success
    paymentFailed,          // SSLCommerz says failed
    paymentCancelled,       // User cancelled
    paymentNotification,    // SSLCommerz IPN
    viewMyPayments,         // User sees their payments
    viewPayment,            // User sees one payment
    adminViewPayments,      // Admin sees all payments
    adminRefundPayment,     // Admin refunds payment
};