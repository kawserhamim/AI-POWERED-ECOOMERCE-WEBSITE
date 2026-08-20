// Simple home page for logged-in users (not admins). Easy to understand.
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function UserDashboardPage() {
  const { user } = useAuth();
  const { itemCount } = useCart();
  const initial = (user?.name || user?.email || '?')[0].toUpperCase();

  return (
    <div className="space-y-6">
      <div className="card flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-xl font-bold text-white">
          {initial}
        </div>
        <div>
          <h1 className="text-2xl font-bold">Hi {user?.name || 'there'} 👋</h1>
          <p className="text-sm text-slate-500">
            You're signed in as a regular customer. Manage your orders, payments, and profile below.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/products" className="card hover:shadow-lg transition">
          <h3 className="font-bold text-lg">🛍️ Shop products</h3>
          <p className="text-sm text-slate-500 mt-1">Browse what's new.</p>
        </Link>

        <Link to="/cart" className="card hover:shadow-lg transition">
          <h3 className="font-bold text-lg">🛒 My cart</h3>
          <p className="text-sm text-slate-500 mt-1">
            {itemCount > 0 ? `${itemCount} item(s) waiting` : 'Cart is empty'}
          </p>
        </Link>

        <Link to="/orders" className="card hover:shadow-lg transition">
          <h3 className="font-bold text-lg">📦 My orders</h3>
          <p className="text-sm text-slate-500 mt-1">See your order history.</p>
        </Link>

        <Link to="/payments" className="card hover:shadow-lg transition">
          <h3 className="font-bold text-lg">💳 My payments</h3>
          <p className="text-sm text-slate-500 mt-1">View past payments.</p>
        </Link>

        <Link to="/profile" className="card hover:shadow-lg transition">
          <h3 className="font-bold text-lg">👤 Profile</h3>
          <p className="text-sm text-slate-500 mt-1">Update your info & security.</p>
        </Link>
      </div>
    </div>
  );
}