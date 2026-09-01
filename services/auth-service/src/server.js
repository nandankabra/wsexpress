require('dotenv').config();
const { buildApp, SERVICE_NAME } = require('./app');
const { migrate } = require('./db/migrate');
const { seedAdmin } = require('./db/seed');

const PORT = process.env.PORT || 8001;

async function start() {
  await migrate();
  await seedAdmin();
  const app = buildApp();
  app.listen(PORT, () => {
    console.log(`[${SERVICE_NAME}] listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error(`[${SERVICE_NAME}] failed to start`, err);
  process.exit(1);
});
