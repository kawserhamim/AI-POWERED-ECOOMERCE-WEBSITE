// Top navigation bar. Adapts based on auth state. Includes mobile hamburger menu.
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import VoiceNav from './VoiceNav';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    logout();
    setMobileOpen(false);
    toast.success("You've been logged out");
    navigate('/');
  }

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-brand-600 text-white'
        : 'text-gray-700 hover:bg-brand-50 hover:text-brand-600'
    }`;

  const mobileLinkClass = ({ isActive }) =>
    `block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-slate-900 text-white'
        : 'text-slate-700 hover:bg-slate-100'
    }`;

  const initial = (user?.name || user?.email || '?')[0].toUpperCase();
  const roleLabel = user?.role === 'admin' ? 'Admin' : 'User';

  return (
    <header className="sticky top-0 z-30 border-b border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3 rounded-2xl px-2 py-1 transition hover:bg-slate-100/80">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/20">
            <span className="text-lg">◼</span>
          </div>
          <div className="leading-tight">
            <div className="text-lg font-semibold tracking-tight text-slate-900">ShopEasy</div>
            <div className="text-xs text-slate-500">Secure commerce</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-slate-200 bg-slate-50/90 p-1 md:flex">
          <NavLink to="/" end className={linkClass}>Home</NavLink>
          <NavLink to="/products" className={linkClass}>Products</NavLink>
          {isAuthenticated && !isAdmin && (
            <>
              <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
              <NavLink to="/orders" className={linkClass}>My Orders</NavLink>
              <NavLink to="/payments" className={linkClass}>Payments</NavLink>
            </>
          )}
          {isAdmin && (
            <>
              <NavLink to="/admin/dashboard" className={linkClass}>
                <span className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  Admin
                </span>
              </NavLink>
              <NavLink to="/admin" className={linkClass}>Manage</NavLink>
            </>
          )}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <VoiceNav />
          <Link
            to="/cart"
            id="navbar-cart-link"
            className="relative flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <span>Cart</span>
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-bold text-white">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1.5 pr-2 shadow-sm">
              <Link
                to="/profile"
                id="navbar-profile-link"
                className="flex items-center gap-2 rounded-full px-2 py-1.5 transition hover:bg-slate-100"
                title="My Profile"
              >
                <div className="flex h-8 w-8 select-none items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                  {initial}
                </div>
                <span className="hidden max-w-[140px] truncate text-sm font-medium text-slate-700 sm:inline">
                  {user?.name || user?.email}
                </span>
              </Link>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isAdmin ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                {roleLabel}
              </span>
              <button
                id="navbar-logout-btn"
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" id="navbar-login-link" className="btn-secondary text-sm">Login</Link>
              <Link to="/register" id="navbar-register-link" className="btn-primary text-sm">Sign Up</Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <VoiceNav />
          <Link to="/cart" className="relative rounded-full p-2 text-slate-700 hover:bg-slate-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-0.5 text-xs font-bold text-white">
                {itemCount}
              </span>
            )}
          </Link>
          <button
            id="mobile-menu-toggle"
            onClick={() => setMobileOpen((o) => !o)}
            className="rounded-full p-2 text-slate-700 transition hover:bg-slate-100"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileOpen && (
        <div className="space-y-2 border-t border-slate-200 bg-white/95 px-4 pb-4 pt-3 shadow-xl md:hidden">
          {isAuthenticated && (
            <div className="mb-1 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 font-bold text-white">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{user?.name || 'User'}</p>
                <p className="truncate text-xs text-slate-500">{user?.email}</p>
              </div>
            </div>
          )}

          <NavLink to="/" end className={mobileLinkClass} onClick={() => setMobileOpen(false)}>🏠 Home</NavLink>
          <NavLink to="/products" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>📦 Products</NavLink>

          {isAuthenticated ? (
            <>
              <NavLink to="/dashboard" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>Dashboard</NavLink>
              <NavLink to="/orders" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>My Orders</NavLink>
              <NavLink to="/payments" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>Payments</NavLink>
              <NavLink to="/profile" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>My Profile</NavLink>
              {isAdmin && (
                <>
                  <NavLink to="/admin/dashboard" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>Admin Dashboard</NavLink>
                  <NavLink to="/admin" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>Manage</NavLink>
                </>
              )}
              <button
                id="mobile-logout-btn"
                onClick={handleLogout}
                className="mt-1 flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Logout
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-secondary text-sm text-center">Login</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-primary text-sm text-center">Sign Up</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}