import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { verifyEmail } from '../../api/auth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import ShipTrackLogo from '../../components/ui/ShipTrackLogo';
import { Mail, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState('idle');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    try {
      await verifyEmail({ email, otp });
      setStatus('success');
      toast.success('Email confirmed! Your account is active.');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Invalid or expired 6-digit code');
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
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Email Address Verified</h2>
          <p className="mt-1.5 text-xs text-zinc-500 mb-6">Your authentication credentials are fully unlocked.</p>
          <Link to="/login">
            <Button size="lg" className="w-full">
              Proceed to Sign In <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4.5rem)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-indigo-200/40 via-violet-200/30 to-sky-200/30 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-4">
          <ShipTrackLogo iconClassName="h-9 w-9" textClassName="text-xl" />
        </div>
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-3">
          <Mail className="h-5 w-5" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Enter Verification Code</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Enter the 6-digit numeric OTP sent to your inbox.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-lg shadow-zinc-900/5 border-zinc-200/80 bg-white/95">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Email address</label>
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

              <Button type="submit" className="w-full text-sm font-medium shadow-sm mt-2" size="lg" isLoading={status === 'loading'}>
                {status === 'loading' ? 'Verifying...' : 'Validate Code'}
              </Button>
            </form>
            
            <div className="mt-4 text-center">
              <button 
                type="button" 
                onClick={async () => {
                  if (!email) return toast.error('Please enter your email first');
                  try {
                    await fetch('/api/v1/auth/resend-verification', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email })
                    });
                    toast.success('A new verification code has been sent!');
                  } catch (e) {
                    toast.error('Failed to resend code. Please try again later.');
                  }
                }}
                className="text-xs text-indigo-600 font-medium hover:text-indigo-500 hover:underline transition-colors"
              >
                Didn't receive the code? Resend
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
