// Admin orders — list all and update their status.
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getAllOrders, updateOrderStatus } from '../api/orders';
import { fmtDate, fmtMoney, statusColor } from '../utils/format';
import { getErrorMessage } from '../utils/error';
import Spinner from '../components/Spinner';

const STATUSES = ['created', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function OrdersAdmin() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  function load(status = '') {
    setLoading(true);
    getAllOrders(status ? { status } : {})
      .then((res) => setOrders(res.data.orders || res.data.data?.orders || []))
      .finally(() => setLoading(false));
  }

  useEffect(() => load(filter), [filter]);

  async function changeStatus(o, newStatus) {
    try {
      await updateOrderStatus(o._id, newStatus);
      toast.success(`Marked as ${newStatus}`);
      load(filter);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Update failed'));
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label className="text-sm">Filter status:</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input max-w-xs">
          <option value="">All</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm bg-white rounded shadow-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Order</th>
              <th className="p-3">Date</th>
              <th className="p-3">Items</th>
              <th className="p-3">Total</th>
              <th className="p-3">Status</th>
              <th className="p-3">Change to</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id} className="border-t">
                <td className="p-3 font-mono text-xs">#{o._id.slice(-6).toUpperCase()}</td>
                <td className="p-3">{fmtDate(o.createdAt)}</td>
                <td className="p-3">{o.items.length}</td>
                <td className="p-3">{fmtMoney(o.totalAmount)}</td>
                <td className="p-3">
                  <span className={`badge ${statusColor(o.status)}`}>{o.status}</span>
                </td>
                <td className="p-3">
                  <select
                    value=""
                    onChange={(e) => e.target.value && changeStatus(o, e.target.value)}
                    className="input max-w-[10rem]"
                  >
                    <option value="">Set…</option>
                    {STATUSES.filter((s) => s !== o.status).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}