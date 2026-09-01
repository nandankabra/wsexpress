import { useEffect, useState } from 'react';
import { listCountries } from '../../api/locations';

export default function ServicesPage() {
  const [countries, setCountries] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    listCountries()
      .then(setCountries)
      .catch(() => setError('Could not load supported countries right now.'));
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Our Services</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {['Parcel Delivery', 'Document Courier', 'Pallet Freight', 'Bulk Freight'].map((service) => (
          <div key={service} className="rounded-lg border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-slate-900">{service}</h3>
            <p className="mt-1 text-sm text-slate-600">Domestic and international shipping with live tracking.</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-xl font-semibold text-slate-900">Countries We Serve</h2>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        {countries.map((c) => (
          <span key={c.code} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
            {c.name} ({c.currency})
          </span>
        ))}
      </div>
    </div>
  );
}
