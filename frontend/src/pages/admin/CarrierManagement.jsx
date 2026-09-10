import { useEffect, useState } from 'react';
import { createCarrierProfile, listCarriers, verifyCarrier } from '../../api/carriers';
import { adminCreateAccount } from '../../api/auth';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { Truck, Plus, Search, X, ShieldCheck, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export default function CarrierManagement() {
  const [carriers, setCarriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [emailSearch, setEmailSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  function update(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  function load(search = activeSearch) {
    setLoading(true);
    listCarriers({ limit: 50, ...(search ? { email: search } : {}) })
      .then((r) => {
        const list = Array.isArray(r) ? r : (r?.data || []);
        setCarriers(list);
      })
      .catch(() => toast.error('Failed to load carriers'))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function searchByEmail(event) {
    event.preventDefault();
    const search = emailSearch.trim();
    setActiveSearch(search);
    load(search);
  }

  function clearSearch() {
    setEmailSearch('');
    setActiveSearch('');
    load('');
  }

  async function createCarrier(event) {
    event.preventDefault();
    setCreating(true);
    try {
      const account = await adminCreateAccount({ ...form, role: 'CARRIER' }, crypto.randomUUID());
      await createCarrierProfile({
        userId: account.id,
        companyName: form.name,
        contactEmail: form.email,
      });
      setCredentials({ email: form.email, password: form.password });
      setForm({ name: '', email: '', password: '' });
      toast.success('Carrier account created. Ask the carrier to complete their profile.');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to create carrier account');
    } finally {
      setCreating(false);
    }
  }

  async function toggleVerified(carrier) {
    setBusyId(carrier.userId);
    try {
      await verifyCarrier(carrier.userId, !carrier.isVerified);
      toast.success(carrier.isVerified ? 'Carrier unverified' : 'Carrier verified successfully');
      load();
    } catch (err) {
      toast.error('Failed to toggle verification status');
    } finally {
      setBusyId(null);
    }
  }

  const safeCarriers = Array.isArray(carriers) ? carriers : [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Carrier Fleet Partners</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Approve, verify, and monitor authorized logistics and freight carriers.</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">Create carrier account</h2>
              <p className="text-xs text-zinc-500 mt-1">Create login access first, then the carrier can add their company profile.</p>
            </div>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <Truck className="h-4 w-4" />
            </div>
          </div>
          <form onSubmit={createCarrier} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end">
            <label className="text-xs font-semibold text-zinc-700">
              Contact name
              <Input required minLength={2} value={form.name} onChange={update('name')} placeholder="Jordan Lee" className="mt-1" />
            </label>
            <label className="text-xs font-semibold text-zinc-700">
              Login email
              <Input required type="email" value={form.email} onChange={update('email')} placeholder="carrier@company.com" className="mt-1" />
            </label>
            <label className="text-xs font-semibold text-zinc-700">
              Temporary password
              <Input required minLength={8} type="password" value={form.password} onChange={update('password')} placeholder="Minimum 8 characters" className="mt-1" />
            </label>
            <Button type="submit" isLoading={creating} className="h-10">
              <Plus className="mr-2 h-4 w-4" />
              Create carrier
            </Button>
          </form>
          {credentials && (
            <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900">
              <p className="font-semibold">Save these credentials before leaving this page.</p>
              <p className="mt-1">Email: <span className="font-mono">{credentials.email}</span></p>
              <p>Password: <span className="font-mono">{credentials.password}</span></p>
            </div>
          )}
        </CardContent>
      </Card>

      <form onSubmit={searchByEmail} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="text-xs font-semibold text-zinc-700 sm:max-w-md sm:flex-1">
          Search by carrier email
          <div className="relative mt-1">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-zinc-400" />
            <Input
              type="text"
              value={emailSearch}
              onChange={(event) => setEmailSearch(event.target.value)}
              placeholder="carrier@gmail.com"
              className="pl-9"
            />
          </div>
        </label>
        <Button type="submit" variant="outline" className="h-10">
          <Search className="mr-2 h-4 w-4" />
          Search
        </Button>
        {activeSearch && (
          <Button type="button" variant="ghost" onClick={clearSearch} className="h-10">
            <X className="mr-2 h-4 w-4" />
            Clear
          </Button>
        )}
      </form>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-50/80 border-b border-border text-xs uppercase text-zinc-500 font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Company Entity</th>
                  <th className="px-6 py-3.5">Contact Email</th>
                  <th className="px-6 py-3.5">Vehicle Fleet</th>
                  <th className="px-6 py-3.5">Verification</th>
                  <th className="px-6 py-3.5 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  Array(4).fill(0).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-40" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                      <td className="px-6 py-4 text-right"><Skeleton className="h-7 w-20 ml-auto" /></td>
                    </tr>
                  ))
                ) : safeCarriers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-14 text-center text-xs text-zinc-500">
                      No carrier profiles registered in the system yet.
                    </td>
                  </tr>
                ) : (
                  safeCarriers.map((c) => (
                    <tr key={c.userId} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="px-6 py-4 font-medium text-zinc-900 text-xs">
                        {c.companyName}
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-600">
                        {c.contactEmail}
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-500">
                        {c.vehicleType || 'Standard Fleet'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={c.isVerified ? 'success' : 'warning'}>
                          {c.isVerified ? 'Verified' : 'Pending Verification'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant={c.isVerified ? 'outline' : 'primary'}
                          size="sm"
                          onClick={() => toggleVerified(c)}
                          isLoading={busyId === c.userId}
                          className="h-7 text-xs"
                        >
                          {c.isVerified ? 'Revoke Approval' : 'Verify Carrier'}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
