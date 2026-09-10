import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import ShipTrackLogo from '../../components/ui/ShipTrackLogo';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, idempotencyKey);
      toast.success('Registration code dispatched! Check your email.');
      navigate(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Registration failed');
      setIdempotencyKey(crypto.randomUUID());
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4.5rem)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-indigo-200/40 via-violet-200/30 to-sky-200/30 rounded-full blur-3xl pointer-events-none -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="sm:mx-auto sm:w-full sm:max-w-md text-center"
      >
        <div className="flex justify-center mb-5">
          <ShipTrackLogo iconClassName="h-10 w-10" textClassName="text-2xl" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
          Create Shipper Account
        </h2>
        <p className="mt-1.5 text-xs text-zinc-500">
          Direct instant self-registration for global freight access.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mt-6 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <Card className="shadow-lg shadow-zinc-900/5 border-zinc-200/80 bg-white/95">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Full Legal Name</label>
                <Input
                  required
                  value={form.name}
                  onChange={update('name')}
                  placeholder="e.g. John Doe"
                  className="text-sm h-10"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Corporate or Personal Email</label>
                <Input
                  type="email"
                  required
                  value={form.email}
                  onChange={update('email')}
                  placeholder="you@company.com"
                  className="text-sm h-10"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Create Password</label>
                <Input
                  type="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={update('password')}
                  placeholder="Minimum 8 characters"
                  className="text-sm h-10"
                />
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 pt-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Protected by 6-digit transactional email OTP verification</span>
              </div>

              <Button type="submit" className="w-full text-sm font-medium shadow-sm mt-2" size="lg" isLoading={loading}>
                {loading ? 'Creating Account...' : 'Continue & Verify'}
                {!loading && <ArrowRight className="ml-1.5 h-4 w-4" />}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-5 text-center text-xs text-zinc-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
            Sign in &rarr;
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
