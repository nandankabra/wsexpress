import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getShipment, updateShipmentStatus, updateDelivery, assignCarrier } from '../api/shipments';
import { listTrackingEvents } from '../api/tracking';
import { listCarriers } from '../api/carriers';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';

const NEXT_STATUS = {
  CREATED: ['PICKED_UP', 'CANCELLED'],
  PICKED_UP: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

export default function ShipmentDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [shipment, setShipment] = useState(null);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [carriers, setCarriers] = useState([]);
  const [selectedCarrierId, setSelectedCarrierId] = useState('');

  async function load() {
    const s = await getShipment(id);
    setShipment(s);
    const e = await listTrackingEvents(s.trackingId).catch(() => ({ data: [] }));
    setEvents(e.data || []);
  }

  useEffect(() => {
    load().catch(() => setError('Could not load this shipment.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      listCarriers({ limit: 50 }).then((r) => setCarriers(r.data)).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleAssignCarrier() {
    if (!selectedCarrierId) return;
    setBusy(true);
    setError(null);
    try {
      await assignCarrier(id, selectedCarrierId, shipment.version);
      await load();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not assign carrier');
    } finally {
      setBusy(false);
    }
  }

  async function handleStatusChange(status) {
    setBusy(true);
    setError(null);
    try {
      await updateShipmentStatus(id, status, shipment.version);
      await load();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not update status');
    } finally {
      setBusy(false);
    }
  }

  async function handleMarkDelivered() {
    setBusy(true);
    setError(null);
    try {
      await updateDelivery(id, { actualDeliveryDate: new Date().toISOString().slice(0, 10), expectedVersion: shipment.version });
      await handleStatusChange('DELIVERED');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not mark as delivered');
    } finally {
      setBusy(false);
    }
  }

  if (error && !shipment) return <p className="p-8 text-red-600">{error}</p>;
  if (!shipment) return <p className="p-8 text-slate-500">Loading...</p>;

  const canManage = user && (user.role === 'CARRIER' || user.role === 'ADMIN');
  const nextOptions = NEXT_STATUS[shipment.status] || [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{shipment.trackingId}</h1>
        <StatusBadge status={shipment.status} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card title="Origin">
          <p className="text-sm text-slate-700">{shipment.origin.address}</p>
          <p className="text-sm text-slate-500">{shipment.origin.city}, {shipment.origin.country}</p>
        </Card>
        <Card title="Destination">
          <p className="text-sm text-slate-700">{shipment.destination.address}</p>
          <p className="text-sm text-slate-500">{shipment.destination.city}, {shipment.destination.country}</p>
        </Card>
        <Card title="Package">
          <p className="text-sm text-slate-700">{shipment.weightKg} kg &middot; {shipment.packageType}</p>
        </Card>
        <Card title="Price">
          <p className="text-sm text-slate-700">{shipment.quotedPrice} {shipment.currency}</p>
          <p className="text-xs text-slate-500">Est. delivery: {shipment.estimatedDeliveryDate}</p>
        </Card>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {user?.role === 'ADMIN' && !shipment.carrierId && (
        <Card title="Assign Carrier" className="mt-6">
          <div className="flex gap-2">
            <select
              value={selectedCarrierId}
              onChange={(e) => setSelectedCarrierId(e.target.value)}
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select a carrier...</option>
              {carriers.map((c) => (
                <option key={c.userId} value={c.userId}>
                  {c.companyName} {c.isVerified ? '' : '(unverified)'}
                </option>
              ))}
            </select>
            <button
              onClick={handleAssignCarrier}
              disabled={busy || !selectedCarrierId}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              Assign
            </button>
          </div>
        </Card>
      )}

      {canManage && nextOptions.length > 0 && (
        <Card title="Update Status" className="mt-6">
          <div className="flex flex-wrap gap-2">
            {nextOptions.map((status) => (
              <button
                key={status}
                disabled={busy}
                onClick={() => (status === 'DELIVERED' ? handleMarkDelivered() : handleStatusChange(status))}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                Mark as {status.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </Card>
      )}

      <Card title="Tracking History" className="mt-6">
        {events.length === 0 && <p className="text-sm text-slate-500">No tracking events yet.</p>}
        <ol className="space-y-3">
          {events.map((event) => (
            <li key={event.id} className="flex items-start gap-3 border-b border-slate-100 pb-3 last:border-0">
              <StatusBadge status={event.status} />
              <div>
                <p className="text-sm text-slate-700">{event.note || event.status}</p>
                <p className="text-xs text-slate-400">
                  {event.location ? `${event.location} - ` : ''}{new Date(event.timestamp).toLocaleString()}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
