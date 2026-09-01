import { useEffect, useState } from 'react';
import { listCustomers } from '../../api/customers';

export default function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load(reset = false) {
    setLoading(true);
    const result = await listCustomers({ limit: 20, ...(!reset && cursor ? { cursor } : {}) });
    setCustomers((prev) => (reset ? result.data : [...prev, ...result.data]));
    setCursor(result.pagination.nextCursor);
    setHasMore(result.pagination.hasMore);
    setLoading(false);
  }

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Customer Management</h1>

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">City</th>
              <th className="px-4 py-2">Country</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.map((c) => (
              <tr key={c.userId}>
                <td className="px-4 py-2 font-medium text-slate-900">{c.fullName}</td>
                <td className="px-4 py-2 text-slate-600">{c.email}</td>
                <td className="px-4 py-2 text-slate-600">{c.city || '-'}</td>
                <td className="px-4 py-2 text-slate-600">{c.country || '-'}</td>
              </tr>
            ))}
            {customers.length === 0 && !loading && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500">No customer profiles yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <button
          onClick={() => load(false)}
          disabled={loading}
          className="mt-4 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          {loading ? 'Loading...' : 'Load more'}
        </button>
      )}
    </div>
  );
}
