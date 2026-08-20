// Product detail page. Shows the product, lets the user add to cart, and lists reviews.
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  createReview,
  deleteReview,
  getProductById,
  getReviews,
  updateReview,
} from '../api/products';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { fmtMoney, fmtDate } from '../utils/format';
import { getErrorMessage } from '../utils/error';
import RatingStars from '../components/RatingStars';
import Spinner from '../components/Spinner';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  // Review form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);

  function reload() {
    setLoading(true);
    Promise.all([getProductById(id), getReviews(id)])
      .then(([p, r]) => {
        setProduct(p.data.product);
        setReviews(r.data.reviews || r.data || []);
      })
      .catch(() => toast.error('Could not load product'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleAdd() {
    if (!isAuthenticated) {
      toast('Please log in to add items to your cart');
      navigate('/login');
      return;
    }
    try {
      await addItem(id, 1);
      toast.success('Added to cart');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not add to cart'));
    }
  }

  async function submitReview(e) {
    e.preventDefault();
    setBusy(true);
    try {
      if (editingId) {
        await updateReview(id, editingId, { rating, comment });
        toast.success('Review updated');
      } else {
        await createReview(id, { rating, comment });
        toast.success('Review posted');
      }
      setComment('');
      setRating(5);
      setEditingId(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save review'));
    } finally {
      setBusy(false);
    }
  }

  function startEdit(r) {
    setEditingId(r._id);
    setRating(r.rating);
    setComment(r.comment);
  }

  async function handleDelete(r) {
    if (!confirm('Delete this review?')) return;
    try {
      await deleteReview(id, r._id);
      toast.success('Review deleted');
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete'));
    }
  }

  if (loading) return <Spinner />;
  if (!product) return <p className="text-center py-10">Product not found</p>;

  const discounted =
    product.discountPercent > 0
      ? product.price - (product.price * product.discountPercent) / 100
      : product.price;

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="aspect-square bg-gray-100 rounded-md overflow-hidden mb-3 flex items-center justify-center">
            {product.images?.[activeImage] ? (
              <img
                src={product.images[activeImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-gray-400">No image</span>
            )}
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`w-16 h-16 rounded border overflow-hidden ${
                    i === activeImage ? 'border-brand-600' : 'border-gray-200'
                  }`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-sm uppercase text-gray-500">{product.brand}</p>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <RatingStars value={product.rating} size="text-base" />
          <p className="text-gray-600">{product.description}</p>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-brand-600">
              {fmtMoney(discounted, product.currency)}
            </span>
            {product.discountPercent > 0 && (
              <>
                <span className="line-through text-gray-400">
                  {fmtMoney(product.price, product.currency)}
                </span>
                <span className="badge bg-red-100 text-red-700">
                  -{product.discountPercent}%
                </span>
              </>
            )}
          </div>

          <p
            className={`text-sm ${
              product.stock > 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {product.stock > 0 ? `In stock (${product.stock})` : 'Out of stock'}
          </p>

          <button
            disabled={product.stock <= 0}
            onClick={handleAdd}
            className="btn-primary"
          >
            Add to cart
          </button>

          {product.goodSides?.length > 0 && (
            <div>
              <h3 className="font-semibold mt-4">Highlights</h3>
              <ul className="list-disc list-inside text-sm text-gray-700">
                {product.goodSides.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {product.specifications &&
            Object.keys(product.specifications).length > 0 && (
              <div>
                <h3 className="font-semibold mt-4">Specifications</h3>
                <table className="w-full text-sm">
                  <tbody>
                    {Object.entries(product.specifications).map(([k, v]) => (
                      <tr key={k} className="border-b">
                        <td className="py-1 pr-3 font-medium text-gray-600">{k}</td>
                        <td className="py-1">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      </div>

      {/* Reviews */}
      <section>
        <h2 className="text-xl font-bold mb-3">Reviews</h2>

        {isAuthenticated ? (
          <form onSubmit={submitReview} className="card space-y-2 mb-4">
            <h3 className="font-semibold">
              {editingId ? 'Edit your review' : 'Leave a review'}
            </h3>
            <div className="flex items-center gap-2">
              <label className="text-sm">Rating:</label>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="input max-w-[6rem]"
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} ★
                  </option>
                ))}
              </select>
            </div>
            <textarea
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="input min-h-[80px]"
              placeholder="Share your thoughts…"
            />
            <div className="flex gap-2">
              <button type="submit" disabled={busy} className="btn-primary">
                {editingId ? 'Save' : 'Post review'}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setEditingId(null);
                    setComment('');
                    setRating(5);
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        ) : (
          <p className="text-sm text-gray-500 mb-4">Log in to leave a review.</p>
        )}

        {reviews.length === 0 ? (
          <p className="text-gray-500">No reviews yet.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => {
              const mine = r.userId === user?.id || r.userId?._id === user?.id;
              return (
                <div key={r._id} className="card">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">
                        {r.userId?.name || 'User'}
                      </p>
                      <RatingStars value={r.rating} />
                      <p className="text-xs text-gray-500">
                        {fmtDate(r.createdAt)}
                      </p>
                    </div>
                    {mine && (
                      <div className="flex gap-2">
                        <button
                          className="text-sm text-brand-600 hover:underline"
                          onClick={() => startEdit(r)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-sm text-red-600 hover:underline"
                          onClick={() => handleDelete(r)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-gray-700">{r.comment}</p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}