const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@as-integrations/express4');
const {
  correlationId,
  createLogger,
  requestLogger,
  errorHandler,
  notFoundHandler,
  rateLimiter,
} = require('@shiptrack/common');
const { typeDefs } = require('./schema/typeDefs');
const { resolvers } = require('./schema/resolvers');
const { buildContext } = require('./context');

const SERVICE_NAME = 'graphql-service';

async function buildApp() {
  const app = express();
  const logger = createLogger(SERVICE_NAME);

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(correlationId);
  app.use(requestLogger(logger));
  app.use(rateLimiter({ windowMs: 60_000, max: 300 }));

  app.get(['/health', '/healthz'], (req, res) => {
    res.json({ status: 'UP', service: SERVICE_NAME, timestamp: new Date().toISOString() });
  });

  const apollo = new ApolloServer({ typeDefs, resolvers });
  await apollo.start();

  app.use('/graphql', cors(), express.json(), expressMiddleware(apollo, { context: buildContext }));

  app.use(notFoundHandler);
  app.use(errorHandler(SERVICE_NAME));
  return app;
}

module.exports = { buildApp, SERVICE_NAME };
