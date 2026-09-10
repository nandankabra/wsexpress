import { useEffect, useState } from 'react';
import { getAnalyticsSummary, getTopCustomers, getCarrierPerformance } from '../../api/crm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { BarChart3, TrendingUp, CheckCircle, Award, Users, Truck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Analytics() {
  const [summary, setSummary] = useState(null);
  const [topCustomers, setTopCustomers] = useState(null);
  const [carrierPerf, setCarrierPerf] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAnalyticsSummary().then(setSummary).catch(() => null),
      getTopCustomers(10).then(setTopCustomers).catch(() => []),
      getCarrierPerformance(10).then(setCarrierPerf).catch(() => []),
    ]).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">CRM & Telemetry Analytics</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Aggregated performance indicators, delivery success ratios, and carrier rankings.</p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : summary ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Delivery Rate</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">
                    {((summary.deliveryRate || 0) * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            {Object.entries(summary.counts || {}).slice(0, 3).map(([type, count]) => (
              <Card key={type}>
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider truncate max-w-[120px]">
                      {type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-2xl font-bold text-zinc-900 mt-1">{count}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-600" />
                  Top Shippers by Volume
                </CardTitle>
                <CardDescription>Most active customer logistics accounts</CardDescription>
              </CardHeader>
              <CardContent>
                {!topCustomers || topCustomers.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-6 text-center">No telemetry data recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {topCustomers.map((c, i) => (
                      <div key={c.customerId} className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50/70 text-xs">
                        <span className="flex items-center gap-2 font-mono text-zinc-700">
                          <span className="h-5 w-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                            {i + 1}
                          </span>
                          {c.customerId.slice(0, 12)}...
                        </span>
                        <span className="font-semibold text-zinc-900 bg-white px-2 py-0.5 rounded border border-zinc-200">
                          {c.shipmentCount} booked
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Truck className="h-4 w-4 text-emerald-600" />
                  Carrier Delivery Performance
                </CardTitle>
                <CardDescription>Verified successful delivery completions</CardDescription>
              </CardHeader>
              <CardContent>
                {!carrierPerf || carrierPerf.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-6 text-center">No delivery events recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {carrierPerf.map((c, i) => (
                      <div key={c.carrierId} className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50/70 text-xs">
                        <span className="flex items-center gap-2 font-mono text-zinc-700">
                          <span className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                            {i + 1}
                          </span>
                          {c.carrierId.slice(0, 12)}...
                        </span>
                        <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {c.deliveredCount} delivered
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-xs text-zinc-500">
            Analytics service is gathering system events.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
