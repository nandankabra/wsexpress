require('dotenv').config();
const { buildApp, SERVICE_NAME } = require('./app');

const PORT = process.env.PORT || 8011;

buildApp()
  .then((app) => {
    app.listen(PORT, () => {
      console.log(`[${SERVICE_NAME}] listening on port ${PORT}`);
      console.log(`[${SERVICE_NAME}] GraphQL endpoint at http://localhost:${PORT}/graphql`);
    });
  })
  .catch((err) => {
    console.error(`[${SERVICE_NAME}] failed to start`, err);
    process.exit(1);
  });
