import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listShipments } from '../../api/shipments';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { Truck, CheckCircle2, Navigation, ArrowRight, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function CarrierDashboard() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listShipments()
      .then((res) => {
        const items = Array.isArray(res) ? res : (res?.data || []);
        setShipments(items);
      })
      .catch(() => toast.error('Failed to load fleet shipments'))
      .finally(() => setLoading(false));
  }, []);

  const safeShipments = Array.isArray(shipments) ? shipments : (shipments?.data || []);

  const inTransitCount = safeShipments.filter((s) => ['IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(s.status)).length;
  const pendingPickup = safeShipments.filter((s) => ['CREATED', 'PICKED_UP', 'PENDING'].includes(s.status)).length;
  const deliveredCount = safeShipments.filter((s) => s.status === 'DELIVERED').length;

  const stats = [
    { name: 'Active Deliveries', value: inTransitCount, icon: Navigation, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { name: 'Pending Pickup', value: pendingPickup, icon: Truck, color: 'text-amber-600', bg: 'bg-amber-50' },
    { name: 'Total Delivered', value: deliveredCount, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Carrier Fleet Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Real-time status overview of all shipments in your assigned transport pool.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div key={stat.name} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <Card className="hover:border-zinc-300 transition-colors">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{stat.name}</p>
                      <p className="text-3xl font-bold text-zinc-900 mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bg}`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-zinc-900">Quick Route Actions</h2>
          <Link to="/carrier/shipments">
            <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700">
              Manage all ({safeShipments.length}) <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        <Card className="border-dashed bg-zinc-50/50">
          <CardContent className="flex flex-col items-center justify-center py-14 text-center px-4">
            <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-3">
              <Navigation className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900">Fleet Route & Dispatch Monitor</h3>
            <p className="text-xs text-zinc-500 max-w-sm mt-1">
              Select any assigned freight manifest to post telemetry location events, confirm pickups, and record deliveries.
            </p>
            <div className="mt-5">
              <Link to="/carrier/shipments">
                <Button size="sm">Open Assigned Shipments</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
