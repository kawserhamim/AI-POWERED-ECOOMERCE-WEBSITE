// Shows a 0–5 star rating. `size` controls Tailwind text size.
export default function RatingStars({ value = 0, size = 'text-sm' }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className={`flex items-center gap-0.5 ${size} text-yellow-500`}>
      {stars.map((n) => (
        <span key={n}>{value >= n - 0.5 ? '★' : '☆'}</span>
      ))}
      <span className="ml-1 text-gray-500">{Number(value || 0).toFixed(1)}</span>
    </div>
  );
}