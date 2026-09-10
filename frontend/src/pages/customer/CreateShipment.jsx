import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQuote, createShipment } from '../../api/shipments';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { PackageOpen, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const EMPTY_ADDRESS = { address: '', city: '', country: '' };

export default function CreateShipment() {
  const navigate = useNavigate();
  const [origin, setOrigin] = useState(EMPTY_ADDRESS);
  const [destination, setDestination] = useState(EMPTY_ADDRESS);
  const [weightKg, setWeightKg] = useState('1');
  const [packageType, setPackageType] = useState('PARCEL');
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

  function buildPayload() {
    return { origin, destination, weightKg: Number(weightKg), packageType };
  }

  async function handleGetQuote(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const q = await getQuote(buildPayload());
      setQuote(q);
      toast.success('Quote generated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Could not get a quote');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    setLoading(true);
    try {
      const shipment = await createShipment(buildPayload(), idempotencyKey);
      toast.success('Shipment created!');
      navigate(`/customer/shipments/${shipment.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Could not create shipment');
      setIdempotencyKey(crypto.randomUUID());
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Create a Shipment</h1>
        <p className="text-sm text-zinc-500 mt-1">Get an instant quote and book your freight.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <form id="quote-form" onSubmit={handleGetQuote}>
            <Card>
              <CardHeader>
                <CardTitle>Route Details</CardTitle>
                <CardDescription>Enter pickup and delivery locations.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs text-indigo-700">1</span>
                    Origin
                  </h3>
                  <div className="grid gap-4">
                    <Input placeholder="Street Address" required value={origin.address} onChange={(e) => setOrigin({ ...origin, address: e.target.value })} />
                    <div className="grid grid-cols-2 gap-4">
                      <Input placeholder="City" required value={origin.city} onChange={(e) => setOrigin({ ...origin, city: e.target.value })} />
                      <Input placeholder="Country Code (e.g. US)" required maxLength={2} value={origin.country} onChange={(e) => setOrigin({ ...origin, country: e.target.value.toUpperCase() })} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs text-indigo-700">2</span>
                    Destination
                  </h3>
                  <div className="grid gap-4">
                    <Input placeholder="Street Address" required value={destination.address} onChange={(e) => setDestination({ ...destination, address: e.target.value })} />
                    <div className="grid grid-cols-2 gap-4">
                      <Input placeholder="City" required value={destination.city} onChange={(e) => setDestination({ ...destination, city: e.target.value })} />
                      <Input placeholder="Country Code (e.g. CA)" required maxLength={2} value={destination.country} onChange={(e) => setDestination({ ...destination, country: e.target.value.toUpperCase() })} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs text-indigo-700">3</span>
                    Package Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Weight (kg)</label>
                      <Input type="number" min="0.01" step="0.01" required value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Package Type</label>
                      <Select value={packageType} onChange={(e) => setPackageType(e.target.value)}>
                        <option value="PARCEL">Parcel</option>
                        <option value="DOCUMENT">Document</option>
                        <option value="PALLET">Pallet</option>
                        <option value="FREIGHT">Freight</option>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>

        <div>
          <div className="sticky top-24">
            <Card className="bg-zinc-900 text-white border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <PackageOpen className="h-5 w-5 text-indigo-400" />
                  Estimated Quote
                </CardTitle>
              </CardHeader>
              <CardContent>
                {quote ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                    <div>
                      <p className="text-sm text-zinc-400">Total Price</p>
                      <p className="text-4xl font-bold mt-1">
                        ${quote.priceAmount.toFixed(2)} <span className="text-lg text-zinc-500">{quote.currency}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-zinc-400">Estimated Delivery</p>
                      <p className="font-medium mt-1">{quote.estimatedDays} business day(s)</p>
                    </div>
                    <Button className="w-full bg-white text-zinc-900 hover:bg-zinc-100 shadow-none" size="lg" onClick={handleCreate} isLoading={loading}>
                      Confirm & Pay
                    </Button>
                  </motion.div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-zinc-400 mb-6">Fill out the details to calculate your shipping costs.</p>
                    <Button type="submit" form="quote-form" className="w-full bg-indigo-500 hover:bg-indigo-600 shadow-none" isLoading={loading}>
                      Calculate Quote
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
