import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = {
  CUSTOMER: [
    { to: '/customer', label: 'Dashboard' },
    { to: '/customer/create', label: 'Create Shipment' },
    { to: '/customer/history', label: 'History' },
    { to: '/customer/profile', label: 'Profile' },
  ],
  CARRIER: [
    { to: '/carrier', label: 'Dashboard' },
    { to: '/carrier/shipments', label: 'Shipments' },
  ],
  ADMIN: [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/customers', label: 'Customers' },
    { to: '/admin/carriers', label: 'Carriers' },
    { to: '/admin/shipments', label: 'Shipments' },
    { to: '/admin/analytics', label: 'Analytics' },
  ],
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = user ? NAV_LINKS[user.role] || [] : [];

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-bold text-brand-600">
          ShipTrack
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {!user && (
            <>
              <Link to="/services" className="text-slate-600 hover:text-brand-600">Services</Link>
              <Link to="/track" className="text-slate-600 hover:text-brand-600">Track a Package</Link>
              <Link to="/login" className="text-slate-600 hover:text-brand-600">Login</Link>
              <Link
                to="/register"
                className="rounded-md bg-brand-600 px-3 py-1.5 font-medium text-white hover:bg-brand-700"
              >
                Register
              </Link>
            </>
          )}
          {user && (
            <>
              {links.map((link) => (
                <Link key={link.to} to={link.to} className="text-slate-600 hover:text-brand-600">
                  {link.label}
                </Link>
              ))}
              <span className="text-slate-400">|</span>
              <span className="text-slate-500">{user.name} ({user.role})</span>
              <button
                onClick={handleLogout}
                className="rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100"
              >
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
