import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { trackPublic } from '../../api/shipments';
import { listTrackingEvents } from '../../api/tracking';
import StatusBadge from '../../components/StatusBadge';
import Card from '../../components/Card';

export default function TrackPage() {
  const [searchParams] = useSearchParams();
  const [trackingId, setTrackingId] = useState(searchParams.get('id') || '');
  const [shipment, setShipment] = useState(null);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!trackingId.trim()) return;
    setLoading(true);
    setError(null);
    setShipment(null);
    try {
      const [shipmentData, eventsData] = await Promise.all([
        trackPublic(trackingId.trim()),
        listTrackingEvents(trackingId.trim()).catch(() => ({ data: [] })),
      ]);
      setShipment(shipmentData);
      setEvents(eventsData.data || []);
    } catch (err) {
      setError('No shipment found for that tracking ID.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Track a Package</h1>
      <p className="mt-2 text-sm text-slate-600">Enter a tracking ID - no account needed.</p>

      <form onSubmit={handleSearch} className="mt-6 flex gap-2">
        <input
          value={trackingId}
          onChange={(e) => setTrackingId(e.target.value)}
          placeholder="e.g. STKABCDE12345"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-brand-600 px-5 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Track'}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {shipment && (
        <div className="mt-8 space-y-4">
          <Card title="Shipment Status">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-slate-900">{shipment.trackingId}</p>
                <p className="text-sm text-slate-600">
                  {shipment.originCity}, {shipment.originCountry} &rarr; {shipment.destinationCity}, {shipment.destinationCountry}
                </p>
              </div>
              <StatusBadge status={shipment.status} />
            </div>
            <p className="mt-3 text-sm text-slate-600">
              Estimated delivery: {shipment.estimatedDeliveryDate || 'N/A'}
              {shipment.actualDeliveryDate && ` (delivered ${shipment.actualDeliveryDate})`}
            </p>
          </Card>

          <Card title="Tracking History">
            {events.length === 0 && <p className="text-sm text-slate-500">No tracking events yet.</p>}
            <ol className="space-y-3">
              {events.map((event) => (
                <li key={event.id} className="flex items-start gap-3 border-b border-slate-100 pb-3 last:border-0">
                  <StatusBadge status={event.status} />
                  <div>
                    <p className="text-sm text-slate-700">{event.note || event.status}</p>
                    <p className="text-xs text-slate-400">
                      {event.location ? `${event.location} - ` : ''}
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      )}
    </div>
  );
}
