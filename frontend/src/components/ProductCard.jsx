// Card used in product grids. Click goes to the detail page.
import { Link } from 'react-router-dom';
import RatingStars from './RatingStars';

export default function ProductCard({ product }) {
  const {
    _id,
    name,
    brand,
    price,
    discountPercent = 0,
    images = [],
    rating = 0,
    reviewsCount = 0,
    stock = 0,
  } = product;

  const discounted = discountPercent > 0 ? price - (price * discountPercent) / 100 : price;

  return (
    <Link
      to={`/products/${_id}`}
      className="card hover:shadow-md transition flex flex-col"
    >
      <div className="aspect-square bg-gray-100 rounded-md overflow-hidden flex items-center justify-center mb-3">
        {images[0] ? (
          <img
            src={images[0]}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-gray-400 text-sm">No image</span>
        )}
      </div>
      <p className="text-xs text-gray-500 uppercase">{brand}</p>
      <h3 className="font-semibold text-gray-800 line-clamp-2">{name}</h3>
      <div className="mt-1 flex items-center gap-2">
        <span className="font-bold text-brand-600">৳{discounted.toFixed(2)}</span>
        {discountPercent > 0 && (
          <span className="text-sm line-through text-gray-400">
            ৳{price.toFixed(2)}
          </span>
        )}
      </div>
      <div className="mt-1">
        <RatingStars value={rating} />
        <span className="text-xs text-gray-500 ml-1">({reviewsCount})</span>
      </div>
      <p className={`mt-2 text-xs ${stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
        {stock > 0 ? `In stock (${stock})` : 'Out of stock'}
      </p>
    </Link>
  );
}