// Axios client. Sends cookies (withCredentials) so the backend's httpOnly
// JWT cookie is included on every request — no need to store a token in JS.
import axios from 'axios';

// In dev we let Vite proxy /auth, /orders, /payments, etc. to the backend on
// the same origin, so the browser doesn't strip the cookie for cross-site
// POSTs (SameSite=Lax blocks them). In prod (or when an explicit base URL is
// set), use the absolute URL.
const baseURL = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({
  baseURL,
  withCredentials: true, // <-- send/receive cookies
  headers: { 'Content-Type': 'application/json' },
});

// On 401, the auth cookie is bad/missing — clear local role hint and let the
// AuthContext know so the UI doesn't get stuck on a "logged in" state.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(err);
  }
);

export default api;