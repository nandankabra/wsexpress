const path = require('path');
const { createBaseApp, errorHandler, notFoundHandler, rateLimiter, swaggerDocs } = require('@shiptrack/common');
const shipmentRoutes = require('./routes/shipmentRoutes');

const SERVICE_NAME = 'shipment-service';

function buildApp() {
  const { app } = createBaseApp(SERVICE_NAME);

  app.use(rateLimiter({ windowMs: 60_000, max: 300 }));
  swaggerDocs(app, path.join(__dirname, '..', 'openapi.yaml'));

  const paymentRoutes = require('./routes/paymentRoutes');

  app.use('/api/v1/shipments', shipmentRoutes);
  app.use('/api/v1/payments', paymentRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler(SERVICE_NAME));
  return app;
}

module.exports = { buildApp, SERVICE_NAME };
