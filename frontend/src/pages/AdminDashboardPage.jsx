// Admin landing page — quick links into the admin area. Kept dead simple.
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="card flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-xl font-bold text-white">
          🛡️
        </div>
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-slate-500">
            Welcome {user?.name || 'admin'} — you have full access to the store.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/admin?tab=products" className="card hover:shadow-lg transition">
          <h3 className="font-bold text-lg">📦 Products</h3>
          <p className="text-sm text-slate-500 mt-1">Add, edit, remove products.</p>
        </Link>

        <Link to="/admin?tab=orders" className="card hover:shadow-lg transition">
          <h3 className="font-bold text-lg">🧾 Orders</h3>
          <p className="text-sm text-slate-500 mt-1">Manage customer orders.</p>
        </Link>

        <Link to="/admin?tab=payments" className="card hover:shadow-lg transition">
          <h3 className="font-bold text-lg">💰 Payments</h3>
          <p className="text-sm text-slate-500 mt-1">View payments, issue refunds.</p>
        </Link>

        <Link to="/admin?tab=users" className="card hover:shadow-lg transition">
          <h3 className="font-bold text-lg">👥 Users</h3>
          <p className="text-sm text-slate-500 mt-1">Manage customers & admins.</p>
        </Link>
      </div>
    </div>
  );
}