require('dotenv').config();
const { buildApp, SERVICE_NAME } = require('./app');
const { migrate } = require('./db/migrate');
const { mountCurrencySoapService } = require('./soap');

const PORT = process.env.PORT || 8006;

async function start() {
  await migrate();
  const app = buildApp();
  const httpServer = app.listen(PORT, () => {
    console.log(`[${SERVICE_NAME}] listening on port ${PORT}`);
    console.log(`[${SERVICE_NAME}] SOAP WSDL at http://localhost:${PORT}/wsdl/currency?wsdl`);
  });
  mountCurrencySoapService(httpServer);
}

start().catch((err) => {
  console.error(`[${SERVICE_NAME}] failed to start`, err);
  process.exit(1);
});
