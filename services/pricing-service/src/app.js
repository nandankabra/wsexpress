const path = require('path');
const { createBaseApp, errorHandler, notFoundHandler, rateLimiter, swaggerDocs } = require('@shiptrack/common');
const pricingRoutes = require('./routes/pricingRoutes');

const SERVICE_NAME = 'pricing-service';

function buildApp() {
  const { app } = createBaseApp(SERVICE_NAME);

  app.use(rateLimiter({ windowMs: 60_000, max: 300 }));
  swaggerDocs(app, path.join(__dirname, '..', 'openapi.yaml'));

  app.use('/api/v1/pricing', pricingRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler(SERVICE_NAME));
  return app;
}

module.exports = { buildApp, SERVICE_NAME };
