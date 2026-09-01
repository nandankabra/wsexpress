const path = require('path');
const { createBaseApp, errorHandler, notFoundHandler, rateLimiter, swaggerDocs } = require('@shiptrack/common');
const authRoutes = require('./routes/authRoutes');

const SERVICE_NAME = 'auth-service';

function buildApp() {
  const { app } = createBaseApp(SERVICE_NAME);

  app.use(rateLimiter({ windowMs: 60_000, max: 300 }));
  swaggerDocs(app, path.join(__dirname, '..', 'openapi.yaml'));

  app.use('/api/v1/auth', authRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler(SERVICE_NAME));
  return app;
}

module.exports = { buildApp, SERVICE_NAME };
