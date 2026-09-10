import { useEffect, useState } from 'react';
import { listCustomers } from '../../api/customers';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { Users, Mail, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load(reset = false) {
    setLoading(true);
    try {
      const result = await listCustomers({ limit: 20, ...(!reset && cursor ? { cursor } : {}) });
      const items = Array.isArray(result) ? result : (result?.data || []);
      setCustomers((prev) => (reset ? items : [...prev, ...items]));
      setCursor(result?.pagination?.nextCursor || null);
      setHasMore(!!result?.pagination?.hasMore);
    } catch (err) {
      toast.error('Failed to load customer profiles');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const safeCustomers = Array.isArray(customers) ? customers : [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Customer Accounts</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Directory of registered enterprise shippers and consumer accounts.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-50/80 border-b border-border text-xs uppercase text-zinc-500 font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Customer Name</th>
                  <th className="px-6 py-3.5">Email Contact</th>
                  <th className="px-6 py-3.5">Location</th>
                  <th className="px-6 py-3.5">User ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading && safeCustomers.length === 0 ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-44" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-28" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    </tr>
                  ))
                ) : safeCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-14 text-center text-xs text-zinc-500">
                      No customer profiles registered yet.
                    </td>
                  </tr>
                ) : (
                  safeCustomers.map((c) => (
                    <tr key={c.userId} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="px-6 py-4 font-medium text-zinc-900 text-xs">
                        {c.fullName || 'Anonymous Shipper'}
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-600">
                        {c.email}
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-500">
                        {c.city ? `${c.city}, ` : ''}{c.country || 'Global'}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-zinc-400">
                        {c.userId ? c.userId.slice(0, 8) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => load(false)}
            isLoading={loading}
          >
            Load Additional Customers
          </Button>
        </div>
      )}
    </div>
  );
}
