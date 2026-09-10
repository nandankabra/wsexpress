import { useState } from 'react';
import { motion } from 'framer-motion';
import { trackPublic } from '../../api/shipments';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Search, MapPin, Package, CheckCircle2, Clock, Truck, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function TrackPage() {
  const [trackingId, setTrackingId] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    const cleanId = trackingId.trim().toUpperCase();
    if (!cleanId) return;
    setLoading(true);
    setData(null);
    try {
      const res = await trackPublic(cleanId);
      setData(res);
      toast.success('Tracking telemetry retrieved');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Shipment tracking ID not found');
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status) => {
    if (status === 'DELIVERED') return 'success';
    if (status === 'CANCELLED') return 'danger';
    if (['IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(status)) return 'primary';
    return 'warning';
  };

  const originCity = data?.origin?.city || data?.originCity || 'Origin Hub';
  const originCountry = data?.origin?.country || data?.originCountry || '';
  const destCity = data?.destination?.city || data?.destinationCity || 'Destination';
  const destCountry = data?.destination?.country || data?.destinationCountry || '';

  return (
    <div className="min-h-screen bg-zinc-50 py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-gradient-to-b from-indigo-100/50 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-600/20 mb-3">
            Live Global Dispatch
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Real-Time Cargo Tracking
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Enter your parcel or manifest tracking code to monitor checkpoint events.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:max-w-xl">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                type="text"
                placeholder="Enter Tracking ID (e.g. STK...)"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
                className="h-11 pl-10 text-sm font-mono shadow-xs bg-white"
                required
              />
            </div>
            <Button type="submit" size="md" isLoading={loading} className="h-11 px-6 shadow-sm">
              {!loading && <Truck className="mr-1.5 h-4 w-4" />}
              Track Now
            </Button>
          </form>
        </div>

        {data && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-10"
          >
            <Card className="shadow-md">
              <CardContent className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5 gap-3">
                  <div>
                    <span className="text-xs text-zinc-400 font-mono">MANIFEST TELEMETRY</span>
                    <h2 className="text-xl font-bold text-zinc-900 font-mono">
                      {data.trackingId || (data.id ? `#${data.id.slice(0, 8).toUpperCase()}` : 'RECORD')}
                    </h2>
                    {data.weightKg && (
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Weight: {data.weightKg} kg &middot; Cargo: {data.packageType || 'PARCEL'}
                      </p>
                    )}
                  </div>
                  <Badge variant={getStatusColor(data.status)} className="text-xs px-3 py-1 self-start sm:self-auto">
                    {data.status?.replace(/_/g, ' ') || 'UNKNOWN'}
                  </Badge>
                </div>

                <div className="mt-8 flex justify-between items-center px-4 relative">
                  <div className="absolute left-[30px] right-[30px] top-5 h-0.5 bg-zinc-200" />

                  <div className="relative z-10 flex flex-col items-center">
                    <div className="h-10 w-10 rounded-full bg-indigo-50 border-2 border-indigo-600 flex items-center justify-center shadow-xs">
                      <MapPin className="h-4 w-4 text-indigo-600" />
                    </div>
                    <p className="mt-2 font-semibold text-zinc-900 text-xs text-center">{originCity}</p>
                    <p className="text-[10px] text-zinc-400">{originCountry}</p>
                  </div>

                  <div className="relative z-10 flex flex-col items-center">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 shadow-xs ${
                      ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(data.status)
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-white border-zinc-300 text-zinc-400'
                    }`}>
                      <Package className="h-4 w-4" />
                    </div>
                    <p className="mt-2 font-medium text-zinc-700 text-xs">Route Checkpoint</p>
                    <p className="text-[10px] text-zinc-400">{data.status?.replace(/_/g, ' ')}</p>
                  </div>

                  <div className="relative z-10 flex flex-col items-center">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 shadow-xs ${
                      data.status === 'DELIVERED'
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-white border-zinc-300 text-zinc-400'
                    }`}>
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <p className="mt-2 font-semibold text-zinc-900 text-xs text-center">{destCity}</p>
                    <p className="text-[10px] text-zinc-400">{destCountry}</p>
                  </div>
                </div>

                {data.events && data.events.length > 0 && (
                  <div className="mt-10 pt-6 border-t border-zinc-100">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      Recorded Transit Milestones
                    </h3>
                    <div className="space-y-4">
                      {data.events.map((event, i) => (
                        <div key={i} className="flex gap-3 text-xs">
                          <div className="flex flex-col items-center">
                            <div className="h-2 w-2 rounded-full bg-indigo-600 mt-1" />
                            {i !== data.events.length - 1 && <div className="w-px h-full bg-zinc-200 mt-1" />}
                          </div>
                          <div className="pb-3">
                            <p className="font-semibold text-zinc-900">{event.status?.replace(/_/g, ' ')}</p>
                            <p className="text-zinc-600 mt-0.5">{event.location || event.note || 'Milestone event logged'}</p>
                            <p className="text-zinc-400 text-[11px] mt-0.5">{event.timestamp ? new Date(event.timestamp).toLocaleString() : ''}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
