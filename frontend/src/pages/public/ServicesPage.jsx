import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listCountries } from '../../api/locations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { Package, FileText, Layers, Truck, Globe, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ServicesPage() {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listCountries()
      .then((data) => setCountries(Array.isArray(data) ? data : (data?.data || [])))
      .catch(() => setCountries([]))
      .finally(() => setLoading(false));
  }, []);

  const services = [
    {
      title: 'Parcel Delivery',
      code: 'PARCEL',
      icon: Package,
      description: 'Standard and express package logistics with volumetric weight optimization and door-to-door tracking.',
      speed: '1-3 Business Days',
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      title: 'Document Courier',
      code: 'DOCUMENT',
      icon: FileText,
      description: 'High-priority, secure transit for confidential business contracts, legal records, and customs manifests.',
      speed: 'Same-day / Next-day',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Pallet Freight',
      code: 'PALLET',
      icon: Layers,
      description: 'Forklift-rated palletized cargo distribution designed for industrial commerce, warehouses, and fulfillment centers.',
      speed: '2-5 Business Days',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      title: 'Heavy Freight & Bulk',
      code: 'FREIGHT',
      icon: Truck,
      description: 'Dedicated multi-ton linehaul freight across domestic highway corridors and international bonded routes.',
      speed: 'Scheduled Dispatch',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
  ];

  return (
    <div className="flex-1 bg-zinc-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-600/20 mb-3">
            Global Logistics Spectrum
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
            Our Shipping & Freight Solutions
          </h1>
          <p className="mt-3 text-sm text-zinc-500 leading-relaxed">
            Enterprise-grade freight logistics powered by dynamic distance matrices, multi-corridor carriers, and live GPS telemetry.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((svc, i) => {
            const Icon = svc.icon;
            return (
              <motion.div
                key={svc.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="h-full flex flex-col justify-between hover:border-zinc-300 transition-all hover:shadow-sm">
                  <CardContent className="p-6">
                    <div className={`h-12 w-12 rounded-xl ${svc.bg} flex items-center justify-center ${svc.color} mb-4`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <Badge variant="primary" className="mb-2 font-mono text-[10px]">
                      {svc.code}
                    </Badge>
                    <h3 className="text-base font-bold text-zinc-900 mt-1">{svc.title}</h3>
                    <p className="text-xs text-zinc-500 mt-2 leading-relaxed">{svc.description}</p>
                    <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs">
                      <span className="text-zinc-400 font-medium">Transit SLA</span>
                      <span className="font-semibold text-zinc-800">{svc.speed}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Interactive Corridor & Country Coverage */}
        <Card className="shadow-xs">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="h-5 w-5 text-indigo-600" />
                  Active International Corridors & Countries
                </CardTitle>
                <CardDescription>
                  Real-time customs clearance and localized currency exchange support
                </CardDescription>
              </div>
              <Link to="/track">
                <Button variant="outline" size="sm" className="text-xs">
                  Track Corridor <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {Array(10).fill(0).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
              </div>
            ) : countries.length === 0 ? (
              <p className="text-xs text-zinc-500 py-6 text-center">Corridor database updating...</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {countries.map((c) => (
                  <div
                    key={c.code}
                    className="p-3 rounded-lg border border-zinc-200/80 bg-white hover:border-indigo-300 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-zinc-900">{c.name}</p>
                      <p className="text-[11px] text-zinc-400 font-mono">{c.capital || 'Major Hubs'}</p>
                    </div>
                    <span className="text-[11px] font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {c.currency}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Banner */}
        <div className="rounded-2xl bg-indigo-600 text-white p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
          <div>
            <h2 className="text-2xl font-bold">Ready to ship across our global network?</h2>
            <p className="mt-1 text-sm text-indigo-100">
              Calculate instant distance-based quotes and generate verified shipping labels in seconds.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link to="/register">
              <Button size="lg" className="bg-white text-indigo-700 hover:bg-indigo-50 font-bold shadow-xs">
                Start Shipping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
