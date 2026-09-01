const { createServiceClient } = require('@shiptrack/common');

const client = createServiceClient({
  baseURL: process.env.USER_SERVICE_URL,
  name: 'user-service',
  // A customer without a saved profile yet is a normal state for a fresh dashboard, not a
  // failure - degrade to null rather than erroring out the whole dashboard query.
  fallback: () => null,
});

function getMe(token, correlationId) {
  return client.get('/api/v1/customers/me', correlationId, { headers: { Authorization: token } });
}

module.exports = { getMe };
