// Home page — hero + featured products + categories strip.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getFeaturedProducts, getCategories } from '../api/products';
import ProductCard from '../components/ProductCard';
import Spinner from '../components/Spinner';

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([getFeaturedProducts(), getCategories()])
      .then(([f, c]) => {
        if (!active) return;
        setFeatured(f.data.products || []);
        setCategories(c.data.categories || []);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-10">
      <section className="bg-gradient-to-r from-brand-600 to-brand-700 text-white rounded-xl p-8 md:p-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          Shop the latest products
        </h1>
        <p className="opacity-90 max-w-xl mb-4">
          Great deals, fast checkout, and easy returns — all in one place.
        </p>
        <Link to="/products" className="btn bg-white text-brand-700 hover:bg-gray-100">
          Browse all products
        </Link>
      </section>

      {categories.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-3">Shop by category</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link
                key={c}
                to={`/products?category=${encodeURIComponent(c)}`}
                className="px-3 py-1.5 bg-white border rounded-full text-sm hover:bg-brand-50 hover:border-brand-500"
              >
                {c}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xl font-bold mb-3">Featured products</h2>
        {loading ? (
          <Spinner />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {featured.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}