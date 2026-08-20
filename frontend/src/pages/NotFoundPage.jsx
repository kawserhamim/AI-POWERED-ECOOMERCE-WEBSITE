import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="text-center py-20">
      <p className="text-6xl font-bold text-gray-300">404</p>
      <h1 className="text-2xl font-bold mt-2">Page not found</h1>
      <Link to="/" className="btn-primary mt-4 inline-block">
        Go home
      </Link>
    </div>
  );
}