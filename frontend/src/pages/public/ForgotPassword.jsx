import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword } from '../../api/auth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import ShipTrackLogo from '../../components/ui/ShipTrackLogo';
import { KeyRound, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword({ email });
      toast.success('Reset code sent! Check your inbox.');
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Something went wrong');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4.5rem)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-4">
          <ShipTrackLogo iconClassName="h-9 w-9" textClassName="text-xl" />
        </div>
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-3">
          <KeyRound className="h-5 w-5" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Forgot Password</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Enter your registered email address to receive a 6-digit reset code.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-lg shadow-zinc-900/5 border-zinc-200/80 bg-white/95">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Account Email</label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="text-sm h-10"
                />
              </div>

              <Button type="submit" className="w-full text-sm font-medium shadow-sm mt-2" size="lg" isLoading={loading}>
                {loading ? 'Transmitting OTP...' : 'Send Recovery Code'}
                {!loading && <ArrowRight className="ml-1.5 h-4 w-4" />}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-5 text-center">
          <Link to="/login" className="text-xs font-semibold text-zinc-500 hover:text-zinc-800">
            &larr; Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
