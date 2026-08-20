import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const SHIPPING_FLAT = 5; // flat shipping fee in USD
const TAX_RATE = 0.08; // 8% tax

export const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "'items' must be a non-empty array" });
  }

  // Validate IDs and collect products
  const ids = items.map((i) => i.productId);
  if (!ids.every((id) => mongoose.Types.ObjectId.isValid(id))) {
    return res.status(400).json({ message: "Invalid productId in items" });
  }
  const products = await Product.find({ _id: { $in: ids } });
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  let subtotal = 0;
  const orderItems = [];
  for (const item of items) {
    const p = productMap.get(item.productId);
    if (!p)
      return res
        .status(404)
        .json({ message: `Product ${item.productId} not found` });
    const qty = Number(item.quantity) || 0;
    if (qty < 1) {
      return res
        .status(400)
        .json({ message: `Quantity for ${p.name} must be >= 1` });
    }
    if (p.stock < qty) {
      return res
        .status(400)
        .json({ message: `Only ${p.stock} in stock for ${p.name}` });
    }
    orderItems.push({
      productId: p._id,
      name: p.name,
      quantity: qty,
      price: p.price,
    });
    subtotal += p.price * qty;
  }

  const shipping = subtotal > 0 ? SHIPPING_FLAT : 0;
  const tax = +(subtotal * TAX_RATE).toFixed(2);
  const totalAmount = +(subtotal + shipping + tax).toFixed(2);

  // Decrement stock
  for (const i of orderItems) {
    await Product.findByIdAndUpdate(i.productId, { $inc: { stock: -i.quantity } });
  }

  // Snapshot shipping address
  let ship = shippingAddress;
  if (!ship) {
    const user = await User.findById(req.user._id);
    ship = user?.shippingAddress;
  }

  const order = await Order.create({
    userId: req.user._id,
    items: orderItems,
    subtotal: +subtotal.toFixed(2),
    shipping,
    tax,
    totalAmount,
    shippingAddress: ship,
    status: "created",
  });

  res.status(201).json({ order });
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ userId: req.user._id }).sort({
    createdAt: -1,
  });
  res.json({ count: orders.length, orders });
});

// Admin: list every order
export const getAllOrders = asyncHandler(async (req, res) => {
  const { status, userId } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (userId) filter.userId = userId;
  const orders = await Order.find(filter)
    .populate("userId", "name email")
    .sort({ createdAt: -1 });
  res.json({ count: orders.length, orders });
});

export const getOrderById = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid order id" });
  }
  const order = await Order.findById(req.params.id).populate(
    "userId",
    "name email"
  );
  if (!order) return res.status(404).json({ message: "Order Not Found" });

  const isOwner = order.userId._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ message: "Not allowed to view this order" });
  }
  res.json({ order });
});

// User: cancel their own order (only if status is created/processing)
export const cancelMyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order Not Found" });
  if (order.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Not allowed" });
  }
  if (!["created", "processing"].includes(order.status)) {
    return res
      .status(400)
      .json({ message: `Cannot cancel an order in status '${order.status}'` });
  }
  // Restock items
  for (const i of order.items) {
    await Product.findByIdAndUpdate(i.productId, {
      $inc: { stock: i.quantity },
    });
  }
  order.status = "cancelled";
  await order.save();
  res.json({ order });
});

// Admin: change order status
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ["created", "processing", "shipped", "delivered", "cancelled"];
  if (!allowed.includes(status)) {
    return res
      .status(400)
      .json({ message: `Invalid status. Allowed: ${allowed.join(", ")}` });
  }
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order Not Found" });

  // If transitioning to cancelled, restock
  if (status === "cancelled" && order.status !== "cancelled") {
    for (const i of order.items) {
      await Product.findByIdAndUpdate(i.productId, {
        $inc: { stock: i.quantity },
      });
    }
  }

  order.status = status;
  await order.save();
  res.json({ order });
});
