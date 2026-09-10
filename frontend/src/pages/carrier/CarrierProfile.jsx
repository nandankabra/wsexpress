import { useEffect, useState } from 'react';
import { getMyCarrierProfile, upsertMyCarrierProfile } from '../../api/carriers';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { Building2, CheckCircle2, Save, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

const EMPTY_FORM = {
  companyName: '',
  contactEmail: '',
  contactPhone: '',
  vehicleType: '',
  licenseNumber: '',
  serviceAreas: '',
};

export default function CarrierProfile() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMyCarrierProfile()
      .then((data) => {
        setProfile(data);
        setForm({ ...EMPTY_FORM, ...data });
      })
      .catch((err) => {
        if (err.response?.status !== 404) {
          toast.error('Failed to load carrier profile');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function update(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const saved = await upsertCarrierProfile(form);
      setProfile(saved);
      setForm({ ...EMPTY_FORM, ...saved });
      toast.success('Carrier profile saved');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to save carrier profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Carrier profile</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Keep your company and fleet details current for dispatch operations.</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-indigo-50 p-3 text-indigo-600">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-zinc-900">Company details</h2>
                <p className="text-xs text-zinc-500 mt-1">This information is visible to authorized operations staff.</p>
              </div>
            </div>
            {profile && (
              <Badge variant={profile.isVerified ? 'success' : 'warning'}>
                {profile.isVerified ? <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> : <ShieldAlert className="mr-1 h-3.5 w-3.5" />}
                {profile.isVerified ? 'Verified carrier' : 'Pending admin verification'}
              </Badge>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-xs font-semibold text-zinc-700">
                Company name
                <Input required minLength={2} value={form.companyName} onChange={update('companyName')} placeholder="Fast Freight Logistics" className="mt-1" />
              </label>
              <label className="text-xs font-semibold text-zinc-700">
                Contact email
                <Input required type="email" value={form.contactEmail} onChange={update('contactEmail')} placeholder="operations@company.com" className="mt-1" />
              </label>
              <label className="text-xs font-semibold text-zinc-700">
                Contact phone
                <Input value={form.contactPhone} onChange={update('contactPhone')} placeholder="+1 555 010 1234" className="mt-1" />
              </label>
              <label className="text-xs font-semibold text-zinc-700">
                Vehicle fleet
                <Input value={form.vehicleType} onChange={update('vehicleType')} placeholder="Box trucks, vans" className="mt-1" />
              </label>
              <label className="text-xs font-semibold text-zinc-700">
                License number
                <Input value={form.licenseNumber} onChange={update('licenseNumber')} placeholder="Carrier license or registration" className="mt-1" />
              </label>
              <label className="text-xs font-semibold text-zinc-700">
                Service areas
                <Input value={form.serviceAreas} onChange={update('serviceAreas')} placeholder="North America, EU" className="mt-1" />
              </label>
            </div>
            <div className="flex justify-end border-t border-zinc-100 pt-5">
              <Button type="submit" isLoading={saving}>
                <Save className="mr-2 h-4 w-4" />
                Save profile
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
