// AuthContext — auth state is driven entirely by the httpOnly `auth_token` cookie.
// On startup we call /auth/me; if the cookie is valid the server returns the user,
// otherwise we treat the session as logged out. No role cookie is needed.
import { createContext, useContext, useEffect, useState } from 'react';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, check whether a valid session cookie exists.
  useEffect(() => {
    let active = true;
    authApi.getMe()
      .then(({ data }) => active && setUser(data.data.user))
      .catch(() => active && setUser(null))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  // Forced logout from the axios interceptor — keep React state in sync.
  useEffect(() => {
    const reset = () => setUser(null);
    window.addEventListener('auth:logout', reset);
    return () => window.removeEventListener('auth:logout', reset);
  }, []);

  async function login(email, password) {
    const { data } = await authApi.login({ email, password });
    setUser(data.data.user);
    return data.data.user;
  }

  async function register(payload) {
    const { data } = await authApi.register(payload);
    setUser(data.data.user);
    return data.data.user;
  }

  async function logout() {
    try { await authApi.logout(); } catch { /* session already gone — fine */ }
    setUser(null);
    window.dispatchEvent(new Event('auth:logout'));
  }

  const role = user?.role ?? null;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        isAuthenticated: !!user,
        isAdmin: role === 'admin',
        login,
        register,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);