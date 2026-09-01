require('dotenv').config();
const { buildApp, SERVICE_NAME } = require('./app');
const { connect } = require('./db/connection');

const PORT = process.env.PORT || 8005;

async function start() {
  await connect();
  const app = buildApp();
  app.listen(PORT, () => {
    console.log(`[${SERVICE_NAME}] listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error(`[${SERVICE_NAME}] failed to start`, err);
  process.exit(1);
});
