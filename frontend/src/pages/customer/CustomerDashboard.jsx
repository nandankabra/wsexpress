import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listShipments } from '../../api/shipments';
import { getMyProfile } from '../../api/customers';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';

export default function CustomerDashboard() {
  const [profile, setProfile] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getMyProfile().catch(() => null),
      listShipments({ limit: 5 }).catch(() => ({ data: [] })),
    ]).then(([profileData, shipmentsData]) => {
      setProfile(profileData);
      setShipments(shipmentsData.data || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="p-8 text-slate-500">Loading dashboard...</p>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Welcome{profile ? `, ${profile.fullName}` : ''}</h1>

      {!profile && (
        <div className="mt-4 rounded-md bg-amber-50 p-4 text-sm text-amber-800">
          You haven't set up your profile yet.{' '}
          <Link to="/customer/profile" className="font-medium underline">Complete it now</Link>.
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Link to="/customer/create" className="rounded-lg border border-slate-200 bg-white p-5 hover:border-brand-400">
          <h3 className="font-semibold text-slate-900">Create Shipment</h3>
          <p className="mt-1 text-sm text-slate-600">Get a quote and ship a package.</p>
        </Link>
        <Link to="/customer/history" className="rounded-lg border border-slate-200 bg-white p-5 hover:border-brand-400">
          <h3 className="font-semibold text-slate-900">Shipment History</h3>
          <p className="mt-1 text-sm text-slate-600">View all your past and current shipments.</p>
        </Link>
        <Link to="/track" className="rounded-lg border border-slate-200 bg-white p-5 hover:border-brand-400">
          <h3 className="font-semibold text-slate-900">Track a Package</h3>
          <p className="mt-1 text-sm text-slate-600">Look up any tracking ID.</p>
        </Link>
      </div>

      <div className="mt-8">
        <Card title="Recent Shipments">
          {shipments.length === 0 && <p className="text-sm text-slate-500">No shipments yet.</p>}
          <div className="divide-y divide-slate-100">
            {shipments.map((s) => (
              <Link
                key={s.id}
                to={`/customer/shipments/${s.id}`}
                className="flex items-center justify-between py-3 hover:bg-slate-50"
              >
                <div>
                  <p className="font-medium text-slate-900">{s.trackingId}</p>
                  <p className="text-xs text-slate-500">
                    {s.origin.city} &rarr; {s.destination.city}
                  </p>
                </div>
                <StatusBadge status={s.status} />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
