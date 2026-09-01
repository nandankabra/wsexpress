import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAnalyticsSummary } from '../../api/crm';
import Card from '../../components/Card';

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    getAnalyticsSummary().then(setSummary).catch(() => {});
  }, []);

  const cards = [
    { to: '/admin/customers', label: 'Customer Management', desc: 'View and manage customer accounts.' },
    { to: '/admin/carriers', label: 'Carrier Management', desc: 'Verify carriers and view their accounts.' },
    { to: '/admin/shipments', label: 'Shipment Monitoring', desc: 'Monitor every shipment on the platform.' },
    { to: '/admin/analytics', label: 'Analytics', desc: 'Customer, shipment, and carrier analytics.' },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">CRM Admin Dashboard</h1>

      {summary && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card>
            <p className="text-3xl font-bold text-slate-900">{summary.counts.SHIPMENT_CREATED || 0}</p>
            <p className="text-sm text-slate-600">Shipments created</p>
          </Card>
          <Card>
            <p className="text-3xl font-bold text-slate-900">{summary.counts.SHIPMENT_DELIVERED || 0}</p>
            <p className="text-sm text-slate-600">Shipments delivered</p>
          </Card>
          <Card>
            <p className="text-3xl font-bold text-slate-900">{(summary.deliveryRate * 100).toFixed(0)}%</p>
            <p className="text-sm text-slate-600">Delivery rate</p>
          </Card>
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <Link key={c.to} to={c.to} className="rounded-lg border border-slate-200 bg-white p-5 hover:border-brand-400">
            <h3 className="font-semibold text-slate-900">{c.label}</h3>
            <p className="mt-1 text-sm text-slate-600">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
