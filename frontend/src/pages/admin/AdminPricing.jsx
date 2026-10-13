import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import {
  Sliders,
  Calculator,
  History,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Save,
  ShieldCheck,
  TrendingDown,
  Info,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { getPricingConfig, updatePricingConfig, getPricingQuote } from '../../api/pricing';

export default function AdminPricing() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [adminNote, setAdminNote] = useState('');

  // Editable form fields
  const [formData, setFormData] = useState({
    baseHandlingFare: 50,
    distanceRatePerKm: 0.2,
    weightRatePerKg: 30,
    dimensionalDivisor: 5000,
    expressMultiplier: 1.4,
    fuelSurchargeRate: 0.05,
    taxRate: 0.18,
    minPrice: 80,
    maxPrice: 50000,
    roadCircuityFactor: 1.25,
  });

  // Simulator state
  const [simOrigin, setSimOrigin] = useState('New Delhi');
  const [simDestination, setSimDestination] = useState('Mumbai');
  const [simWeight, setSimWeight] = useState(1);
  const [simLength, setSimLength] = useState(20);
  const [simWidth, setSimWidth] = useState(15);
  const [simHeight, setSimHeight] = useState(10);
  const [simService, setSimService] = useState('STANDARD');
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await getPricingConfig();
      if (res.data) {
        setConfig(res.data);
        setFormData({
          baseHandlingFare: res.data.baseHandlingFare ?? 50,
          distanceRatePerKm: res.data.distanceRatePerKm ?? 0.2,
          weightRatePerKg: res.data.weightRatePerKg ?? 30,
          dimensionalDivisor: res.data.dimensionalDivisor ?? 5000,
          expressMultiplier: res.data.expressMultiplier ?? 1.4,
          fuelSurchargeRate: res.data.fuelSurchargeRate ?? 0.05,
          taxRate: res.data.taxRate ?? 0.18,
          minPrice: res.data.minPrice ?? 80,
          maxPrice: res.data.maxPrice ?? 50000,
          roadCircuityFactor: res.data.roadCircuityFactor ?? 1.25,
        });
      }
    } catch (err) {
      toast.error('Failed to load rate card configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    const num = parseFloat(value);
    setFormData((prev) => ({
      ...prev,
      [field]: isNaN(num) ? value : num,
    }));
  };

  const handleSimulate = async () => {
    try {
      setSimLoading(true);
      const res = await getPricingQuote({
        origin: simOrigin,
        destination: simDestination,
        weight: parseFloat(simWeight) || 1,
        dimensions: {
          length: parseFloat(simLength) || 10,
          width: parseFloat(simWidth) || 10,
          height: parseFloat(simHeight) || 10,
        },
        serviceType: simService,
        currency: 'INR',
      });
      if (res.data) {
        setSimResult(res.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Simulation calculation failed');
    } finally {
      setSimLoading(false);
    }
  };

  // Auto-simulate on mount or once config is fetched
  useEffect(() => {
    if (config) {
      handleSimulate();
    }
  }, [config]);

  const validateForm = () => {
    if (formData.baseHandlingFare < 0) return 'Base handling fare cannot be negative';
    if (formData.distanceRatePerKm <= 0) return 'Distance rate must be greater than 0';
    if (formData.weightRatePerKg < 0) return 'Weight rate cannot be negative';
    if (formData.dimensionalDivisor <= 0) return 'Dimensional divisor must be greater than 0';
    if (formData.minPrice < 0) return 'Minimum price cannot be negative';
    if (formData.maxPrice <= formData.minPrice) return 'Max price must be greater than Min price';
    return null;
  };

  const handleOpenConfirm = () => {
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }
    setShowConfirmModal(true);
  };

  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      const res = await updatePricingConfig({
        ...formData,
        reason: adminNote || 'Administrative rate card adjustment',
      });
      toast.success('Rate card updated successfully! Active version updated.');
      setShowConfirmModal(false);
      setAdminNote('');
      fetchConfig();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update rate card');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Dynamic Pricing Engine & Rate Cards
            </h1>
            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-mono">
              Version {config?.version || '1.0.0'}
            </Badge>
          </div>
          <p className="text-sm text-zinc-500 mt-1">
            Configure authoritative distance formulas, weight slabs, surcharges, and inspect live pricing simulations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchConfig} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={handleOpenConfirm} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Target Pricing Benchmark Notice */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg text-emerald-800">
            <TrendingDown className="h-5 w-5" />
          </div>
          <div className="flex-1 text-sm text-emerald-900">
            <h4 className="font-semibold text-emerald-950 flex items-center gap-2">
              Affordable Intercity Parcel Pricing Benchmark
              <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs">
                Active & Tuned
              </Badge>
            </h4>
            <p className="mt-1 text-emerald-800">
              The pricing engine is configured so that an ordinary 1 kg parcel travelling ~1,000 km (e.g. Delhi to Mumbai road route ~1,438 km) totals <strong>₹340–₹455 INR</strong>, replacing previous inflated charges (~₹5,000). All calculations include road circuity correction (1.25x geodesic multiplier) and are cryptographically verified server-side.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Rate Card Editor & Live Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Rate Card Settings (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b border-zinc-100">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-zinc-900">
                <Sliders className="h-4 w-4 text-indigo-600" />
                Active Rate Card Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Base Handling Fare (₹)
                  </label>
                  <Input
                    type="number"
                    step="5"
                    min="0"
                    value={formData.baseHandlingFare}
                    onChange={(e) => handleInputChange('baseHandlingFare', e.target.value)}
                  />
                  <span className="text-[11px] text-zinc-400">Fixed intake & pickup operational cost</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Distance Rate (₹ / km)
                  </label>
                  <Input
                    type="number"
                    step="0.05"
                    min="0"
                    value={formData.distanceRatePerKm}
                    onChange={(e) => handleInputChange('distanceRatePerKm', e.target.value)}
                  />
                  <span className="text-[11px] text-zinc-400">Charged on estimated road distance</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Weight Rate (₹ / kg)
                  </label>
                  <Input
                    type="number"
                    step="5"
                    min="0"
                    value={formData.weightRatePerKg}
                    onChange={(e) => handleInputChange('weightRatePerKg', e.target.value)}
                  />
                  <span className="text-[11px] text-zinc-400">Applied to chargeable weight</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Volumetric Divisor (IATA)
                  </label>
                  <Input
                    type="number"
                    step="100"
                    min="1000"
                    value={formData.dimensionalDivisor}
                    onChange={(e) => handleInputChange('dimensionalDivisor', e.target.value)}
                  />
                  <span className="text-[11px] text-zinc-400">Standard: 5000 (L×W×H cm / 5000)</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Express Speed Multiplier
                  </label>
                  <Input
                    type="number"
                    step="0.05"
                    min="1"
                    value={formData.expressMultiplier}
                    onChange={(e) => handleInputChange('expressMultiplier', e.target.value)}
                  />
                  <span className="text-[11px] text-zinc-400">e.g. 1.40 = 40% priority surcharge</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Fuel Surcharge Fraction
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={formData.fuelSurchargeRate}
                    onChange={(e) => handleInputChange('fuelSurchargeRate', e.target.value)}
                  />
                  <span className="text-[11px] text-zinc-400">e.g. 0.05 = 5% indexed fuel charge</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    GST / Tax Rate
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={formData.taxRate}
                    onChange={(e) => handleInputChange('taxRate', e.target.value)}
                  />
                  <span className="text-[11px] text-zinc-400">e.g. 0.18 = 18% standard GST</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Road Circuity Factor
                  </label>
                  <Input
                    type="number"
                    step="0.05"
                    min="1"
                    value={formData.roadCircuityFactor}
                    onChange={(e) => handleInputChange('roadCircuityFactor', e.target.value)}
                  />
                  <span className="text-[11px] text-zinc-400">Geodesic to highway multiplier (1.25x)</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Minimum Charge (₹)
                  </label>
                  <Input
                    type="number"
                    step="10"
                    min="0"
                    value={formData.minPrice}
                    onChange={(e) => handleInputChange('minPrice', e.target.value)}
                  />
                  <span className="text-[11px] text-zinc-400">Floor charge for local short deliveries</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Maximum Safety Cap (₹)
                  </label>
                  <Input
                    type="number"
                    step="1000"
                    min="100"
                    value={formData.maxPrice}
                    onChange={(e) => handleInputChange('maxPrice', e.target.value)}
                  />
                  <span className="text-[11px] text-zinc-400">Ceiling cap to prevent runaway bills</span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleOpenConfirm}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Review & Apply Rate Card
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Audit History Card */}
          {config?.auditLog && config.auditLog.length > 0 && (
            <Card>
              <CardHeader className="pb-3 border-b border-zinc-100">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-zinc-900">
                  <History className="h-4 w-4 text-zinc-500" />
                  Audit Trail & Rate Card Revision History
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 divide-y divide-zinc-100 max-h-60 overflow-y-auto">
                {config.auditLog.map((log, idx) => (
                  <div key={idx} className="py-2.5 text-xs flex justify-between items-start">
                    <div>
                      <p className="font-medium text-zinc-800">
                        {log.reason || 'Rate card updated'}
                      </p>
                      <p className="text-zinc-400 text-[11px]">
                        Admin: {log.updatedBy || 'Super Admin'} &bull; Version: {log.version || 'prev'}
                      </p>
                    </div>
                    <span className="text-zinc-400 text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Live Simulator & Rate Inspector (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-indigo-100 shadow-xs">
            <CardHeader className="pb-3 border-b border-zinc-100 bg-indigo-50/40">
              <CardTitle className="text-base font-semibold flex items-center justify-between text-indigo-950">
                <span className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-indigo-600" />
                  Live Quote Simulator
                </span>
                <span className="text-xs font-normal text-indigo-600">Testing Engine</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Origin City</label>
                  <Input
                    value={simOrigin}
                    onChange={(e) => setSimOrigin(e.target.value)}
                    placeholder="New Delhi"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Destination City</label>
                  <Input
                    value={simDestination}
                    onChange={(e) => setSimDestination(e.target.value)}
                    placeholder="Mumbai"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Weight (kg)</label>
                  <Input
                    type="number"
                    step="0.5"
                    value={simWeight}
                    onChange={(e) => setSimWeight(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">L (cm)</label>
                  <Input
                    type="number"
                    value={simLength}
                    onChange={(e) => setSimLength(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">W (cm)</label>
                  <Input
                    type="number"
                    value={simWidth}
                    onChange={(e) => setSimWidth(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">H (cm)</label>
                  <Input
                    type="number"
                    value={simHeight}
                    onChange={(e) => setSimHeight(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Service Tier</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSimService('STANDARD')}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all ${
                      simService === 'STANDARD'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
                        : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    Standard Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimService('EXPRESS')}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all ${
                      simService === 'EXPRESS'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
                        : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    Express Air / Priority
                  </button>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                onClick={handleSimulate}
                disabled={simLoading}
              >
                {simLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Recalculate Estimate
              </Button>

              {/* Simulation Result Preview */}
              {simResult && (
                <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-3">
                  <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
                    <span className="text-xs font-semibold text-zinc-700">Estimated Total</span>
                    <span className="text-xl font-bold text-zinc-900">
                      ₹{simResult.totalPrice?.toFixed(2)} {simResult.currency}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-zinc-600">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Route Distance (approx. road):</span>
                      <span className="font-medium text-zinc-800">{simResult.distanceKm} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Chargeable Weight:</span>
                      <span className="font-medium text-zinc-800">{simResult.chargeableWeight} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Base Intake Fare:</span>
                      <span>₹{simResult.breakdown?.baseFare?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Distance Component:</span>
                      <span>₹{simResult.breakdown?.distanceCharge?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Weight Component:</span>
                      <span>₹{simResult.breakdown?.weightCharge?.toFixed(2)}</span>
                    </div>
                    {simResult.breakdown?.expressSurcharge > 0 && (
                      <div className="flex justify-between text-indigo-600">
                        <span>Express Priority Surcharge:</span>
                        <span>₹{simResult.breakdown?.expressSurcharge?.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Fuel Surcharge:</span>
                      <span>₹{simResult.breakdown?.fuelSurcharge?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">GST / Tax:</span>
                      <span>₹{simResult.breakdown?.tax?.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-200 flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400">Pricing Engine Version</span>
                    <Badge variant="outline" className="text-[10px]">
                      {simResult.pricingVersion || 'v1.0'}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pricing Architecture Documentation Card */}
          <Card className="bg-zinc-900 text-white border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-zinc-100">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Anti-Tampering & Security Guarantee
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-zinc-300 space-y-2">
              <p>
                1. <strong>Authoritative Server Quotes:</strong> The client UI displays estimates, but the final payable amount is always recalculated and signed by the backend pricing service upon shipment booking.
              </p>
              <p>
                2. <strong>Immutable Audit Snapshot:</strong> Every order stores the exact breakdown and pricing version at moment of creation. Updating rates here will never mutate existing historical orders.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-2 bg-amber-50 rounded-full">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900">Confirm Rate Card Update</h3>
            </div>
            <p className="text-sm text-zinc-600">
              You are about to publish a new active pricing rate card. All new shipment bookings will immediately compute costs based on these rates.
            </p>

            <div className="rounded-lg bg-zinc-50 p-3 text-xs space-y-1.5 border border-zinc-200">
              <div className="flex justify-between">
                <span className="text-zinc-500">Base Handling Fare:</span>
                <span className="font-semibold">₹{formData.baseHandlingFare}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Distance Rate:</span>
                <span className="font-semibold">₹{formData.distanceRatePerKm}/km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Weight Rate:</span>
                <span className="font-semibold">₹{formData.weightRatePerKg}/kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Min / Max Cap:</span>
                <span className="font-semibold">₹{formData.minPrice} &ndash; ₹{formData.maxPrice}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Reason for Change (Audit Note)
              </label>
              <Input
                placeholder="e.g. Q3 fuel price correction, quarterly inflation adjustment"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowConfirmModal(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveConfig}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Publishing...
                  </>
                ) : (
                  'Confirm & Publish'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
