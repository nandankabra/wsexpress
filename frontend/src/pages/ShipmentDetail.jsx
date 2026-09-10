import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getShipment, updateShipmentStatus } from '../api/shipments';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { MapPin, Package, ArrowLeft, Clock, Truck, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ShipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);

  // Carrier updates
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    try {
      const data = await getShipment(id);
      setShipment(data);
      setNewStatus(data.status);
    } catch (err) {
      toast.error('Could not load shipment details');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    if (!shipment) return;
    setUpdating(true);
    try {
      await updateShipmentStatus(id, {
        status: newStatus,
        expectedVersion: shipment.version,
      });
      toast.success(`Shipment status updated to ${newStatus.replace(/_/g, ' ')}`);
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  }

  const getBadgeVariant = (status) => {
    if (status === 'DELIVERED') return 'success';
    if (status === 'CANCELLED') return 'danger';
    if (['IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(status)) return 'primary';
    return 'warning';
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Card><CardContent className="h-64 flex items-center justify-center"><Skeleton className="h-32 w-32 rounded-full" /></CardContent></Card>
      </div>
    );
  }

  if (!shipment) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 font-mono">
              {shipment.trackingId || `#${shipment.id?.slice(0, 8).toUpperCase()}`}
            </h1>
            <Badge variant={getBadgeVariant(shipment.status)}>
              {shipment.status?.replace(/_/g, ' ') || 'UNKNOWN'}
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Booked on {shipment.createdAt ? new Date(shipment.createdAt).toLocaleDateString() : '—'}
            {shipment.carrierId ? ` • Carrier ID: ${shipment.carrierId.slice(0, 8)}...` : ''}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Live Route Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center px-4 relative mt-6 mb-4">
                <div className="absolute left-[36px] right-[36px] top-5 h-0.5 bg-zinc-200" />
                <div className="relative z-10 flex flex-col items-center">
                  <div className="h-10 w-10 rounded-full bg-indigo-50 border-2 border-indigo-600 flex items-center justify-center shadow-sm">
                    <MapPin className="h-4 w-4 text-indigo-600" />
                  </div>
                  <p className="mt-2 font-semibold text-zinc-900 text-xs">{shipment.origin?.city || 'Origin'}</p>
                  <p className="text-[11px] text-zinc-400">{shipment.origin?.country || ''}</p>
                </div>
                <div className="relative z-10 flex flex-col items-center">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 shadow-sm ${
                    ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(shipment.status)
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white border-zinc-300 text-zinc-400'
                  }`}>
                    <Truck className="h-4 w-4" />
                  </div>
                  <p className="mt-2 font-medium text-zinc-700 text-xs">Transit Hub</p>
                  <p className="text-[11px] text-zinc-400">{shipment.status?.replace(/_/g, ' ')}</p>
                </div>
                <div className="relative z-10 flex flex-col items-center">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 shadow-sm ${
                    shipment.status === 'DELIVERED'
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'bg-white border-zinc-300 text-zinc-400'
                  }`}>
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <p className="mt-2 font-semibold text-zinc-900 text-xs">{shipment.destination?.city || 'Destination'}</p>
                  <p className="text-[11px] text-zinc-400">{shipment.destination?.country || ''}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-zinc-400" />
                Audit & Event Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(!shipment.events || shipment.events.length === 0) ? (
                <div className="text-center py-8 text-xs text-zinc-500">
                  <p>Initial shipment manifest created.</p>
                  <p className="text-zinc-400 mt-1">Milestones will appear automatically as carriers record updates.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {shipment.events.map((event, i) => (
                    <div key={i} className="flex gap-3 text-xs">
                      <div className="flex flex-col items-center">
                        <div className="h-2 w-2 rounded-full bg-indigo-600 mt-1" />
                        {i !== shipment.events.length - 1 && <div className="w-px h-full bg-zinc-200 mt-1" />}
                      </div>
                      <div className="pb-4">
                        <p className="font-semibold text-zinc-900">{event.status?.replace(/_/g, ' ')}</p>
                        <p className="text-zinc-600 mt-0.5">{event.location || event.note || 'Milestone verified'}</p>
                        <p className="text-zinc-400 mt-0.5">{event.timestamp ? new Date(event.timestamp).toLocaleString() : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Cargo Specification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-zinc-100">
                <span className="text-zinc-500">Package Type</span>
                <span className="font-medium text-zinc-900">{shipment.packageType || 'PARCEL'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-100">
                <span className="text-zinc-500">Total Weight</span>
                <span className="font-medium text-zinc-900">{shipment.weightKg} kg</span>
              </div>
              {(shipment.quotedPrice !== null && shipment.quotedPrice !== undefined) && (
                <div className="flex justify-between py-1.5 border-b border-zinc-100">
                  <span className="text-zinc-500">Total Quoted</span>
                  <span className="font-bold text-zinc-900">${Number(shipment.quotedPrice).toFixed(2)} {shipment.currency || 'USD'}</span>
                </div>
              )}
              {shipment.estimatedDeliveryDate && (
                <div className="flex justify-between py-1.5">
                  <span className="text-zinc-500">Est. Delivery</span>
                  <span className="font-medium text-zinc-900">{new Date(shipment.estimatedDeliveryDate).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {(user?.role === 'CARRIER' || user?.role === 'ADMIN') && shipment.status !== 'DELIVERED' && shipment.status !== 'CANCELLED' && (
            <Card className="border-indigo-100 bg-indigo-50/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-indigo-950 flex items-center gap-1.5">
                  <Truck className="h-4 w-4 text-indigo-600" />
                  Dispatch Milestone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdate} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">New Milestone Status</label>
                    <Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="text-xs h-9">
                      <option value="CREATED">CREATED</option>
                      <option value="PICKED_UP">PICKED_UP</option>
                      <option value="IN_TRANSIT">IN_TRANSIT</option>
                      <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </Select>
                  </div>
                  <Button type="submit" size="sm" className="w-full text-xs" isLoading={updating}>
                    Commit Milestone Update
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
