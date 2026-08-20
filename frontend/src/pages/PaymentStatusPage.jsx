import { Link, useParams, useSearchParams } from 'react-router-dom';

const STATUS_COPY = {
  success: {
    badge: 'Payment successful',
    title: 'Your payment was completed',
    message:
      'SSLCommerz confirmed the transaction. You can open the order now or keep shopping.',
    tone: 'text-emerald-700',
    badgeClass: 'bg-emerald-100 text-emerald-700',
  },
  failed: {
    badge: 'Payment failed',
    title: 'The payment did not complete',
    message:
      'The order was created, but the gateway did not confirm payment. You can retry from the order page.',
    tone: 'text-rose-700',
    badgeClass: 'bg-rose-100 text-rose-700',
  },
  cancelled: {
    badge: 'Payment cancelled',
    title: 'The checkout was cancelled',
    message:
      'You can return to the order and try the payment again whenever you are ready.',
    tone: 'text-amber-700',
    badgeClass: 'bg-amber-100 text-amber-700',
  },
  pending: {
    badge: 'Payment processing',
    title: 'We are confirming your payment',
    message:
      'Your payment is being confirmed by the gateway. This usually takes a few seconds — your order will update automatically once it is verified.',
    tone: 'text-sky-700',
    badgeClass: 'bg-sky-100 text-sky-700',
  },
};

export default function PaymentStatusPage() {
  const { status } = useParams();
  const [searchParams] = useSearchParams();

  const normalizedStatus = (status || '').toLowerCase();
  const copy =
    STATUS_COPY[normalizedStatus] || STATUS_COPY.failed;

  const orderId = searchParams.get('orderId');
  const paymentId = searchParams.get('paymentId');
  const transactionId = searchParams.get('transactionId');

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card text-center space-y-5">
        <div className={`mx-auto inline-flex rounded-full px-3 py-1 text-sm font-semibold ${copy.badgeClass}`}>
          {copy.badge}
        </div>

        <div className="space-y-2">
          <h1 className={`text-2xl font-bold ${copy.tone}`}>{copy.title}</h1>
          <p className="text-slate-600 max-w-xl mx-auto">{copy.message}</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {orderId && (
            <Link to={`/orders/${orderId}`} className="btn-primary">
              View order
            </Link>
          )}
          <Link to="/orders" className="btn-secondary">
            My orders
          </Link>
          <Link to="/checkout" className="btn-secondary">
            Back to checkout
          </Link>
        </div>

        <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-left text-sm text-slate-600 space-y-1">
          <p>
            <span className="font-semibold text-slate-800">Transaction:</span>{' '}
            {transactionId || paymentId || 'N/A'}
          </p>
          {orderId && (
            <p>
              <span className="font-semibold text-slate-800">Order:</span> {orderId}
            </p>
          )}
          <p>
            <span className="font-semibold text-slate-800">Status:</span> {normalizedStatus || 'unknown'}
          </p>
        </div>
      </div>
    </div>
  );
}