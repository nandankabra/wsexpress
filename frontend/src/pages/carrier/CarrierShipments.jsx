import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listShipments } from '../../api/shipments';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { Input } from '../../components/ui/Input';
import { Search, ExternalLink, Truck, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import Scanner from '../../components/Scanner';
import { Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CarrierShipments() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const navigate = useNavigate();

  function load() {
    setLoading(true);
    listShipments()
      .then((res) => {
        const items = Array.isArray(res) ? res : (res?.data || []);
        setShipments(items);
      })
      .catch(() => toast.error('Failed to load fleet shipments'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  const handleScan = (decodedText) => {
    setShowScanner(false);
    toast.success(`Scanned: ${decodedText}`);
    // Extract ID or STK code
    const s = safeShipments.find(s => s.trackingId === decodedText || s.id === decodedText);
    if (s) {
      navigate(`/carrier/shipments/${s.id}`);
    } else {
      toast.error('Shipment not found in your assigned queue.');
    }
  };

  const safeShipments = Array.isArray(shipments) ? shipments : (shipments?.data || []);

  const filtered = safeShipments.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.id?.toLowerCase().includes(q) ||
      s.trackingId?.toLowerCase().includes(q) ||
      s.destination?.city?.toLowerCase().includes(q) ||
      s.origin?.city?.toLowerCase().includes(q) ||
      s.status?.toLowerCase().includes(q)
    );
  });

  const getBadgeVariant = (status) => {
    if (status === 'DELIVERED') return 'success';
    if (status === 'CANCELLED') return 'danger';
    if (['IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(status)) return 'primary';
    return 'warning';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Fleet Shipments</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Assign, inspect, and update dispatch milestones across active shipments.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="default" onClick={() => setShowScanner(!showScanner)}>
            <Camera className="w-4 h-4 mr-2" />
            {showScanner ? 'Close Scanner' : 'Scan Package'}
          </Button>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="Search ID, destination..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="h-9">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {showScanner && (
        <Card className="mb-6 border-blue-200 bg-blue-50/50">
          <CardContent className="p-6">
            <h2 className="text-sm font-semibold mb-4 text-center">Scan QR Code on Package Label</h2>
            <Scanner onScan={handleScan} onError={(err) => console.log('Scan error', err)} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-50/80 border-b border-border text-xs uppercase text-zinc-500 font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Tracking Number</th>
                  <th className="px-6 py-3.5">Current Status</th>
                  <th className="px-6 py-3.5">Route</th>
                  <th className="px-6 py-3.5">Cargo Specs</th>
                  <th className="px-6 py-3.5 text-right">Dispatch Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-28" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-36" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-20 ml-auto" /></td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-14 text-center">
                      <div className="mx-auto h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mb-2">
                        <Truck className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-medium text-zinc-900">No shipments found</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {search ? 'Try adjusting your search criteria.' : 'No active freight assigned yet.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((shipment) => (
                    <tr key={shipment.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-zinc-900 text-xs">
                        {shipment.trackingId || (shipment.id ? `#${shipment.id.slice(0, 8).toUpperCase()}` : '—')}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={getBadgeVariant(shipment.status)}>
                          {shipment.status?.replace(/_/g, ' ') || 'UNKNOWN'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                          <span className="font-medium text-zinc-900">{shipment.origin?.city || 'Origin'}</span>
                          <span className="text-zinc-400">&rarr;</span>
                          <span className="font-medium text-zinc-900">{shipment.destination?.city || 'Destination'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-500">
                        {shipment.weightKg ? `${shipment.weightKg}kg` : '-'} &middot; {shipment.packageType || 'PARCEL'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link to={`/carrier/shipments/${shipment.id}`}>
                          <Button size="sm" variant="secondary" className="h-8 text-xs font-medium">
                            Update Telemetry <ExternalLink className="ml-1.5 h-3 w-3" />
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
