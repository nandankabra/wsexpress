import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listShipments } from '../../api/shipments';
import StatusBadge from '../../components/StatusBadge';

export default function ShipmentMonitoring() {
  const [shipments, setShipments] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listShipments({ limit: 50, ...(status ? { status } : {}) })
      .then((r) => setShipments(r.data))
      .finally(() => setLoading(false));
  }, [status]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Shipment Monitoring</h1>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        >
          <option value="">All statuses</option>
          {['CREATED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="mt-6 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
        {shipments.map((s) => (
          <Link key={s.id} to={`/admin/shipments/${s.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50">
            <div>
              <p className="font-medium text-slate-900">{s.trackingId}</p>
              <p className="text-xs text-slate-500">
                {s.origin.city} &rarr; {s.destination.city} &middot; {s.carrierId ? 'Assigned' : 'Unassigned'}
              </p>
            </div>
            <StatusBadge status={s.status} />
          </Link>
        ))}
        {shipments.length === 0 && !loading && <p className="px-4 py-6 text-sm text-slate-500">No shipments found.</p>}
      </div>
    </div>
  );
}
