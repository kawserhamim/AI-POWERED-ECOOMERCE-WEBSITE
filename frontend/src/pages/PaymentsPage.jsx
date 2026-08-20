// Full payments list — matches GET /api/payments/mine.
// Shows payment ID, order link, method, amount, status, and date.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyPayments } from '../api/payments';
import { fmtDate, fmtMoney, statusColor } from '../utils/format';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';

const METHOD_ICONS = {
  card: '💳',
  sslcommerz: '🌐',
  cod: '💵',
  paypal: '🅿️',
  wallet: '👛',
};

const STATUS_LABELS = {
  pending: 'Pending',
  success: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getMyPayments()
      .then((res) => {
        const list =
          res.data?.data?.payments ||
          res.data?.payments ||
          [];
        setPayments(list);
      })
      .catch(() => setError('Could not load payments. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  if (error)
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );

  if (payments.length === 0)
    return (
      <EmptyState
        title="No payments yet"
        message="Once you complete a purchase, your payment history will appear here."
      />
    );

  // Summary stats
  const totalPaid = payments
    .filter((p) => p.status === 'success')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const currency = payments[0]?.currency || 'USD';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">💳 My Payments</h1>
        <span className="text-sm text-gray-500">{payments.length} transaction{payments.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Summary card */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Paid</p>
          <p className="text-xl font-bold text-green-600">{fmtMoney(totalPaid, currency)}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Transactions</p>
          <p className="text-xl font-bold text-brand-600">{payments.length}</p>
        </div>
        <div className="card text-center col-span-2 sm:col-span-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Latest</p>
          <p className="text-sm font-semibold text-gray-700">{fmtDate(payments[0]?.createdAt)}</p>
        </div>
      </div>

      {/* Payments list */}
      <div className="space-y-3">
        {payments.map((p) => (
          <div key={p._id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {/* Method icon */}
                <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-xl flex-shrink-0">
                  {METHOD_ICONS[p.method?.toLowerCase()] || '💰'}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800">
                    Payment #{p._id?.slice(-8).toUpperCase()}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-0.5">
                    <span className="capitalize">{p.method || 'Unknown method'}</span>
                    <span>·</span>
                    <span>{fmtDate(p.createdAt)}</span>
                    {p.orderId && (
                      <>
                        <span>·</span>
                        <Link
                          to={`/orders/${p.orderId?._id || p.orderId}`}
                          className="text-brand-600 hover:underline font-medium"
                        >
                          View Order →
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Amount + status */}
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-lg text-gray-800">
                  {fmtMoney(p.amount, p.currency || currency)}
                </p>
                <span className={`badge ${statusColor(p.status)} mt-1`}>
                  {STATUS_LABELS[p.status] || p.status}
                </span>
              </div>
            </div>

            {/* Transaction ID (if available) */}
            {p.transactionId && (
              <p className="mt-2 text-xs text-gray-400 font-mono">
                TXN: {p.transactionId}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}