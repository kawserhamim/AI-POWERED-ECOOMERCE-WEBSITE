// Admin payments — list and refund.
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getAllPayments, refundPayment } from '../api/payments';
import { fmtDate, fmtMoney, statusColor } from '../utils/format';
import { getErrorMessage } from '../utils/error';
import Spinner from '../components/Spinner';

export default function PaymentsAdmin() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    getAllPayments()
      .then((res) => setPayments(res.data.payments || res.data.data?.payments || []))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function refund(p) {
    if (!confirm('Mark this payment as refunded?')) return;
    try {
      await refundPayment(p._id);
      toast.success('Refunded');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Refund failed'));
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm bg-white rounded shadow-sm">
        <thead className="bg-gray-50 text-left">
          <tr>
            <th className="p-3">Payment</th>
            <th className="p-3">Date</th>
            <th className="p-3">Method</th>
            <th className="p-3">Amount</th>
            <th className="p-3">Status</th>
            <th className="p-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p._id} className="border-t">
              <td className="p-3 font-mono text-xs">#{p._id.slice(-6).toUpperCase()}</td>
              <td className="p-3">{fmtDate(p.createdAt)}</td>
              <td className="p-3">{p.method}</td>
              <td className="p-3">{fmtMoney(p.amount, p.currency)}</td>
              <td className="p-3">
                <span className={`badge ${statusColor(p.status)}`}>{p.status}</span>
              </td>
              <td className="p-3 text-right">
                {p.status === 'success' && (
                  <button onClick={() => refund(p)} className="text-red-600 hover:underline">
                    Refund
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}