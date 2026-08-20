import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ userId });
  if (!cart) cart = await Cart.create({ userId, items: [] });
  return cart;
};

const decorateCart = async (cart) => {
  const ids = cart.items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: ids } });
  const map = new Map(products.map((p) => [p._id.toString(), p]));
  const items = cart.items.map((i) => {
    const p = map.get(i.productId.toString());
    return {
      productId: i.productId,
      quantity: i.quantity,
      product: p || null,
      lineTotal: p ? p.price * i.quantity : 0,
    };
  });
  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  return { ...cart.toObject(), items, subtotal };
};

export const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  res.json({ cart: await decorateCart(cart) });
});

export const addItem = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  if (!productId)
    return res.status(400).json({ message: "'productId' is required" });
  if (quantity < 1)
    return res.status(400).json({ message: "Quantity must be >= 1" });

  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ message: "Product Not Found" });
  if (product.stock < quantity) {
    return res
      .status(400)
      .json({ message: `Only ${product.stock} in stock` });
  }

  const cart = await getOrCreateCart(req.user._id);
  const existing = cart.items.find(
    (i) => i.productId.toString() === productId
  );
  if (existing) {
    if (existing.quantity + quantity > product.stock) {
      return res
        .status(400)
        .json({ message: `Only ${product.stock} available in stock` });
    }
    existing.quantity += quantity;
  } else {
    cart.items.push({ productId, quantity });
  }
  await cart.save();
  res.json({ cart: await decorateCart(cart) });
});

export const updateItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  if (quantity === undefined || quantity < 1) {
    return res.status(400).json({ message: "Quantity must be >= 1" });
  }
  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.find(
    (i) => i.productId.toString() === req.params.productId
  );
  if (!item)
    return res.status(404).json({ message: "Item not in cart" });

  const product = await Product.findById(req.params.productId);
  if (product && quantity > product.stock) {
    return res
      .status(400)
      .json({ message: `Only ${product.stock} in stock` });
  }
  item.quantity = quantity;
  await cart.save();
  res.json({ cart: await decorateCart(cart) });
});

export const removeItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  const before = cart.items.length;
  cart.items = cart.items.filter(
    (i) => i.productId.toString() !== req.params.productId
  );
  if (cart.items.length === before) {
    return res.status(404).json({ message: "Item not in cart" });
  }
  await cart.save();
  res.json({ cart: await decorateCart(cart) });
});

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  await cart.save();
  res.json({ cart: await decorateCart(cart) });
});