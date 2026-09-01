import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-900">Ship it. Track it. Deliver it.</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
          ShipTrack is a logistics platform for creating shipments, getting instant quotes, and
          tracking every package from pickup to delivery.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link to="/track" className="rounded-md bg-brand-600 px-5 py-2.5 font-medium text-white hover:bg-brand-700">
            Track a Package
          </Link>
          <Link to="/register" className="rounded-md border border-slate-300 px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-100">
            Create an Account
          </Link>
        </div>
      </div>

      <div className="mt-16 grid gap-6 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="font-semibold text-slate-900">Instant Quotes</h3>
          <p className="mt-2 text-sm text-slate-600">
            Real-time shipping cost calculation based on weight, package type, and destination.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="font-semibold text-slate-900">Live Tracking</h3>
          <p className="mt-2 text-sm text-slate-600">
            Every shipment gets a public tracking ID with a full event history, no login needed.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="font-semibold text-slate-900">Carrier Network</h3>
          <p className="mt-2 text-sm text-slate-600">
            Verified carriers pick up, transport, and deliver shipments across our route network.
          </p>
        </div>
      </div>
    </div>
  );
}
