require('dotenv').config();
const { buildApp, SERVICE_NAME } = require('./app');
const { migrate } = require('./db/migrate');

const PORT = process.env.PORT || 8004;

async function start() {
  await migrate();
  const app = buildApp();
  app.listen(PORT, () => {
    console.log(`[${SERVICE_NAME}] listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error(`[${SERVICE_NAME}] failed to start`, err);
  process.exit(1);
});
