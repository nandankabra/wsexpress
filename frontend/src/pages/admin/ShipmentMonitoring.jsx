import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listShipments } from '../../api/shipments';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { Select } from '../../components/ui/Select';
import { Activity, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function ShipmentMonitoring() {
  const [shipments, setShipments] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    listShipments({ limit: 50, ...(status ? { status } : {}) })
      .then((r) => {
        const list = Array.isArray(r) ? r : (r?.data || []);
        setShipments(list);
      })
      .catch(() => toast.error('Failed to query shipments'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [status]);

  const safeShipments = Array.isArray(shipments) ? shipments : (shipments?.data || []);

  const getBadgeVariant = (s) => {
    if (s === 'DELIVERED') return 'success';
    if (s === 'CANCELLED') return 'danger';
    if (['IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(s)) return 'primary';
    return 'warning';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Shipment Fleet Monitoring</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Real-time global telemetry stream across all active customer contracts.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="text-xs h-9 w-44"
          >
            <option value="">All Statuses</option>
            {['CREATED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="h-9">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-50/80 border-b border-border text-xs uppercase text-zinc-500 font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Tracking Number</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Corridor Route</th>
                  <th className="px-6 py-3.5">Assigned Carrier</th>
                  <th className="px-6 py-3.5 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-28" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-36" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-16 ml-auto" /></td>
                    </tr>
                  ))
                ) : safeShipments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-14 text-center text-xs text-zinc-500">
                      No matching shipments recorded.
                    </td>
                  </tr>
                ) : (
                  safeShipments.map((s) => (
                    <tr key={s.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-zinc-900 text-xs">
                        {s.trackingId || (s.id ? `#${s.id.slice(0, 8).toUpperCase()}` : '—')}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={getBadgeVariant(s.status)}>
                          {s.status?.replace(/_/g, ' ') || 'UNKNOWN'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-600">
                        <span className="font-medium text-zinc-900">{s.origin?.city || 'Origin'}</span>
                        <span className="text-zinc-400 mx-1.5">&rarr;</span>
                        <span className="font-medium text-zinc-900">{s.destination?.city || 'Destination'}</span>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {s.carrierId ? (
                          <span className="inline-flex items-center text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded font-mono text-[11px]">
                            {s.carrierId.slice(0, 8)}...
                          </span>
                        ) : (
                          <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-medium">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link to={`/admin/shipments/${s.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-indigo-600 hover:text-indigo-700">
                            Details <ExternalLink className="ml-1 h-3 w-3" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
