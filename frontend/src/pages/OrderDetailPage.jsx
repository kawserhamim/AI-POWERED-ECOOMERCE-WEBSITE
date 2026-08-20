// Order detail — full breakdown plus a "Pay" / "Cancel" action depending on status.
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { cancelOrder, getOrderById } from '../api/orders';
import { createPayment } from '../api/payments';
import { fmtDate, fmtMoney, statusColor } from '../utils/format';
import { getErrorMessage } from '../utils/error';
import Spinner from '../components/Spinner';

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  function load() {
    setLoading(true);
    getOrderById(id)
      .then((res) => setOrder(res.data.order || res.data.data?.order))
      .catch(() => toast.error('Could not load order'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleCancel() {
    setBusy(true);
    try {
      await cancelOrder(id);
      toast.success('Order cancelled');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not cancel'));
    } finally {
      setBusy(false);
    }
  }

  async function handlePay() {
    setBusy(true);
    try {
      const paymentRes = await createPayment(id, 'sslcommerz');
      const gatewayUrl = paymentRes.data.gatewayUrl || paymentRes.data.data?.gatewayUrl;

      if (gatewayUrl) {
        window.location.assign(gatewayUrl);
        return;
      }

      toast.success('Payment successful');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not pay'));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Spinner />;
  if (!order) return <p>Order not found</p>;

  const canCancel = ['created', 'processing'].includes(order.status);
  const canPay = order.status === 'created' && !order.paidAt;

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(-1)} className="text-sm text-brand-600 hover:underline">
        ← Back
      </button>
      <div className="card space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold">
              Order #{order._id.slice(-6).toUpperCase()}
            </h1>
            <p className="text-sm text-gray-500">
              Placed {fmtDate(order.createdAt)}
            </p>
          </div>
          <span className={`badge ${statusColor(order.status)}`}>
            {order.status}
          </span>
        </div>

        <hr />
        <div className="space-y-1">
          {order.items.map((it, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span>
                {it.name} × {it.quantity}
              </span>
              <span>{fmtMoney(it.price * it.quantity)}</span>
            </div>
          ))}
        </div>

        <hr />
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{fmtMoney(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>{fmtMoney(order.shipping)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax</span>
            <span>{fmtMoney(order.tax)}</span>
          </div>
          <div className="flex justify-between font-bold pt-1">
            <span>Total</span>
            <span>{fmtMoney(order.totalAmount)}</span>
          </div>
        </div>

        {order.shippingAddress && (
          <div className="pt-3 text-sm text-gray-600">
            <p className="font-semibold text-gray-700">Ship to:</p>
            <p>
              {order.shippingAddress.fullName}, {order.shippingAddress.line1},{' '}
              {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
              {order.shippingAddress.postalCode}, {order.shippingAddress.country}
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-3">
          {canPay && (
            <button onClick={handlePay} disabled={busy} className="btn-primary">
              Pay now
            </button>
          )}
          {canCancel && (
            <button onClick={handleCancel} disabled={busy} className="btn-danger">
              Cancel order
            </button>
          )}
        </div>
      </div>
    </div>
  );
}