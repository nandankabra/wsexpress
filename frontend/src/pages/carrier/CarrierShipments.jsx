import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listShipments } from '../../api/shipments';
import StatusBadge from '../../components/StatusBadge';

export default function CarrierShipments() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listShipments({ limit: 50 })
      .then((r) => setShipments(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-8 text-slate-500">Loading...</p>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">My Shipments</h1>
      <p className="mt-1 text-sm text-slate-600">Assigned to you, plus unassigned shipments available to claim.</p>

      <div className="mt-6 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
        {shipments.map((s) => (
          <Link key={s.id} to={`/carrier/shipments/${s.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50">
            <div>
              <p className="font-medium text-slate-900">{s.trackingId}</p>
              <p className="text-xs text-slate-500">
                {s.origin.city} &rarr; {s.destination.city} &middot; {s.weightKg}kg
                {!s.carrierId && <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-brand-600">Unassigned</span>}
              </p>
            </div>
            <StatusBadge status={s.status} />
          </Link>
        ))}
        {shipments.length === 0 && <p className="px-4 py-6 text-sm text-slate-500">No shipments right now.</p>}
      </div>
    </div>
  );
}
