import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { resetPassword } from '../../api/auth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import ShipTrackLogo from '../../components/ui/ShipTrackLogo';
import { ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState('idle');

  async function handleSubmit(e) {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    setStatus('loading');
    try {
      await resetPassword({ email, otp, newPassword });
      setStatus('success');
      toast.success('Password updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Invalid or expired code');
      setStatus('idle');
    }
  }

  if (status === 'success') {
    return (
      <div className="min-h-[calc(100vh-4.5rem)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-5 shadow-sm border border-emerald-100">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Password Reset Successful</h2>
          <p className="mt-1.5 text-xs text-zinc-500 mb-6">Your authentication credentials have been securely updated.</p>
          <Link to="/login">
            <Button size="lg" className="w-full">
              Sign In With New Password <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4.5rem)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-4">
          <ShipTrackLogo iconClassName="h-9 w-9" textClassName="text-xl" />
        </div>
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-3">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Create New Password</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Enter your 6-digit verification code and new password.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-lg shadow-zinc-900/5 border-zinc-200/80 bg-white/95">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Email Address</label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-sm h-10"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">6-Digit Confirmation Code</label>
                <Input
                  type="text"
                  required
                  maxLength={6}
                  pattern="\d{6}"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl font-mono tracking-[0.4em] h-12"
                  placeholder="000000"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">New Secure Password</label>
                <Input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="text-sm h-10"
                />
              </div>

              <Button type="submit" className="w-full text-sm font-medium shadow-sm mt-2" size="lg" isLoading={status === 'loading'}>
                {status === 'loading' ? 'Updating Password...' : 'Save New Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
