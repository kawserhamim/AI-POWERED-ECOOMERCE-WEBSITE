// Register form. POST /auth/register with name, email, password, role.
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/error';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [busy, setBusy] = useState(false);

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await register(form);
      toast.success('Account created!');
      navigate('/');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Registration failed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 card space-y-5">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create account</h1>
        <p className="text-sm text-gray-500 mt-1">Choose a role and start with a professional-grade checkout experience.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-sm font-medium">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={update('name')}
            className="input mt-1"
            placeholder="Jane Doe"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={update('email')}
            className="input mt-1"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={update('password')}
            className="input mt-1"
            placeholder="At least 6 characters"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Account role</label>
          <select
            value={form.role}
            onChange={update('role')}
            className="input mt-1"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">Admin access should only be granted to trusted team members.</p>
        </div>
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? 'Creating account…' : 'Sign Up'}
        </button>
      </form>

      <p className="text-sm text-gray-600 mt-4">
        Already have one?{' '}
        <Link to="/login" className="text-brand-600 hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
}