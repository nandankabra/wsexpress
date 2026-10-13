/**
 * Path -> upstream service map. Order matters for prefixes that could otherwise overlap;
 * these are all distinct top-level resource prefixes so declaration order is not load-bearing
 * here, but new routes should still be added most-specific-first as a habit.
 */
function buildRouteTable() {
  return [
    { path: '/api/v1/auth', target: process.env.AUTH_SERVICE_URL },
    { path: '/api/v1/customers', target: process.env.USER_SERVICE_URL },
    { path: '/api/v1/carriers', target: process.env.CARRIER_SERVICE_URL },
    { path: '/api/v1/shipments', target: process.env.SHIPMENT_SERVICE_URL },
    { path: '/api/v1/payments', target: process.env.PAYMENT_SERVICE_URL || process.env.SHIPMENT_SERVICE_URL },
    { path: '/api/v1/tracking', target: process.env.TRACKING_SERVICE_URL },
    { path: '/api/v1/pricing', target: process.env.PRICING_SERVICE_URL },
    { path: '/api/v1/locations', target: process.env.LOCATION_SERVICE_URL },
    { path: '/api/v1/crm', target: process.env.CRM_SERVICE_URL },
    { path: '/api/v1/audit', target: process.env.AUDIT_SERVICE_URL },
    { path: '/api/v1/notifications', target: process.env.NOTIFICATION_SERVICE_URL },
    { path: '/graphql', target: process.env.GRAPHQL_SERVICE_URL },
  ];
}

module.exports = { buildRouteTable };
