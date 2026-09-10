import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listShipments } from '../../api/shipments';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { Package, Truck, CheckCircle2, ArrowRight, PlusCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function CustomerDashboard() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listShipments()
      .then((res) => {
        const items = Array.isArray(res) ? res : (res?.data || []);
        setShipments(items);
      })
      .catch(() => toast.error('Failed to load shipments'))
      .finally(() => setLoading(false));
  }, []);

  const safeShipments = Array.isArray(shipments) ? shipments : (shipments?.data || []);

  const activeCount = safeShipments.filter((s) =>
    ['CREATED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'PENDING'].includes(s.status)
  ).length;

  const deliveredCount = safeShipments.filter((s) => s.status === 'DELIVERED').length;

  const stats = [
    { name: 'Active Shipments', value: activeCount, icon: Truck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { name: 'Delivered', value: deliveredCount, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'Total Created', value: safeShipments.length, icon: Package, color: 'text-violet-600', bg: 'bg-violet-50' },
  ];

  const recentShipments = safeShipments.slice(0, 5);

  const getBadgeVariant = (status) => {
    if (status === 'DELIVERED') return 'success';
    if (status === 'CANCELLED') return 'danger';
    if (['IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(status)) return 'primary';
    return 'warning';
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Welcome back! Here is your real-time shipping activity.</p>
        </div>
        <Link to="/customer/create">
          <Button className="shadow-sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            Book New Shipment
          </Button>
        </Link>
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
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-zinc-900">Recent Shipments</h2>
            <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full font-medium">
              {safeShipments.length}
            </span>
          </div>
          <Link to="/customer/shipments">
            <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700">
              View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        <Card>
          {loading ? (
            <div className="p-6 space-y-3">
              {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : recentShipments.length === 0 ? (
            <div className="text-center py-14 px-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-3">
                <Package className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900">No shipments yet</h3>
              <p className="mt-1 text-xs text-zinc-500 max-w-xs mx-auto">Get started by booking your first shipment to receive live status updates.</p>
              <div className="mt-5">
                <Link to="/customer/create">
                  <Button size="sm">Create First Shipment</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {recentShipments.map((shipment) => (
                <Link
                  key={shipment.id}
                  to={`/customer/shipments/${shipment.id}`}
                  className="flex items-center justify-between p-4 sm:px-6 hover:bg-zinc-50/80 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors shrink-0">
                      <Truck className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-900 text-sm">
                          {shipment.trackingId || (shipment.id ? `#${shipment.id.slice(0, 8).toUpperCase()}` : 'Shipment')}
                        </span>
                        <span className="text-xs text-zinc-400">
                          {shipment.createdAt ? new Date(shipment.createdAt).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 truncate mt-0.5">
                        {shipment.origin?.city || 'Origin'} &rarr; {shipment.destination?.city || 'Destination'}
                        {shipment.weightKg ? ` • ${shipment.weightKg}kg` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant={getBadgeVariant(shipment.status)}>
                      {shipment.status?.replace(/_/g, ' ') || 'UNKNOWN'}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-zinc-300 group-hover:text-zinc-600 transition-colors hidden sm:block" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
