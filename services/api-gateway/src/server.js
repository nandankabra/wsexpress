require('dotenv').config();
const { buildApp, SERVICE_NAME } = require('./app');
const { startKeepAlive } = require('./keepAlive');

const PORT = process.env.PORT || 8000;

const app = buildApp();
app.listen(PORT, () => {
  console.log(`[${SERVICE_NAME}] listening on port ${PORT}`);
  startKeepAlive();
});
