import { useState, useEffect } from 'react';
import { listAdminOrders, adminOrderAction, downloadLabel, downloadInvoice } from '../../api/shipments';
import { listCarriers } from '../../api/carriers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  Package,
  Search,
  RefreshCw,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  Truck,
  CreditCard,
  Download,
  AlertCircle,
  Eye,
  SlidersHorizontal,
  DollarSign,
  Clock,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_CARRIERS = [
  { userId: '5a9afb33-c8f8-4144-b65f-10e55377301c', companyName: 'ShipTrack Express Logistics', contactEmail: 'carrier@shiptrack.com' },
  { userId: '93a59c0d-0753-4018-b7f0-cb3428a5fa07', companyName: 'Pacific Express Cargo', contactEmail: 'carrier_1789030540292@shiptrack.com' },
  { userId: '67b15f79-1aa8-4c6d-b611-2581592db0fe', companyName: 'Rahul Express Logistics', contactEmail: 'rahul@gmail.com' },
];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [carriers, setCarriers] = useState(DEFAULT_CARRIERS);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination State
  const [search, setSearch] = useState('');
  const [orderStatus, setOrderStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [shipmentStatus, setShipmentStatus] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [sortBy, setSortBy] = useState('created_desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selected Order for Inspection Drawer / Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedCarrierId, setSelectedCarrierId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    listCarriers({ limit: 50 }).then((r) => {
      const list = Array.isArray(r) ? r : (r?.data || []);
      if (list && list.length > 0) {
        setCarriers(list);
      }
    }).catch(() => {
      // Fallback already pre-populated with verified carriers
    });
  }, []);

  function fetchOrders() {
    setLoading(true);
    const params = {
      page,
      limit: 15,
      sortBy,
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(orderStatus ? { orderStatus } : {}),
      ...(paymentStatus ? { paymentStatus } : {}),
      ...(shipmentStatus ? { shipmentStatus } : {}),
      ...(serviceType ? { serviceType } : {}),
    };

    listAdminOrders(params)
      .then((res) => {
        setOrders(res.data || []);
        setSummary(res.summary || null);
        setTotalPages(res.pagination?.totalPages || 1);
        setTotalCount(res.pagination?.total || 0);
      })
      .catch(() => toast.error('Failed to query orders'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchOrders();
  }, [page, sortBy, orderStatus, paymentStatus, shipmentStatus, serviceType]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  }

  function handleResetFilters() {
    setSearch('');
    setOrderStatus('');
    setPaymentStatus('');
    setShipmentStatus('');
    setServiceType('');
    setSortBy('created_desc');
    setPage(1);
  }

  async function handleAdminAction(action, payload = {}) {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      const updated = await adminOrderAction(selectedOrder.id, action, payload);
      toast.success(`Action ${action} executed successfully!`);
      setSelectedOrder(updated);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || `Failed to perform ${action}`);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDownloadDoc(type, orderId, trackingId) {
    try {
      const blob = type === 'label' ? await downloadLabel(orderId) : await downloadInvoice(orderId);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}-${trackingId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      toast.error(`Failed to download ${type}`);
    }
  }

  const getPaymentBadge = (status) => {
    if (status === 'PAID') return <Badge variant="success">PAID</Badge>;
    if (status === 'FAILED') return <Badge variant="danger">FAILED</Badge>;
    if (status === 'REFUNDED') return <Badge variant="warning">REFUNDED</Badge>;
    return <Badge variant="warning">AWAITING PAYMENT</Badge>;
  };

  const getShipmentBadge = (status) => {
    if (status === 'DELIVERED') return <Badge variant="success">DELIVERED</Badge>;
    if (status === 'CANCELLED') return <Badge variant="danger">CANCELLED</Badge>;
    if (['IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(status)) return <Badge variant="primary">{status.replace(/_/g, ' ')}</Badge>;
    if (status === 'ASSIGNED') return <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">ASSIGNED</Badge>;
    return <Badge variant="secondary">{status || 'CREATED'}</Badge>;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Admin Order &amp; Dispatch Management</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Real-time multi-tenant order lifecycle, server-side filtering &amp; payment state reconciliation.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders} disabled={loading} className="gap-2">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {/* KPI Overview Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="p-4 border-zinc-200">
            <p className="text-xs font-medium text-zinc-500">Total Orders</p>
            <p className="text-2xl font-bold text-zinc-900 mt-1">{summary.totalOrders}</p>
          </Card>
          <Card className="p-4 border-amber-200 bg-amber-50/30">
            <p className="text-xs font-medium text-amber-700">Awaiting Payment</p>
            <p className="text-2xl font-bold text-amber-800 mt-1">{summary.awaitingPayment}</p>
          </Card>
          <Card className="p-4 border-emerald-200 bg-emerald-50/30">
            <p className="text-xs font-medium text-emerald-700">Paid Orders</p>
            <p className="text-2xl font-bold text-emerald-800 mt-1">{summary.paidOrders}</p>
          </Card>
          <Card className="p-4 border-indigo-200 bg-indigo-50/30">
            <p className="text-xs font-medium text-indigo-700">In-Transit Freight</p>
            <p className="text-2xl font-bold text-indigo-800 mt-1">{summary.inTransitOrders}</p>
          </Card>
          <Card className="p-4 border-zinc-200">
            <p className="text-xs font-medium text-zinc-500">Delivered</p>
            <p className="text-2xl font-bold text-zinc-900 mt-1">{summary.deliveredOrders}</p>
          </Card>
          <Card className="p-4 border-zinc-200">
            <p className="text-xs font-medium text-zinc-500">Total Revenue</p>
            <p className="text-2xl font-bold text-zinc-900 mt-1">₹{Number(summary.totalRevenue).toFixed(0)}</p>
          </Card>
        </div>
      )}

      {/* Search & Filter Controls Toolbar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search by Order #, Tracking ID, City, or Consignee..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <Button type="submit" size="sm" className="h-9 gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white">
              <Search className="h-3.5 w-3.5" /> Search
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleResetFilters} className="h-9">
              Reset
            </Button>
          </form>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 border-t border-zinc-100 text-xs">
            <Select value={orderStatus} onChange={(e) => { setOrderStatus(e.target.value); setPage(1); }} className="h-8 text-xs">
              <option value="">All Order Statuses</option>
              <option value="PENDING_PAYMENT">Pending Payment</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>

            <Select value={paymentStatus} onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }} className="h-8 text-xs">
              <option value="">All Payment States</option>
              <option value="PAID">Paid</option>
              <option value="AWAITING_PAYMENT">Awaiting Payment</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </Select>

            <Select value={shipmentStatus} onChange={(e) => { setShipmentStatus(e.target.value); setPage(1); }} className="h-8 text-xs">
              <option value="">All Shipment Milestones</option>
              <option value="CREATED">Created</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="PICKED_UP">Picked Up</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>

            <Select value={serviceType} onChange={(e) => { setServiceType(e.target.value); setPage(1); }} className="h-8 text-xs">
              <option value="">All Service Tiers</option>
              <option value="STANDARD">Standard Freight</option>
              <option value="EXPRESS">Express Priority</option>
            </Select>

            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="h-8 text-xs">
              <option value="created_desc">Newest Orders First</option>
              <option value="created_asc">Oldest Orders First</option>
              <option value="price_desc">Highest Price First</option>
              <option value="price_asc">Lowest Price First</option>
              <option value="updated_desc">Recently Updated</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Data Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-zinc-50/80 border-b border-border uppercase text-zinc-500 font-semibold text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Order / Tracking</th>
                  <th className="px-5 py-3.5">Corridor Route</th>
                  <th className="px-5 py-3.5">Parcel Specs</th>
                  <th className="px-5 py-3.5">Amount (INR)</th>
                  <th className="px-5 py-3.5">Payment State</th>
                  <th className="px-5 py-3.5">Shipment State</th>
                  <th className="px-5 py-3.5 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i}>
                      <td className="px-5 py-3.5"><Skeleton className="h-4 w-28" /></td>
                      <td className="px-5 py-3.5"><Skeleton className="h-4 w-36" /></td>
                      <td className="px-5 py-3.5"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-5 py-3.5"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-5 py-3.5"><Skeleton className="h-5 w-20 rounded-full" /></td>
                      <td className="px-5 py-3.5"><Skeleton className="h-5 w-20 rounded-full" /></td>
                      <td className="px-5 py-3.5 text-right"><Skeleton className="h-7 w-14 ml-auto" /></td>
                    </tr>
                  ))
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-xs text-zinc-500">
                      No matching orders found. Adjust search or filters.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-mono font-bold text-zinc-900">{o.orderNumber}</p>
                        <p className="font-mono text-[11px] text-indigo-600 mt-0.5">{o.trackingId}</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">{new Date(o.createdAt).toLocaleString()}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-zinc-900">{o.origin.city} $\rightarrow$ {o.destination.city}</p>
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          {o.distanceKm ? `${o.distanceKm} km` : 'Standard route'}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-zinc-800">{o.weightKg} kg</p>
                        <Badge variant="outline" className="text-[10px] mt-0.5 py-0 px-1 font-normal">
                          {o.serviceType}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-zinc-900">₹{Number(o.totalAmount || o.quotedPrice).toFixed(2)}</p>
                        <p className="text-[10px] text-zinc-400">{o.currency}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        {getPaymentBadge(o.paymentStatus)}
                      </td>
                      <td className="px-5 py-3.5">
                        {getShipmentBadge(o.status)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1 text-xs"
                          onClick={() => setSelectedOrder(o)}
                        >
                          <Eye className="h-3 w-3" /> Inspect
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Toolbar */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-100 text-xs text-zinc-500">
            <span>
              Showing {orders.length} of {totalCount} orders (Page {page} of {totalPages})
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* INSPECTION MODAL / DRAWER FOR ORDER MANAGEMENT */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-zinc-200"
            >
              <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50 rounded-t-xl">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                    <span>Order #{selectedOrder.orderNumber}</span>
                    {getPaymentBadge(selectedOrder.paymentStatus)}
                    {getShipmentBadge(selectedOrder.status)}
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono mt-0.5">Tracking: {selectedOrder.trackingId}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="text-zinc-400 hover:text-zinc-700 text-lg font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-6 text-xs">
                {/* Route & Addresses */}
                <div className="grid grid-cols-2 gap-4 bg-zinc-50 p-3.5 rounded-lg border border-zinc-100">
                  <div>
                    <p className="font-semibold text-zinc-500 uppercase tracking-wider text-[10px]">Origin Pickup</p>
                    <p className="font-medium text-zinc-900 mt-1">{selectedOrder.origin.address}</p>
                    <p className="text-zinc-600">{selectedOrder.origin.city}, {selectedOrder.origin.country}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-500 uppercase tracking-wider text-[10px]">Destination Delivery</p>
                    <p className="font-medium text-zinc-900 mt-1">{selectedOrder.destination.address}</p>
                    <p className="text-zinc-600">{selectedOrder.destination.city}, {selectedOrder.destination.country}</p>
                  </div>
                </div>

                {/* Authoritative Pricing Breakdown */}
                <div>
                  <p className="font-bold text-zinc-900 mb-2 flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-indigo-600" /> Authoritative Pricing Breakdown
                  </p>
                  <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100 space-y-1.5 text-zinc-600">
                    <div className="flex justify-between">
                      <span>Base Handling Fare:</span>
                      <span>₹{Number(selectedOrder.baseFare || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Distance Charge ({selectedOrder.distanceKm || 0} km):</span>
                      <span>₹{Number(selectedOrder.distanceCharge || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Weight Charge ({selectedOrder.weightKg} kg):</span>
                      <span>₹{Number(selectedOrder.weightCharge || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST / Tax (18%):</span>
                      <span>₹{Number(selectedOrder.taxAmount || 0).toFixed(2)}</span>
                    </div>
                    <div className="border-t border-zinc-200 pt-1.5 flex justify-between font-bold text-zinc-900">
                      <span>Total Authoritative Amount:</span>
                      <span>₹{Number(selectedOrder.totalAmount).toFixed(2)} {selectedOrder.currency}</span>
                    </div>
                  </div>
                </div>

                {/* Documents Downloads */}
                <div>
                  <p className="font-bold text-zinc-900 mb-2">Shipping Documents</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => handleDownloadDoc('label', selectedOrder.id, selectedOrder.trackingId)}
                    >
                      <Download className="h-3.5 w-3.5" /> Thermal Label (PDF)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => handleDownloadDoc('invoice', selectedOrder.id, selectedOrder.trackingId)}
                    >
                      <Download className="h-3.5 w-3.5" /> Commercial Invoice (PDF)
                    </Button>
                  </div>
                </div>

                {/* Carrier Assignment */}
                <div className="p-3.5 bg-indigo-50/50 rounded-lg border border-indigo-100 space-y-3">
                  <p className="font-semibold text-indigo-900 flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5" /> Assign Carrier Partner
                  </p>
                  <div className="flex gap-2">
                    <Select
                      value={selectedCarrierId}
                      onChange={(e) => setSelectedCarrierId(e.target.value)}
                      className="h-9 text-xs"
                    >
                      <option value="">Select a Verified Carrier Fleet...</option>
                      {carriers.map((c) => (
                        <option key={c.userId || c.user_id} value={c.userId || c.user_id}>
                          {c.companyName || c.company_name} ({c.contactEmail || c.contact_email})
                        </option>
                      ))}
                    </Select>
                    <Button
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 h-9"
                      disabled={!selectedCarrierId || actionLoading}
                      onClick={() => handleAdminAction('ASSIGN_CARRIER', { carrierId: selectedCarrierId })}
                    >
                      Assign Fleet
                    </Button>
                  </div>
                </div>

                {/* Administrative Lifecycle Actions */}
                <div className="border-t border-zinc-100 pt-4 flex flex-wrap gap-2 justify-between items-center">
                  <div className="flex gap-2">
                    {selectedOrder.orderStatus !== 'CONFIRMED' && (
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        disabled={actionLoading}
                        onClick={() => handleAdminAction('CONFIRM_ORDER')}
                      >
                        Confirm Order
                      </Button>
                    )}
                    {selectedOrder.status !== 'CANCELLED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 border-red-200"
                        disabled={actionLoading}
                        onClick={() => handleAdminAction('CANCEL_ORDER')}
                      >
                        Cancel Order
                      </Button>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
