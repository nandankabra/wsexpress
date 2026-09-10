import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import ShipTrackLogo from '../../components/ui/ShipTrackLogo';
import {
  Truck,
  Globe,
  Shield,
  Zap,
  ArrowRight,
  Activity,
  MapPin,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
  Server,
  Lock,
  Boxes,
  TrendingUp,
  Clock,
  Compass
} from 'lucide-react';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('tracking');

  const features = [
    {
      name: 'Dynamic Corridor Routing',
      description: 'Automatically matches cargo weight, dimensions, and destination country to the most cost-effective verified carrier in milliseconds.',
      icon: Zap,
      stat: '< 180ms quote latency',
      tag: 'Speed',
    },
    {
      name: 'Real-Time Telemetry Events',
      description: 'Stream GPS and transit milestones into MongoDB with sub-second propagation to customer and carrier dashboards.',
      icon: Activity,
      stat: '99.98% uptime',
      tag: 'Real-Time',
    },
    {
      name: 'Idempotent Financial Ledger',
      description: 'Never double-charge a customer or double-book cargo. Every manifest is protected by UUIDv4 idempotency keys and state locking.',
      icon: Shield,
      stat: 'Zero collision risk',
      tag: 'Security',
    },
    {
      name: 'Carrier Fleet Verification',
      description: 'Enterprise moderation workflow for background checks, commercial license approvals, and vehicle cargo volume rating.',
      icon: Truck,
      stat: '500+ verified fleets',
      tag: 'Compliance',
    },
  ];

  const metrics = [
    { label: 'Avg Transit Quote Latency', value: '142ms' },
    { label: 'Global Air & Ocean Corridors', value: '180+' },
    { label: 'On-Time SLA Guarantee', value: '99.94%' },
    { label: 'Enterprise Uptime SLA', value: '99.99%' },
  ];

  return (
    <div className="flex-1 bg-white text-zinc-900 overflow-hidden">
      {/* Hero Section with Ambient Glow and Grid */}
      <section className="relative pt-16 pb-24 sm:pt-24 sm:pb-32 overflow-hidden border-b border-zinc-100">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_40%,#000_70%,transparent_100%)]" />

        {/* Ambient Gradient Blobs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-indigo-300/30 via-violet-200/20 to-sky-200/30 blur-[100px] pointer-events-none -z-10" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-6xl lg:text-7xl leading-[1.1]"
            >
              Global Freight Orchestration{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700">
                at High Velocity.
              </span>
            </motion.h1>

            {/* Supporting description */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 text-base sm:text-lg leading-relaxed text-zinc-600 max-w-2xl mx-auto"
            >
              The unified logistics operating system for automated carrier dispatch, real-time telemetry streaming, and instant cross-border freight quotes.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <Link to="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto px-7 rounded-xl font-semibold shadow-md shadow-indigo-600/20 group">
                  Start Shipping Free
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/track" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto px-6 rounded-xl font-medium bg-white">
                  <MapPin className="mr-2 h-4 w-4 text-zinc-500" />
                  Live Tracking Console
                </Button>
              </Link>
            </motion.div>

            {/* Trust highlights */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8 flex items-center justify-center gap-6 text-xs text-zinc-500"
            >
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                No setup fees
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Instant OTP verification
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Open REST API
              </span>
            </motion.div>
          </div>

          {/* Interactive SaaS Dashboard Mockup Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="mt-14 max-w-5xl mx-auto rounded-2xl border border-zinc-200/80 bg-zinc-900 p-2 shadow-2xl shadow-indigo-950/15"
          >
            {/* Mock Window Controls */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/90 border-b border-zinc-800 rounded-t-xl">
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                <span className="ml-3 text-[11px] font-mono text-zinc-400">console.shiptrack.com &mdash; telemetry-stream</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                  GATEWAY CLUSTER: OK
                </span>
              </div>
            </div>

            {/* Mock Dashboard Body */}
            <div className="bg-zinc-950 p-6 rounded-b-xl text-white font-sans">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
                  <span className="text-xs text-zinc-400">Live Active Corridors</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-bold font-mono text-white">1,489</span>
                    <span className="text-xs text-emerald-400 font-mono">+12.4% vs last hr</span>
                  </div>
                </div>
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
                  <span className="text-xs text-zinc-400">Telemetry Pings / Sec</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-bold font-mono text-indigo-400">4,820</span>
                    <span className="text-xs text-zinc-400 font-mono">0.00% drops</span>
                  </div>
                </div>
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
                  <span className="text-xs text-zinc-400">Automated Dispatch</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-bold font-mono text-emerald-400">99.8%</span>
                    <span className="text-xs text-zinc-400 font-mono">Carrier SLA</span>
                  </div>
                </div>
              </div>

              {/* Simulated Cargo Flight Route Visualizer */}
              <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
                    <span className="text-xs font-semibold text-zinc-300 font-mono">MANIFEST #STK-89240A &mdash; EXPRESS FREIGHT</span>
                  </div>
                  <span className="text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 rounded-full font-mono">
                    IN_TRANSIT
                  </span>
                </div>

                <div className="flex justify-between items-center px-4 py-4 relative">
                  <div className="absolute left-[36px] right-[36px] top-9 h-0.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-zinc-700" />

                  <div className="flex flex-col items-center relative z-10">
                    <div className="h-10 w-10 rounded-full bg-indigo-950 border border-indigo-500 flex items-center justify-center text-indigo-400">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-mono font-bold mt-2">Tokyo (NRT)</span>
                    <span className="text-[10px] text-zinc-500">Departed 14:00</span>
                  </div>

                  <div className="flex flex-col items-center relative z-10">
                    <div className="h-10 w-10 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/30">
                      <Truck className="h-4 w-4 animate-pulse" />
                    </div>
                    <span className="text-xs font-mono font-bold mt-2 text-violet-400">Pacific Air Corridor</span>
                    <span className="text-[10px] text-zinc-400">Altitude: 36,000ft</span>
                  </div>

                  <div className="flex flex-col items-center relative z-10">
                    <div className="h-10 w-10 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-500">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-mono font-bold mt-2">San Francisco (SFO)</span>
                    <span className="text-[10px] text-zinc-500">ETA: 06:30 PST</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="py-14 bg-zinc-50 border-b border-zinc-200/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {metrics.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="p-4"
              >
                <p className="text-3xl sm:text-4xl font-extrabold text-zinc-900 font-mono tracking-tight">{m.value}</p>
                <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-1">{m.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              Engineered Capabilities
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
              Everything required to run modern logistics
            </h2>
            <p className="mt-3 text-sm sm:text-base text-zinc-500">
              Replace legacy spreadsheets and slow emails with high-frequency microservice architecture.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-8 hover:bg-white hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-900/5 transition-all group"
                >
                  <div className="flex items-center justify-between mb-5">
                    <div className="h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-[11px] font-mono font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                      {feature.stat}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-zinc-900">{feature.name}</h3>
                  <p className="mt-2 text-sm text-zinc-600 leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Microservices Architecture Highlight */}
      <section className="py-20 bg-zinc-950 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-mono uppercase text-indigo-400 tracking-wider">
                Resilience & Reliability
              </span>
              <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">
                True Polyglot Persistence & Containerized Isolation
              </h2>
              <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
                ShipTrack is built from decoupled microservices communicating through an intelligent reverse-proxy API Gateway. Each container encapsulates its own persistent state.
              </p>

              <div className="mt-8 space-y-3">
                {[
                  { name: 'PostgreSQL Relational Storage', desc: 'ACID-compliant storage for users, authentication, and manifests' },
                  { name: 'MongoDB Time-Series Events', desc: 'High-throughput document store for rapid checkpoint tracking telemetry' },
                  { name: 'MySQL Relational Catalog', desc: 'Dedicated storage for distance matrices and pricing tables' },
                  { name: 'Stateless JWT & Refresh Vault', desc: 'Secure token authentication with cryptographic bcrypt hashing' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs">
                    <div className="h-5 w-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <span className="font-semibold text-zinc-200">{item.name}: </span>
                      <span className="text-zinc-400">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Link to="/register">
                  <Button className="bg-white text-zinc-900 hover:bg-zinc-100 font-semibold shadow-none">
                    Explore Developer API &rarr;
                  </Button>
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 font-mono text-xs text-zinc-300">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800 text-[11px] text-zinc-500">
                <span>CLOUD INFRASTRUCTURE MESH</span>
                <span className="text-emerald-400">ALL SERVICES OPERATIONAL</span>
              </div>
              <div className="mt-4 space-y-2.5">
                {[
                  { name: 'Edge Reverse Proxy', endpoint: '/api/v1/gateway', tech: 'Gateway / Rate Limiter' },
                  { name: 'Auth & Session Vault', endpoint: '/api/v1/auth', tech: 'JWT / Mailer OTP' },
                  { name: 'Shipment Order Ledger', endpoint: '/api/v1/shipments', tech: 'PostgreSQL Relational' },
                  { name: 'Live Telemetry Pipeline', endpoint: '/api/v1/tracking', tech: 'MongoDB Time-Series' },
                  { name: 'Corridor Dynamic Matrix', endpoint: '/api/v1/pricing', tech: 'Real-Time Pricing Engine' },
                  { name: 'Carrier Verification Node', endpoint: '/api/v1/carriers', tech: 'Compliance & Rating' },
                  { name: 'Transactional Dispatch', endpoint: '/api/v1/notifications', tech: 'SMTP & Webhooks' },
                ].map((s) => (
                  <div key={s.name} className="flex items-center justify-between p-2.5 rounded bg-zinc-950/60 border border-zinc-800/60">
                    <span className="text-zinc-200">{s.name}</span>
                    <div className="flex items-center gap-3 text-zinc-400 text-[11px]">
                      <span className="text-zinc-500">{s.endpoint}</span>
                      <span className="text-indigo-400 font-semibold">{s.tech}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="py-20 bg-indigo-600 text-white text-center relative overflow-hidden">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-3xl font-extrabold sm:text-4xl">
            Ready to streamline your shipping pipeline?
          </h2>
          <p className="mt-3 text-sm sm:text-base text-indigo-100 max-w-xl mx-auto">
            Join thousands of shippers and verified carriers executing frictionless freight delivery worldwide.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/register">
              <Button size="lg" className="bg-white text-indigo-700 hover:bg-indigo-50 font-bold px-8 shadow-lg">
                Create Free Shipper Account
              </Button>
            </Link>
            <Link to="/track">
              <Button variant="outline" size="lg" className="text-white border-white/40 hover:bg-indigo-700 font-semibold px-6">
                Test Public Tracking
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Global SaaS Footer */}
      <footer className="bg-white py-12 border-t border-zinc-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center">
            <ShipTrackLogo iconClassName="h-7 w-7" textClassName="text-base font-bold" />
          </div>

          <div className="flex items-center gap-6 text-xs text-zinc-500 font-medium">
            <Link to="/track" className="hover:text-zinc-900 transition-colors">Public Tracking</Link>
            <Link to="/login" className="hover:text-zinc-900 transition-colors">Shipper Sign In</Link>
            <Link to="/register" className="hover:text-zinc-900 transition-colors">Register</Link>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span>All systems fully operational &middot; &copy; {new Date().getFullYear()} ShipTrack Inc.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
