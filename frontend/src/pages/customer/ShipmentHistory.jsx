import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listShipments } from '../../api/shipments';
import StatusBadge from '../../components/StatusBadge';

export default function ShipmentHistory() {
  const [shipments, setShipments] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  async function load(reset = false) {
    setLoading(true);
    const params = { limit: 10, ...(status ? { status } : {}), ...(!reset && cursor ? { cursor } : {}) };
    const result = await listShipments(params);
    setShipments((prev) => (reset ? result.data : [...prev, ...result.data]));
    setCursor(result.pagination.nextCursor);
    setHasMore(result.pagination.hasMore);
    setLoading(false);
  }

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Shipment History</h1>
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
          <Link key={s.id} to={`/customer/shipments/${s.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50">
            <div>
              <p className="font-medium text-slate-900">{s.trackingId}</p>
              <p className="text-xs text-slate-500">{s.origin.city} &rarr; {s.destination.city} &middot; {s.weightKg}kg</p>
            </div>
            <StatusBadge status={s.status} />
          </Link>
        ))}
        {shipments.length === 0 && !loading && <p className="px-4 py-6 text-sm text-slate-500">No shipments found.</p>}
      </div>

      {hasMore && (
        <button
          onClick={() => load(false)}
          disabled={loading}
          className="mt-4 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          {loading ? 'Loading...' : 'Load more'}
        </button>
      )}
    </div>
  );
}
