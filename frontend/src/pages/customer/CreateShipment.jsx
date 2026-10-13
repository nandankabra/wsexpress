import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQuote, createShipment, downloadLabel, downloadInvoice } from '../../api/shipments';
import { processPayment } from '../../api/payments';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import {
  PackageOpen,
  ArrowRight,
  ShieldAlert,
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  CheckCircle2,
  XCircle,
  Download,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_ORIGIN = { address: '12 Connaught Place', city: 'New Delhi', country: 'IN' };
const DEFAULT_DEST = { address: '45 Marine Drive', city: 'Mumbai', country: 'IN' };

export default function CreateShipment() {
  const navigate = useNavigate();

  // Booking Form State
  const [origin, setOrigin] = useState(DEFAULT_ORIGIN);
  const [destination, setDestination] = useState(DEFAULT_DEST);
  const [weightKg, setWeightKg] = useState('1');
  const [dimensionsCm, setDimensionsCm] = useState({ length: 25, width: 20, height: 15 });
  const [packageType, setPackageType] = useState('PARCEL');
  const [serviceType, setServiceType] = useState('STANDARD');
  const [quote, setQuote] = useState(null);
  const [calculating, setCalculating] = useState(false);

  // Checkout Lifecycle State
  const [currentStep, setCurrentStep] = useState('QUOTE'); // 'QUOTE' | 'CHECKOUT' | 'SUCCESS' | 'FAILED'
  const [createdOrder, setCreatedOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CREDIT_CARD');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '4242424242424242',
    nameOnCard: 'Test Customer',
    expiryMonth: '12',
    expiryYear: '2028',
    cvv: '123',
  });
  const [upiId, setUpiId] = useState('success@shiptrack');
  const [bankCode, setBankCode] = useState('HDFC');
  const [walletProvider, setWalletProvider] = useState('PAYTM');
  const [paying, setPaying] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

  function buildPayload() {
    return {
      origin,
      destination,
      weightKg: Number(weightKg) || 1,
      dimensionsCm: {
        length: Number(dimensionsCm.length) || 10,
        width: Number(dimensionsCm.width) || 10,
        height: Number(dimensionsCm.height) || 10,
      },
      packageType,
      serviceType,
      currency: 'INR',
    };
  }

  async function handleGetQuote(e) {
    if (e) e.preventDefault();
    setCalculating(true);
    try {
      const q = await getQuote(buildPayload());
      setQuote(q);
      toast.success('Live dynamic price calculated!');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Could not calculate quote');
    } finally {
      setCalculating(false);
    }
  }

  async function handleProceedToCheckout() {
    if (!quote) {
      await handleGetQuote();
    }
    setCalculating(true);
    try {
      // 1. Authoritative order creation in server
      const shipment = await createShipment(buildPayload(), crypto.randomUUID());
      setCreatedOrder(shipment);
      setIdempotencyKey(crypto.randomUUID());
      setCurrentStep('CHECKOUT');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Could not initiate order');
    } finally {
      setCalculating(false);
    }
  }

  async function handleProcessPayment() {
    if (!createdOrder) return;
    setPaying(true);

    let paymentDetails = {};
    if (paymentMethod === 'CREDIT_CARD' || paymentMethod === 'DEBIT_CARD') {
      paymentDetails = {
        cardNumber: cardDetails.cardNumber,
        nameOnCard: cardDetails.nameOnCard,
        expiryMonth: cardDetails.expiryMonth,
        expiryYear: cardDetails.expiryYear,
      };
    } else if (paymentMethod === 'UPI') {
      paymentDetails = { upiId };
    } else if (paymentMethod === 'NET_BANKING') {
      paymentDetails = { bankCode };
    } else if (paymentMethod === 'WALLET') {
      paymentDetails = { walletProvider };
    }

    try {
      const res = await processPayment(
        {
          orderId: createdOrder.id,
          paymentMethod,
          paymentDetails,
          idempotencyKey,
        },
        idempotencyKey
      );

      setPaymentResult(res);
      if (res.success) {
        setCurrentStep('SUCCESS');
        toast.success('Test payment successful! Order confirmed.');
      } else {
        setCurrentStep('FAILED');
        toast.error(res.message || 'Payment simulation declined');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error?.message || 'Payment processing failed';
      setPaymentResult({ success: false, message: msg });
      setCurrentStep('FAILED');
      toast.error(msg);
    } finally {
      setPaying(false);
    }
  }

  async function handleDownloadDoc(type) {
    if (!createdOrder?.id) return;
    try {
      const blob = type === 'label' ? await downloadLabel(createdOrder.id) : await downloadInvoice(createdOrder.id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}-${createdOrder.trackingId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      toast.error(`Failed to download ${type}`);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Book Intercity Shipment</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Intelligent corridor pricing, route distance calculation &amp; secure test payment checkout.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {currentStep === 'QUOTE' && (
          <motion.div
            key="quote-step"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid gap-6 lg:grid-cols-3"
          >
            {/* Left 2 Cols: Route and Parcel Form */}
            <div className="lg:col-span-2 space-y-6">
              <form id="quote-form" onSubmit={handleGetQuote} className="space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>Pickup &amp; Delivery Corridors</span>
                      <Badge variant="outline" className="text-xs font-normal">
                        Geodesic Road Routing
                      </Badge>
                    </CardTitle>
                    <CardDescription>Enter intercity origin and destination locations.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Origin */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[11px] text-indigo-700 font-bold">1</span>
                        Origin (Dispatch)
                      </h3>
                      <div className="grid gap-3">
                        <Input
                          placeholder="Street Address / Hub"
                          required
                          value={origin.address}
                          onChange={(e) => setOrigin({ ...origin, address: e.target.value })}
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            placeholder="City (e.g. New Delhi, Mumbai, Pune)"
                            required
                            value={origin.city}
                            onChange={(e) => setOrigin({ ...origin, city: e.target.value })}
                          />
                          <Input
                            placeholder="Country Code"
                            required
                            maxLength={2}
                            value={origin.country}
                            onChange={(e) => setOrigin({ ...origin, country: e.target.value.toUpperCase() })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-zinc-100 pt-4 space-y-3">
                      <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[11px] text-indigo-700 font-bold">2</span>
                        Destination (Delivery)
                      </h3>
                      <div className="grid gap-3">
                        <Input
                          placeholder="Street Address / Consignee"
                          required
                          value={destination.address}
                          onChange={(e) => setDestination({ ...destination, address: e.target.value })}
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            placeholder="City (e.g. Mumbai, Bengaluru, Chennai)"
                            required
                            value={destination.city}
                            onChange={(e) => setDestination({ ...destination, city: e.target.value })}
                          />
                          <Input
                            placeholder="Country Code"
                            required
                            maxLength={2}
                            value={destination.country}
                            onChange={(e) => setDestination({ ...destination, country: e.target.value.toUpperCase() })}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Parcel Specifications &amp; Speed</CardTitle>
                    <CardDescription>Weight slabs, dimensional size, and service tier.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-zinc-600 mb-1">Actual Weight (kg)</label>
                        <Input
                          type="number"
                          min="0.1"
                          step="0.1"
                          required
                          value={weightKg}
                          onChange={(e) => setWeightKg(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-600 mb-1">Package Type</label>
                        <Select value={packageType} onChange={(e) => setPackageType(e.target.value)}>
                          <option value="PARCEL">Standard Parcel</option>
                          <option value="DOCUMENT">Document / Envelope</option>
                          <option value="PALLET">Pallet Freight</option>
                          <option value="FREIGHT">Heavy Cargo</option>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-600 mb-1">
                        Dimensions (L × W × H in cm) for Volumetric Weight
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        <Input
                          type="number"
                          placeholder="Length"
                          value={dimensionsCm.length}
                          onChange={(e) => setDimensionsCm({ ...dimensionsCm, length: Number(e.target.value) })}
                        />
                        <Input
                          type="number"
                          placeholder="Width"
                          value={dimensionsCm.width}
                          onChange={(e) => setDimensionsCm({ ...dimensionsCm, width: Number(e.target.value) })}
                        />
                        <Input
                          type="number"
                          placeholder="Height"
                          value={dimensionsCm.height}
                          onChange={(e) => setDimensionsCm({ ...dimensionsCm, height: Number(e.target.value) })}
                        />
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        IATA Volumetric Divisor: 5,000 cm³/kg. Chargeable weight applies highest of actual vs volumetric.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-600 mb-1">Delivery Speed Tier</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setServiceType('STANDARD')}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            serviceType === 'STANDARD'
                              ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                              : 'border-zinc-200 hover:border-zinc-300'
                          }`}
                        >
                          <p className="text-xs font-semibold text-zinc-900">Standard Freight</p>
                          <p className="text-[11px] text-zinc-500 mt-0.5">Economical 2–4 business days</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setServiceType('EXPRESS')}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            serviceType === 'EXPRESS'
                              ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                              : 'border-zinc-200 hover:border-zinc-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-zinc-900">Express Priority</p>
                            <Badge className="bg-indigo-600 text-[10px] py-0 px-1.5">Fast</Badge>
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-0.5">Expedited 1–2 business days</p>
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </form>
            </div>

            {/* Right Col: Transparent Quote Breakdown */}
            <div>
              <div className="sticky top-20 space-y-4">
                <Card className="bg-zinc-900 text-white border-zinc-800 shadow-md">
                  <CardHeader className="pb-3 border-b border-zinc-800">
                    <CardTitle className="text-white text-base flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <PackageOpen className="h-4 w-4 text-indigo-400" />
                        Dynamic Quote
                      </span>
                      {quote && (
                        <span className="text-[11px] font-mono font-normal text-indigo-300">
                          {quote.configVersion}
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    {quote ? (
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs text-zinc-400">Total Delivery Charge</p>
                          <div className="flex items-baseline gap-2 mt-0.5">
                            <span className="text-3xl font-extrabold text-white">
                              ₹{Number(quote.totalAmount || quote.priceAmount).toFixed(2)}
                            </span>
                            <span className="text-xs text-zinc-400">{quote.currency}</span>
                          </div>
                          <p className="text-[11px] text-emerald-400 font-medium mt-1">
                            Estimated transit: {quote.estimatedDays} business day(s)
                          </p>
                        </div>

                        {/* Itemized Transparent Breakdown */}
                        <div className="border-t border-zinc-800 pt-3 space-y-2 text-xs">
                          <p className="font-semibold text-zinc-300 text-[11px] uppercase tracking-wider">
                            Transparent Breakdown
                          </p>
                          <div className="flex justify-between text-zinc-300">
                            <span>Base Handling Fare</span>
                            <span>₹{Number(quote.baseFare || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-zinc-300">
                            <span>
                              Distance ({quote.distanceKm} km)
                            </span>
                            <span>₹{Number(quote.distanceCharge || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-zinc-300">
                            <span>
                              Weight ({quote.chargeableWeightKg || weightKg} kg)
                            </span>
                            <span>₹{Number(quote.weightCharge || 0).toFixed(2)}</span>
                          </div>
                          {Number(quote.serviceSurcharge) > 0 && (
                            <div className="flex justify-between text-indigo-300">
                              <span>Express Surcharge</span>
                              <span>+₹{Number(quote.serviceSurcharge).toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-zinc-300">
                            <span>Fuel Surcharge (5%)</span>
                            <span>₹{Number(quote.fuelSurcharge || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-zinc-300">
                            <span>GST / Tax (18%)</span>
                            <span>₹{Number(quote.taxAmount || 0).toFixed(2)}</span>
                          </div>
                        </div>

                        <Button
                          className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2.5 shadow-none"
                          size="lg"
                          onClick={handleProceedToCheckout}
                          isLoading={calculating}
                        >
                          Book &amp; Proceed to Checkout <ArrowRight className="h-4 w-4 ml-1.5" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-6 space-y-4">
                        <p className="text-xs text-zinc-400">
                          Fill in origin &amp; destination to calculate transparent corridor shipping costs.
                        </p>
                        <Button
                          type="submit"
                          form="quote-form"
                          className="w-full bg-indigo-500 hover:bg-indigo-600 text-white shadow-none"
                          isLoading={calculating}
                        >
                          Calculate Instant Quote
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {quote && (
                  <div className="p-3 bg-zinc-100 rounded-lg border border-zinc-200 text-xs text-zinc-600 flex items-start gap-2">
                    <Info className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>
                      Corridor route: {origin.city} $\rightarrow$ {destination.city} (~{quote.distanceKm} km).
                      Authoritative rate calculated server-side.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2: TEST MODE CHECKOUT INTERFACE */}
        {currentStep === 'CHECKOUT' && createdOrder && (
          <motion.div
            key="checkout-step"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6"
          >
            {/* Prominent Test Mode Only Banner */}
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-xs flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold flex items-center gap-2">
                  <span>⚡ SIMULATED PAYMENT GATEWAY — TESTING MODE ACTIVE</span>
                  <Badge variant="warning" className="text-[10px] py-0 px-2 font-mono">
                    SANDBOX
                  </Badge>
                </p>
                <p className="text-xs text-amber-800 mt-0.5">
                  This checkout is running in testing simulation mode. <strong>No real money will be charged</strong>. Use the test credentials provided below to simulate successful or declined transactions.
                </p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Payment Method Selector & Form */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Select Test Payment Method</CardTitle>
                    <CardDescription>Choose how you want to simulate this transaction.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Payment Method Tabs */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'CREDIT_CARD', name: 'Credit Card', icon: CreditCard },
                        { id: 'DEBIT_CARD', name: 'Debit Card', icon: CreditCard },
                        { id: 'UPI', name: 'UPI / QR', icon: Smartphone },
                        { id: 'NET_BANKING', name: 'Net Banking', icon: Building2 },
                      ].map((m) => {
                        const Icon = m.icon;
                        const isSelected = paymentMethod === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setPaymentMethod(m.id)}
                            className={`p-3 rounded-lg border text-left flex flex-col items-center justify-center gap-1.5 transition-all ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-50/60 text-indigo-700 font-semibold ring-1 ring-indigo-600'
                                : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            <span className="text-xs">{m.name}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Method Specific Form */}
                    {(paymentMethod === 'CREDIT_CARD' || paymentMethod === 'DEBIT_CARD') && (
                      <div className="space-y-4 pt-2 border-t border-zinc-100">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-zinc-700">Test Card Presets</label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setCardDetails({ ...cardDetails, cardNumber: '4242424242424242' })}
                              className="text-[11px] text-indigo-600 hover:underline font-medium"
                            >
                              Success (Visa)
                            </button>
                            <span className="text-zinc-300">|</span>
                            <button
                              type="button"
                              onClick={() => setCardDetails({ ...cardDetails, cardNumber: '4000000000000002' })}
                              className="text-[11px] text-red-600 hover:underline font-medium"
                            >
                              Decline
                            </button>
                            <span className="text-zinc-300">|</span>
                            <button
                              type="button"
                              onClick={() => setCardDetails({ ...cardDetails, cardNumber: '4000000000000003' })}
                              className="text-[11px] text-amber-600 hover:underline font-medium"
                            >
                              No Funds
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs text-zinc-600 mb-1">Card Number</label>
                          <Input
                            placeholder="4242 4242 4242 4242"
                            value={cardDetails.cardNumber}
                            onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: e.target.value })}
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="col-span-2">
                            <label className="block text-xs text-zinc-600 mb-1">Cardholder Name</label>
                            <Input
                              value={cardDetails.nameOnCard}
                              onChange={(e) => setCardDetails({ ...cardDetails, nameOnCard: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-zinc-600 mb-1">Expiry &amp; CVV</label>
                            <div className="grid grid-cols-2 gap-1.5">
                              <Input
                                placeholder="MM/YY"
                                value={`${cardDetails.expiryMonth}/${cardDetails.expiryYear.slice(-2)}`}
                                onChange={() => {}}
                              />
                              <Input placeholder="CVV" value={cardDetails.cvv} onChange={() => {}} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'UPI' && (
                      <div className="space-y-3 pt-2 border-t border-zinc-100">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-zinc-700">Virtual UPI Handle</label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setUpiId('success@shiptrack')}
                              className="text-[11px] text-indigo-600 hover:underline font-medium"
                            >
                              Preset: Success
                            </button>
                            <span className="text-zinc-300">|</span>
                            <button
                              type="button"
                              onClick={() => setUpiId('decline@shiptrack')}
                              className="text-[11px] text-red-600 hover:underline font-medium"
                            >
                              Preset: Reject
                            </button>
                          </div>
                        </div>
                        <Input
                          placeholder="username@bank (e.g. success@shiptrack)"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                        />
                        <p className="text-[11px] text-zinc-400">
                          Simulated UPI collect intent. No notification will be sent to any real phone.
                        </p>
                      </div>
                    )}

                    {paymentMethod === 'NET_BANKING' && (
                      <div className="space-y-3 pt-2 border-t border-zinc-100">
                        <label className="text-xs font-semibold text-zinc-700">Select Test Bank</label>
                        <Select value={bankCode} onChange={(e) => setBankCode(e.target.value)}>
                          <option value="HDFC">HDFC Bank (Test Simulator)</option>
                          <option value="ICICI">ICICI Bank (Test Simulator)</option>
                          <option value="SBI">State Bank of India (Test Simulator)</option>
                          <option value="AXIS">Axis Bank (Test Simulator)</option>
                          <option value="FAIL_BANK">Failure Simulation Bank</option>
                        </Select>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary & Authoritative Payment Action */}
              <div>
                <Card className="bg-zinc-900 text-white border-zinc-800 shadow-md">
                  <CardHeader className="pb-3 border-b border-zinc-800">
                    <CardTitle className="text-white text-base">Order Review</CardTitle>
                    <CardDescription className="text-zinc-400 text-xs font-mono">
                      {createdOrder.orderNumber || createdOrder.trackingId}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-zinc-300">
                        <span>Route Corridor</span>
                        <span className="font-medium text-white">{origin.city} $\rightarrow$ {destination.city}</span>
                      </div>
                      <div className="flex justify-between text-zinc-300">
                        <span>Parcel Weight</span>
                        <span>{weightKg} kg ({serviceType})</span>
                      </div>
                      <div className="flex justify-between text-zinc-300">
                        <span>Payment Mode</span>
                        <span className="text-amber-300 font-medium">Test Simulation</span>
                      </div>
                      <div className="border-t border-zinc-800 pt-3 flex justify-between items-baseline">
                        <span className="text-sm font-bold text-white">Amount Due</span>
                        <span className="text-2xl font-extrabold text-white">
                          ₹{Number(createdOrder.totalAmount || createdOrder.quotedPrice).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 shadow-none"
                      size="lg"
                      onClick={handleProcessPayment}
                      isLoading={paying}
                    >
                      Pay ₹{Number(createdOrder.totalAmount || createdOrder.quotedPrice).toFixed(2)} (Simulated)
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full text-zinc-400 hover:text-white text-xs h-8"
                      onClick={() => setCurrentStep('QUOTE')}
                      disabled={paying}
                    >
                      Back to Quote Details
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3: SUCCESS STATE */}
        {currentStep === 'SUCCESS' && paymentResult && createdOrder && (
          <motion.div
            key="success-step"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl mx-auto"
          >
            <Card className="border-emerald-200 bg-emerald-50/40 text-center p-6">
              <CardContent className="space-y-6 pt-4">
                <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="h-10 w-10" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-zinc-900">Payment Confirmed!</h2>
                  <p className="text-sm text-zinc-600 mt-1">
                    Your test shipment has been successfully booked and dispatched.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-zinc-200 text-left space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Order Number</span>
                    <span className="font-mono font-semibold text-zinc-900">{createdOrder.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Tracking Number</span>
                    <span className="font-mono font-semibold text-indigo-600">{createdOrder.trackingId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Payment Reference</span>
                    <span className="font-mono text-zinc-700">{paymentResult.payment?.paymentReference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Amount Paid</span>
                    <span className="font-semibold text-emerald-700">₹{Number(createdOrder.totalAmount).toFixed(2)} INR</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Status</span>
                    <Badge variant="success">PAID &amp; CONFIRMED</Badge>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => handleDownloadDoc('label')}
                  >
                    <Download className="h-4 w-4" /> Thermal Shipping Label (PDF)
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => handleDownloadDoc('invoice')}
                  >
                    <Download className="h-4 w-4" /> Commercial Invoice (PDF)
                  </Button>
                  <Button
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => navigate(`/customer/shipments/${createdOrder.id}`)}
                  >
                    View Shipment Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* STEP 4: FAILURE & RETRY STATE */}
        {currentStep === 'FAILED' && paymentResult && createdOrder && (
          <motion.div
            key="failed-step"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl mx-auto"
          >
            <Card className="border-red-200 bg-red-50/40 text-center p-6">
              <CardContent className="space-y-6 pt-4">
                <div className="h-16 w-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                  <XCircle className="h-10 w-10" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-zinc-900">Payment Simulation Failed</h2>
                  <p className="text-sm text-red-600 mt-1">
                    {paymentResult.message || 'The test payment could not be processed.'}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-zinc-200 text-left space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Order Number</span>
                    <span className="font-mono font-semibold text-zinc-900">{createdOrder.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Failure Reason</span>
                    <span className="font-semibold text-red-600">
                      {paymentResult.payment?.failureCode || 'DECLINED'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Order Status</span>
                    <Badge variant="danger">PAYMENT FAILED</Badge>
                  </div>
                </div>

                <div className="flex gap-3 justify-center pt-2">
                  <Button
                    className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                    onClick={() => {
                      setIdempotencyKey(crypto.randomUUID()); // fresh key for retry
                      setCurrentStep('CHECKOUT');
                    }}
                  >
                    <RotateCcw className="h-4 w-4" /> Retry Test Payment
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep('QUOTE')}
                  >
                    Edit Order
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
