// Guards routes that require login or admin role.
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-gray-500">Loading…</div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  // A regular user on an admin page → send to their own dashboard.
  if (!adminOnly && isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return children;
}