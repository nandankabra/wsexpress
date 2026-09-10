import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import ShipTrackLogo from '../ui/ShipTrackLogo';
import { Search, ArrowRight } from 'lucide-react';

export default function PublicLayout() {
  const { user, homePath } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/70">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center">
            <ShipTrackLogo iconClassName="h-8 w-8" textClassName="text-lg font-bold" />
          </Link>
          
          <nav className="flex items-center space-x-3 sm:space-x-4">
            <Link
              to="/track"
              className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition-colors flex items-center gap-1 py-1.5 px-2.5 rounded-lg hover:bg-zinc-100"
            >
              <Search className="h-3.5 w-3.5 text-zinc-500" />
              <span>Track Freight</span>
            </Link>
            {user ? (
              <Link to={homePath}>
                <Button variant="primary" size="sm" className="text-xs">
                  Console <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-xs font-medium">Sign In</Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm" className="text-xs font-semibold shadow-sm">
                    Start Free
                  </Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 flex flex-col"><Outlet /></main>
    </div>
  );
}
