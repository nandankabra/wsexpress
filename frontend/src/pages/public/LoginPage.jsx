import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import ShipTrackLogo from '../../components/ui/ShipTrackLogo';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [userName, setUserName] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      setUserName(user?.name || 'User');
      setLoginSuccess(true);
      toast.success('Successfully authenticated!');

      // Smooth transition animation before navigating
      setTimeout(() => {
        const dest = location.state?.from?.pathname || (
          user?.role === 'CUSTOMER' ? '/customer' :
          user?.role === 'CARRIER' ? '/carrier' :
          user?.role === 'ADMIN' ? '/admin' : '/'
        );
        navigate(dest, { replace: true });
      }, 750);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Invalid email or password');
      setLoading(false);
    }
  }


  return (
    <div className="min-h-[calc(100vh-4.5rem)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-indigo-200/40 via-violet-200/30 to-sky-200/30 rounded-full blur-3xl pointer-events-none -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="flex justify-center mb-5">
          <ShipTrackLogo iconClassName="h-10 w-10" textClassName="text-2xl" />
        </div>
        <h2 className="text-center text-2xl font-bold tracking-tight text-zinc-900">
          Sign in to your account
        </h2>
        <p className="mt-1.5 text-center text-xs text-zinc-500">
          Access your global logistics dashboard, active manifests, and shipments.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mt-6 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <Card className="shadow-lg shadow-zinc-900/5 border-zinc-200/80 backdrop-blur-sm bg-white/90">
          <CardContent className="pt-6">
            <AnimatePresence mode="wait">
              {loginSuccess ? (
                <motion.div
                  key="success-banner"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-10 text-center flex flex-col items-center justify-center space-y-3"
                >
                  <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm animate-bounce">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold text-zinc-900">Welcome, {userName}!</h3>
                  <p className="text-xs text-zinc-500">Launching your workspace...</p>
                  <div className="w-40 h-1 bg-zinc-100 rounded-full overflow-hidden mt-3">
                    <div className="h-full bg-indigo-600 animate-[shimmer_1.5s_infinite]" />
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="text-sm h-10"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-zinc-700">
                        Password
                      </label>
                      <Link
                        to="/forgot-password"
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <Input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="text-sm h-10"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full text-sm font-medium shadow-sm mt-2"
                    size="lg"
                    isLoading={loading}
                  >
                    {loading ? 'Authenticating...' : 'Sign In'}
                    {!loading && <ArrowRight className="ml-1.5 h-4 w-4" />}
                  </Button>
                </form>
              )}
            </AnimatePresence>


          </CardContent>
        </Card>

        <p className="mt-5 text-center text-xs text-zinc-500">
          Need a customer account?{' '}
          <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">
            Self-register in seconds &rarr;
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
