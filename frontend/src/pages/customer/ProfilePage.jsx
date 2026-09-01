import { useEffect, useState } from 'react';
import { getMyProfile, upsertMyProfile } from '../../api/customers';

const EMPTY = {
  fullName: '', email: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: '',
};

export default function ProfilePage() {
  const [form, setForm] = useState(EMPTY);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyProfile()
      .then((p) => setForm({ ...EMPTY, ...p }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await upsertMyProfile(form);
      setMessage('Profile saved.');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not save profile');
    }
  }

  if (loading) return <p className="p-8 text-slate-500">Loading...</p>;

  const fields = [
    ['fullName', 'Full name'], ['email', 'Email'], ['phone', 'Phone'],
    ['addressLine1', 'Address line 1'], ['addressLine2', 'Address line 2'],
    ['city', 'City'], ['state', 'State'], ['postalCode', 'Postal code'], ['country', 'Country'],
  ];

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {fields.map(([key, label]) => (
          <div key={key}>
            <label className="block text-sm font-medium text-slate-700">{label}</label>
            <input
              value={form[key] || ''}
              onChange={update(key)}
              required={key === 'fullName' || key === 'email'}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        ))}
        {message && <p className="text-sm text-green-600">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="rounded-md bg-brand-600 px-5 py-2 font-medium text-white hover:bg-brand-700">
          Save Profile
        </button>
      </form>
    </div>
  );
}
