const path = require('path');
const { createBaseApp, errorHandler, notFoundHandler, rateLimiter, swaggerDocs } = require('@shiptrack/common');
const pricingRoutes = require('./routes/pricingRoutes');

const SERVICE_NAME = 'pricing-service';

function buildApp() {
  const { app } = createBaseApp(SERVICE_NAME);

  app.use(rateLimiter({ windowMs: 60_000, max: 10000 }));
  swaggerDocs(app, path.join(__dirname, '..', 'openapi.yaml'));

  // URL normalization: rewrite accidentally doubled /api/v1/api/v1/* to /api/v1/*
  app.use((req, res, next) => {
    if (req.url.startsWith('/api/v1/api/v1/')) {
      req.url = req.url.replace('/api/v1/api/v1/', '/api/v1/');
    }
    next();
  });

  app.use('/api/v1/pricing', pricingRoutes);
  app.use('/api/v1/api/v1/pricing', pricingRoutes);
  app.use('/pricing', pricingRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler(SERVICE_NAME));
  return app;
}

module.exports = { buildApp, SERVICE_NAME };
