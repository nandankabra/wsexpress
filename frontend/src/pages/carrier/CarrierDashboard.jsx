import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listShipments } from '../../api/shipments';
import { getMyCarrierProfile, upsertMyCarrierProfile } from '../../api/carriers';
import Card from '../../components/Card';

const EMPTY = { companyName: '', contactEmail: '', contactPhone: '', vehicleType: '', licenseNumber: '', serviceAreas: '' };

export default function CarrierDashboard() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [counts, setCounts] = useState({ assigned: 0, available: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      getMyCarrierProfile().catch(() => null),
      listShipments({ limit: 50 }).catch(() => ({ data: [] })),
    ]).then(([profileData, shipmentsData]) => {
      setProfile(profileData);
      if (profileData) setForm({ ...EMPTY, ...profileData });
      const shipments = shipmentsData.data || [];
      setCounts({
        assigned: shipments.filter((s) => s.carrierId).length,
        available: shipments.filter((s) => !s.carrierId).length,
      });
      setLoading(false);
    });
  }, []);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const saved = await upsertMyCarrierProfile(form);
      setProfile(saved);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="p-8 text-slate-500">Loading...</p>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Carrier Dashboard</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link to="/carrier/shipments" className="rounded-lg border border-slate-200 bg-white p-5 hover:border-brand-400">
          <p className="text-3xl font-bold text-slate-900">{counts.assigned}</p>
          <p className="text-sm text-slate-600">Assigned to me</p>
        </Link>
        <Link to="/carrier/shipments" className="rounded-lg border border-slate-200 bg-white p-5 hover:border-brand-400">
          <p className="text-3xl font-bold text-slate-900">{counts.available}</p>
          <p className="text-sm text-slate-600">Available to claim</p>
        </Link>
      </div>

      <Card title={profile ? 'Carrier Profile' : 'Complete Your Carrier Profile'} className="mt-8">
        <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
          {[
            ['companyName', 'Company name', true],
            ['contactEmail', 'Contact email', true],
            ['contactPhone', 'Contact phone', false],
            ['vehicleType', 'Vehicle type', false],
            ['licenseNumber', 'License number', false],
            ['serviceAreas', 'Service areas', false],
          ].map(([key, label, required]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-700">{label}</label>
              <input
                value={form[key] || ''}
                onChange={update(key)}
                required={required}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          ))}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-brand-600 px-5 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
