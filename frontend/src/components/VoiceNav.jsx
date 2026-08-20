// VoiceNav — click the mic, then say things like "go home" or "open cart".
// Uses the browser's Web Speech API (Chrome/Edge). On unsupported browsers
// the button is disabled. Say "log out" to sign out.
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const SR = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null;

// Spoken phrase → route.
const ROUTES = [
  ['home', '/'],
  ['products', '/products'],
  ['cart', '/cart'],
  ['login', '/login'],
  ['register', '/register'],
  ['dashboard', '/dashboard'],
  ['orders', '/orders'],
  ['payments', '/payments'],
  ['profile', '/profile'],
  ['admin', '/admin/dashboard'],
];

function matchRoute(text) {
  for (const [phrase, path] of ROUTES) {
    if (text.includes(phrase)) return path;
  }
  return null;
}

export default function VoiceNav() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const recRef = useRef(null);
  const [listening, setListening] = useState(false);

  function handle(text) {
    const t = text.toLowerCase().trim();
    if (!t) return;

    if (t.includes('log out') || t.includes('logout') || t.includes('sign out')) {
      if (!isAuthenticated) return toast('You are not signed in.');
      logout();
      toast.success('Logged out.');
      navigate('/');
      return;
    }

    const path = matchRoute(t);
    if (!path) return toast(`Heard "${text}" — no matching command.`);

    if (path.startsWith('/admin') && !isAdmin) {
      return toast.error('Admin pages are for admins only.');
    }
    if ((path === '/login' || path === '/register') && isAuthenticated) {
      return toast('You are already signed in.');
    }
    toast.success(`Navigating to ${path}`);
    navigate(path);
  }

  function toggle() {
    if (!SR) return;
    if (listening) return recRef.current?.stop();

    const rec = new SR();
    rec.lang = 'en-US';
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const last = e.results[e.results.length - 1];
      if (last?.[0]) handle(last[0].transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => {
      setListening(false);
      toast.error('Voice recognition stopped.');
    };
    recRef.current = rec;
    setListening(true);
    rec.start();
  }

  useEffect(() => () => recRef.current?.stop(), []);

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!SR}
      title={SR ? (listening ? 'Listening… click to stop' : 'Click to use voice navigation') : 'Voice not supported'}
      aria-label="Voice navigation"
      className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
        !SR
          ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
          : listening
            ? 'border-rose-300 bg-rose-50 text-rose-600 animate-pulse'
            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
      }`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="2" width="6" height="12" rx="3" />
        <path d="M5 10a7 7 0 0 0 14 0" />
        <line x1="12" y1="19" x2="12" y2="22" />
      </svg>
    </button>
  );
}