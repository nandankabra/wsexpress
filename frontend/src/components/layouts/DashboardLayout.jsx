import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import ShipTrackLogo from '../ui/ShipTrackLogo';
import {
  Package,
  LayoutDashboard,
  Truck,
  History,
  Users,
  BarChart3,
  LogOut,
  Settings,
  Activity,
  PlusCircle,
  Sliders,
} from 'lucide-react';
import { cn } from '../../utils/cn';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = {
    CUSTOMER: [
      { name: 'Overview', href: '/customer', icon: LayoutDashboard },
      { name: 'Book Shipment', href: '/customer/create', icon: PlusCircle },
      { name: 'Manifest History', href: '/customer/shipments', icon: History },
      { name: 'Shipper Profile', href: '/customer/profile', icon: Settings },
    ],
    CARRIER: [
      { name: 'Fleet Overview', href: '/carrier', icon: LayoutDashboard },
      { name: 'Assigned Shipments', href: '/carrier/shipments', icon: Truck },
      { name: 'Carrier Profile', href: '/carrier/profile', icon: Settings },
    ],
    ADMIN: [
      { name: 'Command Center', href: '/admin', icon: LayoutDashboard },
      { name: 'Orders & Dispatch', href: '/admin/orders', icon: Package },
      { name: 'Pricing Engine', href: '/admin/pricing', icon: Sliders },
      { name: 'Customer Accounts', href: '/admin/customers', icon: Users },
      { name: 'Carrier Fleet', href: '/admin/carriers', icon: Truck },
      { name: 'Fleet Telemetry', href: '/admin/monitoring', icon: Activity },
      { name: 'System Analytics', href: '/admin/analytics', icon: BarChart3 },
    ],
  };

  const links = navItems[user?.role] || [];

  return (
    <div className="flex min-h-screen bg-zinc-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-white flex flex-col justify-between">
        <div>
          <div className="flex h-16 items-center px-6 border-b border-border">
            <Link to="/" className="flex items-center">
              <ShipTrackLogo iconClassName="h-7 w-7" textClassName="text-base font-bold" />
            </Link>
          </div>
          <div className="px-4 py-3">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-3">
              {user?.role} PORTAL
            </span>
          </div>
          <nav className="flex flex-col px-3 gap-1">
            {links.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all",
                    isActive
                      ? "bg-indigo-50 text-indigo-700 font-semibold shadow-xs"
                      : "text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900"
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-indigo-600" : "text-zinc-400")} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card at bottom of sidebar */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-50">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-semibold text-zinc-900 truncate">{user?.name}</p>
              <p className="text-[11px] text-zinc-400 truncate">{user?.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              title="Logout"
              className="h-8 w-8 text-zinc-400 hover:text-red-600 hover:bg-red-50 shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="pl-64 flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-border bg-white/90 backdrop-blur-sm px-6 shadow-xs">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span>ShipTrack</span>
            <span>/</span>
            <span className="font-semibold text-zinc-900 capitalize">
              {location.pathname.split('/')[2] || 'Overview'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
              API Connected
            </span>
            <div className="h-4 w-px bg-zinc-200" />
            <Button variant="ghost" size="sm" onClick={logout} className="text-xs text-zinc-600 hover:text-zinc-900">
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              Sign Out
            </Button>
          </div>
        </header>

        <main className="flex-1 py-8 px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
