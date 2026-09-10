require('dotenv').config();
const { buildApp, SERVICE_NAME } = require('./app');
const { assertProductionConfig } = require('@shiptrack/common');

const PORT = process.env.PORT || 8010;

assertProductionConfig({ requireSmtp: true });
const app = buildApp();
app.listen(PORT, () => {
  console.log(`[${SERVICE_NAME}] listening on port ${PORT}`);
});
