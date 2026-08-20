// Admin product table with create / edit / delete.
// This is the ONLY place products can be added/edited/deleted from the UI —
// it's rendered inside AdminPage, which is wrapped in <ProtectedRoute adminOnly>
// (see App.jsx), and every mutating call is also enforced server-side by
// `requireRole("admin")` on the backend routes. Regular users never see this.
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from '../api/products';
import { fmtMoney } from '../utils/format';
import { getErrorMessage } from '../utils/error';
import Spinner from '../components/Spinner';

// Mirrors backend/models/Product.js exactly.
const EMPTY = {
  name: '',
  brand: '',
  category: '',
  sku: '',
  description: '',
  price: 0,
  currency: 'USD',
  discountPercent: 0,
  stock: 0,
  images: '', // comma-separated URLs
  goodSides: '', // comma-separated highlights
  tags: '', // comma-separated tags
  specifications: '', // one "Key: Value" per line
  warranty: '1 Year Manufacturer Warranty',
  releaseYear: '',
};

// Product.specifications is a Mongoose Map<string,string>. The API returns
// it as a plain object; the form edits it as line-delimited "Key: Value" text.
function specsToText(specs) {
  if (!specs) return '';
  const entries = specs instanceof Map ? [...specs.entries()] : Object.entries(specs);
  return entries.map(([k, v]) => `${k}: ${v}`).join('\n');
}

function textToSpecs(text) {
  const specs = {};
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const idx = line.indexOf(':');
      if (idx === -1) return;
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      if (key) specs[key] = value;
    });
  return specs;
}

