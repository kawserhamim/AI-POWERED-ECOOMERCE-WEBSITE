// Profile page — update name / shipping address, change password.
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import * as authApi from '../api/auth';
import { getErrorMessage } from '../utils/error';

export default function ProfilePage() {
  const { user, setUser, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');

  // Address fields (backend stores it as a nested object on the user).
  const [addr, setAddr] = useState({
    fullName: user?.shippingAddress?.fullName || '',
    phone: user?.shippingAddress?.phone || '',
    line1: user?.shippingAddress?.line1 || '',
    line2: user?.shippingAddress?.line2 || '',
    city: user?.shippingAddress?.city || '',
    state: user?.shippingAddress?.state || '',
    postalCode: user?.shippingAddress?.postalCode || '',
    country: user?.shippingAddress?.country || '',
  });

  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '' });
  const [busy, setBusy] = useState(false);

  function updateAddr(field) {
    return (e) => setAddr({ ...addr, [field]: e.target.value });
  }
  function updatePwd(field) {
    return (e) => setPwd({ ...pwd, [field]: e.target.value });
  }

  async function saveProfile(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await authApi.updateProfile({
        name,
        shippingAddress: addr,
      });
      setUser(data.data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update profile'));
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await authApi.changePassword(pwd);
      toast.success('Password changed — please log in again');
      logout();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not change password'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-sm text-gray-500">Manage personal details and shipping information.</p>
      </div>

      <form onSubmit={saveProfile} className="card space-y-3">
        <h2 className="font-semibold">Personal info</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Name</label>
            <input
              className="input mt-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input className="input mt-1" value={user?.email || ''} disabled />
          </div>
        </div>

        <h3 className="font-semibold pt-3">Shipping address</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            ['fullName', 'Full name'],
            ['phone', 'Phone'],
            ['line1', 'Address line 1'],
            ['line2', 'Address line 2'],
            ['city', 'City'],
            ['state', 'State'],
            ['postalCode', 'Postal code'],
            ['country', 'Country'],
          ].map(([field, label]) => (
            <div key={field}>
              <label className="text-sm font-medium">{label}</label>
              <input
                className="input mt-1"
                value={addr[field]}
                onChange={updateAddr(field)}
              />
            </div>
          ))}
        </div>

        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      <form onSubmit={changePassword} className="card space-y-3">
        <h2 className="font-semibold">Change password</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Current password</label>
            <input
              type="password"
              className="input mt-1"
              value={pwd.currentPassword}
              onChange={updatePwd('currentPassword')}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">New password</label>
            <input
              type="password"
              minLength={6}
              className="input mt-1"
              value={pwd.newPassword}
              onChange={updatePwd('newPassword')}
              required
            />
          </div>
        </div>
        <button type="submit" disabled={busy} className="btn-primary">
          Update password
        </button>
      </form>
    </div>
  );
}