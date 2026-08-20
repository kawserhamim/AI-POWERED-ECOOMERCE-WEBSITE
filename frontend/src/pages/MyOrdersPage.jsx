// List of the logged-in user's orders.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders } from '../api/orders';
import { fmtDate, fmtMoney, statusColor } from '../utils/format';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyOrders()
      .then((res) => setOrders(res.data.orders || res.data.data?.orders || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (orders.length === 0) {
    return (
      <EmptyState
        title="No orders yet"
        message="When you place an order it will show up here."
        action={
          <Link to="/products" className="btn-primary">
            Start shopping
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">My orders</h1>
      {orders.map((o) => (
        <Link
          key={o._id}
          to={`/orders/${o._id}`}
          className="card flex justify-between items-center hover:shadow-md"
        >
          <div>
            <p className="font-semibold">Order #{o._id.slice(-6).toUpperCase()}</p>
            <p className="text-sm text-gray-500">
              {fmtDate(o.createdAt)} · {o.items.length} item(s)
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold">{fmtMoney(o.totalAmount)}</p>
            <span className={`badge ${statusColor(o.status)}`}>{o.status}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}