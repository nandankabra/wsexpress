const COLORS = {
  CREATED: 'bg-slate-100 text-slate-700',
  PICKED_UP: 'bg-amber-100 text-amber-700',
  IN_TRANSIT: 'bg-blue-100 text-blue-700',
  OUT_FOR_DELIVERY: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${COLORS[status] || 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  );
}