function csvToArray(text) {
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function ProductsAdmin() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    getProducts({ limit: 100 })
      .then((res) => setProducts(res.data.products || []))
      .catch((err) => toast.error(getErrorMessage(err, 'Could not load products')))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  function startCreate() {
    setEditing('new');
    setForm(EMPTY);
  }

  function startEdit(p) {
    setEditing(p._id);
    setForm({
      name: p.name || '',
      brand: p.brand || '',
      category: p.category || '',
      sku: p.sku || '',
      description: p.description || '',
      price: p.price ?? 0,
      currency: p.currency || 'USD',
      discountPercent: p.discountPercent ?? 0,
      stock: p.stock ?? 0,
      images: (p.images || []).join(', '),
      goodSides: (p.goodSides || []).join(', '),
      tags: (p.tags || []).join(', '),
      specifications: specsToText(p.specifications),
      warranty: p.warranty || '1 Year Manufacturer Warranty',
      releaseYear: p.releaseYear || '',
    });
    setTimeout(
      () => document.getElementById('product-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      0
    );
  }

  function cancel() {
    setEditing(null);
  }

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      brand: form.brand.trim(),
      category: form.category.trim(),
      sku: form.sku.trim() || undefined,
      description: form.description.trim(),
      price: Number(form.price),
      currency: form.currency.trim() || 'USD',
      discountPercent: Number(form.discountPercent) || 0,
      stock: Number(form.stock) || 0,
      images: csvToArray(form.images),
      goodSides: csvToArray(form.goodSides),
      tags: csvToArray(form.tags),
      specifications: textToSpecs(form.specifications),
      warranty: form.warranty.trim() || undefined,
      releaseYear: form.releaseYear ? Number(form.releaseYear) : undefined,
    };
    try {
      if (editing === 'new') {
        await createProduct(payload);
        toast.success('Product created');
      } else {
        await updateProduct(editing, payload);
        toast.success('Product updated');
      }
      setEditing(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Save failed'));
    } finally {
      setSaving(false);
    }
  }

  async function remove(p) {
    console.log('[remove] click', { id: p?._id, name: p?.name });
    if (!p?._id) {
      toast.error('Delete failed: missing product id');
      return;
    }
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try {
      await deleteProduct(p._id);
      console.log('[remove] success', p._id);
      toast.success('Product deleted');
      load();
    } catch (err) {
      console.error('[remove] error', err?.response?.status, err?.response?.data, err?.message);
      toast.error(getErrorMessage(err, 'Delete failed'));
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{products.length} products</p>
        {!editing && (
          <button onClick={startCreate} className="btn-primary">
            + New product
          </button>
        )}
      </div>

      {editing && (
        <form id="product-form" onSubmit={save} className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">
              {editing === 'new' ? 'Add new product' : 'Edit product'}
            </h3>
            <span className="badge bg-brand-100 text-brand-700">Admin only</span>
          </div>

          {/* Basics */}
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500 mb-2">Basics</p>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Name *</label>
                <input className="input mt-1" required value={form.name} onChange={update('name')} />
              </div>
              <div>
                <label className="text-sm font-medium">Brand *</label>
                <input className="input mt-1" required value={form.brand} onChange={update('brand')} />
              </div>
              <div>
                <label className="text-sm font-medium">Category *</label>
                <input className="input mt-1" required value={form.category} onChange={update('category')} />
              </div>
              <div>
                <label className="text-sm font-medium">SKU</label>
                <input className="input mt-1" placeholder="Optional — must be unique" value={form.sku} onChange={update('sku')} />
              </div>
            </div>
            <div className="mt-3">
              <label className="text-sm font-medium">Description *</label>
              <textarea
                className="input mt-1 min-h-[80px]"
                required
                value={form.description}
                onChange={update('description')}
              />
            </div>
          </div>

          {/* Pricing & stock */}
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500 mb-2">Pricing &amp; stock</p>
            <div className="grid md:grid-cols-4 gap-3">
              <div>
                <label className="text-sm font-medium">Price *</label>
                <input className="input mt-1" type="number" min="0" step="0.01" required value={form.price} onChange={update('price')} />
              </div>
              <div>
                <label className="text-sm font-medium">Currency</label>
                <input className="input mt-1" value={form.currency} onChange={update('currency')} />
              </div>
              <div>
                <label className="text-sm font-medium">Discount %</label>
                <input className="input mt-1" type="number" min="0" max="100" value={form.discountPercent} onChange={update('discountPercent')} />
              </div>
              <div>
                <label className="text-sm font-medium">Stock</label>
                <input className="input mt-1" type="number" min="0" value={form.stock} onChange={update('stock')} />
              </div>
            </div>
          </div>

          {/* Media */}
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500 mb-2">Media</p>
            <label className="text-sm font-medium">Image URLs</label>
            <input
              className="input mt-1"
              placeholder="https://…, https://… (comma-separated)"
              value={form.images}
              onChange={update('images')}
            />
          </div>

          {/* Details */}
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500 mb-2">Details</p>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Highlights / good sides</label>
                <input
                  className="input mt-1"
                  placeholder="Fast charging, Lightweight (comma-separated)"
                  value={form.goodSides}
                  onChange={update('goodSides')}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tags</label>
                <input
                  className="input mt-1"
                  placeholder="electronics, sale (comma-separated)"
                  value={form.tags}
                  onChange={update('tags')}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Warranty</label>
                <input className="input mt-1" value={form.warranty} onChange={update('warranty')} />
              </div>
              <div>
                <label className="text-sm font-medium">Release year</label>
                <input className="input mt-1" type="number" placeholder="2025" value={form.releaseYear} onChange={update('releaseYear')} />
              </div>
            </div>
            <div className="mt-3">
              <label className="text-sm font-medium">Specifications</label>
              <textarea
                className="input mt-1 min-h-[80px] font-mono text-xs"
                placeholder={'One per line, e.g.\nRAM: 16GB\nStorage: 512GB SSD'}
                value={form.specifications}
                onChange={update('specifications')}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : editing === 'new' ? 'Create product' : 'Save changes'}
            </button>
            <button type="button" onClick={cancel} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm bg-white rounded shadow-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Brand</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">
                  No products yet — click "+ New product" to add one.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p._id} className="border-t">
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3">{p.brand}</td>
                  <td className="p-3">{p.category}</td>
                  <td className="p-3">{fmtMoney(p.price, p.currency)}</td>
                  <td className="p-3">
                    <span className={p.stock > 0 ? '' : 'text-red-600 font-semibold'}>{p.stock}</span>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button onClick={() => startEdit(p)} className="text-brand-600 hover:underline">
                      Edit
                    </button>
                    <button onClick={() => remove(p)} className="text-red-600 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
