// Cart page — list items, change quantities, see subtotal, go to checkout.
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { fmtMoney } from '../utils/format';
import EmptyState from '../components/EmptyState';
import { getErrorMessage } from '../utils/error';

export default function CartPage() {
  const { items, subtotal, updateItem, removeItem, clear, loading } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return <p className="text-center py-10 text-gray-500">Loading cart…</p>;
  }
  if (items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        message="Browse our products and add a few items."
        action={
          <Link to="/products" className="btn-primary">
            Shop now
          </Link>
        }
      />
    );
  }

  async function setQty(productId, value) {
    try {
      await updateItem(productId, Math.max(0, Number(value)));
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update cart'));
    }
  }

  async function remove(productId) {
    try {
      await removeItem(productId);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not remove item'));
    }
  }

  function startCheckout() {
    if (!isAuthenticated) {
      toast('Please log in to check out');
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
      return;
    }
    navigate('/checkout');
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-3">
        {items.map((it) => {
          const p = it.product || {};
          const lineTotal = it.lineTotal ?? p.price * it.quantity;
          return (
            <div
              key={it.productId}
              className="card flex gap-4 items-center"
            >
              <Link to={`/products/${it.productId}`} className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                {p.images?.[0] ? (
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-gray-400">No image</span>
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <Link
                  to={`/products/${it.productId}`}
                  className="font-semibold hover:underline line-clamp-1"
                >
                  {p.name || 'Product'}
                </Link>
                <p className="text-sm text-gray-500">{p.brand}</p>
                <p className="text-brand-600 font-bold">{fmtMoney(lineTotal)}</p>
              </div>
              <input
                type="number"
                min="0"
                value={it.quantity}
                onChange={(e) => setQty(it.productId, e.target.value)}
                className="input w-20"
              />
              <button
                className="text-red-600 text-sm hover:underline"
                onClick={() => remove(it.productId)}
              >
                Remove
              </button>
            </div>
          );
        })}
        <button onClick={() => clear()} className="btn-secondary text-sm">
          Clear cart
        </button>
      </div>

      <div className="card h-fit space-y-3">
        <h3 className="font-bold">Order summary</h3>
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span className="font-semibold">{fmtMoney(subtotal)}</span>
        </div>
        <p className="text-xs text-gray-500">
          Shipping ($5) and 8% tax are added at checkout.
        </p>
        <button onClick={startCheckout} className="btn-primary w-full">
          Checkout
        </button>
      </div>
    </div>
  );
}