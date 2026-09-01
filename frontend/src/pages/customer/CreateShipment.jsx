import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQuote, createShipment } from '../../api/shipments';
import Card from '../../components/Card';

const EMPTY_ADDRESS = { address: '', city: '', country: '' };

export default function CreateShipment() {
  const navigate = useNavigate();
  const [origin, setOrigin] = useState(EMPTY_ADDRESS);
  const [destination, setDestination] = useState(EMPTY_ADDRESS);
  const [weightKg, setWeightKg] = useState('1');
  const [packageType, setPackageType] = useState('PARCEL');
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function addressForm(value, setValue, label) {
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-slate-700">{label}</h4>
        <input
          placeholder="Street address"
          required
          value={value.address}
          onChange={(e) => setValue({ ...value, address: e.target.value })}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            placeholder="City"
            required
            value={value.city}
            onChange={(e) => setValue({ ...value, city: e.target.value })}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Country code (e.g. US)"
            required
            maxLength={2}
            value={value.country}
            onChange={(e) => setValue({ ...value, country: e.target.value.toUpperCase() })}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
    );
  }

  function buildPayload() {
    return { origin, destination, weightKg: Number(weightKg), packageType };
  }

  async function handleGetQuote(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const q = await getQuote(buildPayload());
      setQuote(q);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not get a quote');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    setLoading(true);
    setError(null);
    try {
      const idempotencyKey = crypto.randomUUID();
      const shipment = await createShipment(buildPayload(), idempotencyKey);
      navigate(`/customer/shipments/${shipment.id}`);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not create shipment');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Create a Shipment</h1>

      <form onSubmit={handleGetQuote} className="mt-6 space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          {addressForm(origin, setOrigin, 'Origin')}
          {addressForm(destination, setDestination, 'Destination')}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Weight (kg)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Package Type</label>
            <select
              value={packageType}
              onChange={(e) => setPackageType(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="PARCEL">Parcel</option>
              <option value="DOCUMENT">Document</option>
              <option value="PALLET">Pallet</option>
              <option value="FREIGHT">Freight</option>
            </select>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-brand-600 px-5 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? 'Working...' : 'Get Quote'}
        </button>
      </form>

      {quote && (
        <Card title="Quote" className="mt-6">
          <p className="text-2xl font-bold text-slate-900">
            {quote.priceAmount.toFixed(2)} {quote.currency}
          </p>
          <p className="text-sm text-slate-600">Estimated delivery in {quote.estimatedDays} day(s)</p>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="mt-4 rounded-md bg-green-600 px-5 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Confirm & Create Shipment'}
          </button>
        </Card>
      )}
    </div>
  );
}
