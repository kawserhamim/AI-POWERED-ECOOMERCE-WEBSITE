// Admin dashboard with tabs for products / orders / payments / users.
// Keeping it in one file keeps it easy to follow; each tab is its own subcomponent.
import { useState } from 'react';
import ProductsAdmin from '../admin/ProductsAdmin';
import OrdersAdmin from '../admin/OrdersAdmin';
import PaymentsAdmin from '../admin/PaymentsAdmin';
import UsersAdmin from '../admin/UsersAdmin';

const TABS = [
  { id: 'products', label: 'Products' },
  { id: 'orders', label: 'Orders' },
  { id: 'payments', label: 'Payments' },
  { id: 'users', label: 'Users' },
];

export default function AdminPage() {
  const [tab, setTab] = useState('products');

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Admin</h1>

      <div className="flex gap-2 border-b">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t.id
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'products' && <ProductsAdmin />}
      {tab === 'orders' && <OrdersAdmin />}
      {tab === 'payments' && <PaymentsAdmin />}
      {tab === 'users' && <UsersAdmin />}
    </div>
  );
}