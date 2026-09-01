import { useEffect, useState } from 'react';
import { listCarriers, verifyCarrier } from '../../api/carriers';

export default function CarrierManagement() {
  const [carriers, setCarriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  function load() {
    setLoading(true);
    listCarriers({ limit: 50 }).then((r) => setCarriers(r.data)).finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function toggleVerified(carrier) {
    setBusyId(carrier.userId);
    try {
      await verifyCarrier(carrier.userId, !carrier.isVerified);
      load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Carrier Management</h1>

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Company</th>
              <th className="px-4 py-2">Contact</th>
              <th className="px-4 py-2">Vehicle</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {carriers.map((c) => (
              <tr key={c.userId}>
                <td className="px-4 py-2 font-medium text-slate-900">{c.companyName}</td>
                <td className="px-4 py-2 text-slate-600">{c.contactEmail}</td>
                <td className="px-4 py-2 text-slate-600">{c.vehicleType || '-'}</td>
                <td className="px-4 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c.isVerified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {c.isVerified ? 'Verified' : 'Unverified'}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={() => toggleVerified(c)}
                    disabled={busyId === c.userId}
                    className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                  >
                    {c.isVerified ? 'Unverify' : 'Verify'}
                  </button>
                </td>
              </tr>
            ))}
            {carriers.length === 0 && !loading && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">No carrier profiles yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
