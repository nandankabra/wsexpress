import { cn } from '../../utils/cn';

function Badge({ className, variant = "default", ...props }) {
  const variants = {
    default: "bg-zinc-100 text-zinc-900",
    primary: "bg-indigo-100 text-indigo-700",
    success: "bg-green-100 text-green-700",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-700",
  };
  
  return (
    <div
      className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring", variants[variant], className)}
      {...props}
    />
  );
}
export { Badge };
