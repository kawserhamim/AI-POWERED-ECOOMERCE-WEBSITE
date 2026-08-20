// Checkout page — collects a shipping address, then places the order and pays.
// Backend computes shipping ($5) + 8% tax on its side.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { createOrder } from '../api/orders';
import { createPayment } from '../api/payments';
import { fmtMoney } from '../utils/format';
import { getErrorMessage } from '../utils/error';

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const [addr, setAddr] = useState({
    fullName: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });
  const [method, setMethod] = useState('sslcommerz');
  const [busy, setBusy] = useState(false);

  // Estimated totals shown to the user before submission.
  const shipping = subtotal > 0 ? 5 : 0;
  const tax = +(subtotal * 0.08).toFixed(2);
  const total = +(subtotal + shipping + tax).toFixed(2);

  function update(field) {
    return (e) => setAddr({ ...addr, [field]: e.target.value });
  }

  async function placeOrder(e) {
    e.preventDefault();
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    setBusy(true);
    try {
      // 1) Create the order from current cart items
      const orderRes = await createOrder({
        items: items.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
        })),
        shippingAddress: addr,
      });
      const order = orderRes.data.order || orderRes.data.data?.order;

      const paymentRes = await createPayment(order._id, method);
      const payment = paymentRes.data.payment || paymentRes.data.data?.payment;
      const gatewayUrl = paymentRes.data.gatewayUrl || paymentRes.data.data?.gatewayUrl;

      await clear();

      if (gatewayUrl) {
        window.location.assign(gatewayUrl);
        return;
      }

      toast.success('Order placed!');
      navigate(
        `/payment/success?orderId=${order._id}&paymentId=${payment?._id || ''}&transactionId=${payment?.transactionId || ''}`
      );
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not place order'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <form onSubmit={placeOrder} className="lg:col-span-2 card space-y-3">
        <h2 className="font-bold text-lg">Shipping address</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            ['fullName', 'Full name'],
            ['phone', 'Phone'],
            ['line1', 'Address line 1'],
            ['line2', 'Address line 2'],
            ['city', 'City'],
            ['state', 'State'],
            ['postalCode', 'Postal code'],
            ['country', 'Country'],
          ].map(([field, label]) => (
            <div key={field}>
              <label className="text-sm font-medium">{label}</label>
              <input
                required
                className="input mt-1"
                value={addr[field]}
                onChange={update(field)}
              />
            </div>
          ))}
        </div>

        <h2 className="font-bold text-lg pt-3">Payment method</h2>
        <div className="flex gap-3">
          {['sslcommerz', 'cod'].map((m) => (
            <label
              key={m}
              className={`flex-1 border rounded-md p-3 text-sm cursor-pointer ${
                method === m
                  ? 'border-brand-600 bg-brand-50'
                  : 'border-gray-300'
              }`}
            >
              <input
                type="radio"
                value={m}
                checked={method === m}
                onChange={() => setMethod(m)}
                className="mr-2"
              />
              {m === 'sslcommerz' ? 'SSLCommerz' : m.toUpperCase()}
            </label>
          ))}
        </div>

        <button disabled={busy} className="btn-primary w-full">
          {busy ? 'Placing order…' : `Place order — ${fmtMoney(total)}`}
        </button>
      </form>

      <aside className="card h-fit space-y-2">
        <h3 className="font-bold">Summary</h3>
        {items.map((it) => {
          const p = it.product || {};
          const line = it.lineTotal ?? p.price * it.quantity;
          return (
            <div key={it.productId} className="flex justify-between text-sm">
              <span className="truncate">
                {p.name} × {it.quantity}
              </span>
              <span>{fmtMoney(line)}</span>
            </div>
          );
        })}
        <hr />
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>{fmtMoney(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Shipping</span>
          <span>{fmtMoney(shipping)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Tax (8%)</span>
          <span>{fmtMoney(tax)}</span>
        </div>
        <div className="flex justify-between font-bold pt-2">
          <span>Total</span>
          <span>{fmtMoney(total)}</span>
        </div>
      </aside>
    </div>
  );
}