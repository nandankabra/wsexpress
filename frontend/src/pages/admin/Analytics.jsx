import { useEffect, useState } from 'react';
import { getAnalyticsSummary, getTopCustomers, getCarrierPerformance } from '../../api/crm';
import Card from '../../components/Card';

export default function Analytics() {
  const [summary, setSummary] = useState(null);
  const [topCustomers, setTopCustomers] = useState([]);
  const [carrierPerf, setCarrierPerf] = useState([]);

  useEffect(() => {
    getAnalyticsSummary().then(setSummary).catch(() => {});
    getTopCustomers(10).then(setTopCustomers).catch(() => {});
    getCarrierPerformance(10).then(setCarrierPerf).catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>

      {summary && (
        <Card title="Event Counts" className="mt-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Object.entries(summary.counts).map(([type, count]) => (
              <div key={type} className="rounded-md bg-slate-50 p-3 text-center">
                <p className="text-xl font-bold text-slate-900">{count}</p>
                <p className="text-xs text-slate-500">{type.replace(/_/g, ' ')}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-600">
            Delivery rate: <span className="font-semibold">{(summary.deliveryRate * 100).toFixed(1)}%</span>
          </p>
        </Card>
      )}

      <Card title="Top Customers by Shipment Volume" className="mt-6">
        {topCustomers.length === 0 && <p className="text-sm text-slate-500">No data yet.</p>}
        <ol className="space-y-2">
          {topCustomers.map((c, i) => (
            <li key={c.customerId} className="flex justify-between text-sm">
              <span>#{i + 1} &middot; {c.customerId}</span>
              <span className="font-semibold">{c.shipmentCount} shipments</span>
            </li>
          ))}
        </ol>
      </Card>

      <Card title="Carrier Delivery Performance" className="mt-6">
        {carrierPerf.length === 0 && <p className="text-sm text-slate-500">No data yet.</p>}
        <ol className="space-y-2">
          {carrierPerf.map((c, i) => (
            <li key={c.carrierId} className="flex justify-between text-sm">
              <span>#{i + 1} &middot; {c.carrierId}</span>
              <span className="font-semibold">{c.deliveredCount} delivered</span>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
