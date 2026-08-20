// CartContext — loads the cart from the backend when logged in and exposes
// helpers for adding/updating/removing items. Falls back to a local cart
// for guests (kept in localStorage) so they can browse too.
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as cartApi from '../api/cart';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);
const GUEST_KEY = 'guest_cart';

function readGuestCart() {
  try {
    return JSON.parse(localStorage.getItem(GUEST_KEY)) || [];
  } catch {
    return [];
  }
}

function writeGuestCart(items) {
  localStorage.setItem(GUEST_KEY, JSON.stringify(items));
}

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState(() => (isAuthenticated ? [] : readGuestCart()));
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Load the cart from the server whenever the user logs in or out.
  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setItems(readGuestCart());
      setSubtotal(0);
      return;
    }
    setLoading(true);
    try {
      // Merge any items added while browsing as a guest into the server cart.
      const guestItems = readGuestCart();
      if (guestItems.length > 0) {
        await Promise.all(
          guestItems.map((i) =>
            cartApi.addToCart(i.productId, i.quantity).catch(() => {})
          )
        );
        writeGuestCart([]);
      }
      const { data } = await cartApi.getCart();
      // Backend returns { cart: { items, subtotal, ... } }
      const cart = data.cart || {};
      setItems(
        (cart.items || []).map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
          product: it.product || null,
          lineTotal: it.lineTotal || 0,
        }))
      );
      setSubtotal(cart.subtotal || 0);
    } catch {
      setItems([]);
      setSubtotal(0);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const itemCount = items.reduce((sum, it) => sum + it.quantity, 0);

  async function addItem(productId, quantity = 1) {
    if (!isAuthenticated) {
      const next = [...items];
      const existing = next.find((i) => i.productId === productId);
      if (existing) existing.quantity += quantity;
      else next.push({ productId, quantity });
      setItems(next);
      writeGuestCart(next);
      return;
    }
    await cartApi.addToCart(productId, quantity);
    await refresh();
  }

  async function updateItem(productId, quantity) {
    if (!isAuthenticated) {
      const next = items
        .map((i) => (i.productId === productId ? { ...i, quantity } : i))
        .filter((i) => i.quantity > 0);
      setItems(next);
      writeGuestCart(next);
      return;
    }
    await cartApi.updateCartItem(productId, quantity);
    await refresh();
  }

  async function removeItem(productId) {
    if (!isAuthenticated) {
      const next = items.filter((i) => i.productId !== productId);
      setItems(next);
      writeGuestCart(next);
      return;
    }
    await cartApi.removeCartItem(productId);
    await refresh();
  }

  async function clear() {
    if (!isAuthenticated) {
      setItems([]);
      writeGuestCart([]);
      return;
    }
    await cartApi.clearCart();
    await refresh();
  }

  return (
    <CartContext.Provider
      value={{
        items,
        subtotal,
        itemCount,
        loading,
        addItem,
        updateItem,
        removeItem,
        clear,
        refresh,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);