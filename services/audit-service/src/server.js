require('dotenv').config();
const { buildApp, SERVICE_NAME } = require('./app');
const { connect } = require('./db/connection');

const PORT = process.env.PORT || 8009;

async function start() {
  const app = buildApp();
  app.listen(PORT, () => {
    console.log(`[${SERVICE_NAME}] listening on port ${PORT}`);
  });
  await connect();
}

start().catch((err) => {
  console.error(`[${SERVICE_NAME}] failed to start`, err);
  process.exit(1);
});
