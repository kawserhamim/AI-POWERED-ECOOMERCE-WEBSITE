// Products list page with search / filter / sort / pagination.
// URL query params drive the filters so deep-links work and refreshes are stable.
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getCategories, getProducts } from '../api/products';
import ProductCard from '../components/ProductCard';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'price-asc', label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
  { value: 'rating-desc', label: 'Top rated' },
  { value: 'name-asc', label: 'Name A→Z' },
];

export default function ProductsPage() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [pages, setPages] = useState(1);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  const search = params.get('search') || '';
  const category = params.get('category') || '';
  const brand = params.get('brand') || '';
  const sort = params.get('sort') || 'newest';
  const minPrice = params.get('minPrice') || '';
  const maxPrice = params.get('maxPrice') || '';
  const page = Number(params.get('page') || 1);

  // Fetch categories + brands once for the filter dropdowns.
  useEffect(() => {
    getCategories().then((res) => {
      setCategories(res.data.categories || []);
      setBrands(res.data.brands || []);
    });
  }, []);

  // Fetch products whenever the URL params change.
  useEffect(() => {
    let active = true;
    setLoading(true);
    getProducts({
      search: search || undefined,
      category: category || undefined,
      brand: brand || undefined,
      sort,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      page,
      limit: 12,
    })
      .then((res) => {
        if (!active) return;
        setProducts(res.data.products || []);
        setPages(res.data.pages || 1);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [search, category, brand, sort, minPrice, maxPrice, page]);

  function update(name, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value);
    else next.delete(name);
    // Any filter change resets pagination to 1
    next.delete('page');
    setParams(next);
  }

  return (
    <div className="space-y-6">
      <div className="card grid md:grid-cols-5 gap-3">
        <input
          placeholder="Search products…"
          defaultValue={search}
          onKeyDown={(e) => {
            if (e.key === 'Enter') update('search', e.currentTarget.value);
          }}
          className="input md:col-span-2"
        />
        <select
          className="input"
          value={category}
          onChange={(e) => update('category', e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          className="input"
          value={brand}
          onChange={(e) => update('brand', e.target.value)}
        >
          <option value="">All brands</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <select
          className="input"
          value={sort}
          onChange={(e) => update('sort', e.target.value)}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <div className="md:col-span-2 flex gap-2">
          <input
            type="number"
            placeholder="Min price"
            defaultValue={minPrice}
            onBlur={(e) => update('minPrice', e.target.value)}
            className="input"
          />
          <input
            type="number"
            placeholder="Max price"
            defaultValue={maxPrice}
            onBlur={(e) => update('maxPrice', e.target.value)}
            className="input"
          />
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : products.length === 0 ? (
        <EmptyState
          title="No products match your filters"
          message="Try clearing some filters."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>

          {pages > 1 && (
            <div className="flex justify-center gap-2">
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => {
                const next = new URLSearchParams(params);
                next.set('page', n);
                return (
                  <button
                    key={n}
                    onClick={() => setParams(next)}
                    className={`px-3 py-1 rounded border ${
                      n === page
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}