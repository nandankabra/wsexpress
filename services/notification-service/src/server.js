require('dotenv').config();
const { buildApp, SERVICE_NAME } = require('./app');

const PORT = process.env.PORT || 8010;

const app = buildApp();
app.listen(PORT, () => {
  console.log(`[${SERVICE_NAME}] listening on port ${PORT}`);
});
