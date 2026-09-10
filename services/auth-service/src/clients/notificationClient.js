const { createServiceClient } = require('@shiptrack/common');

const notificationClient = createServiceClient({
  baseURL: process.env.NOTIFICATION_SERVICE_URL,
  name: 'notification-service',
  fallback: (err) => { console.error('Notification Service Error:', err.message); return null; },
});

function sendNotification(payload, correlationId) {
  return notificationClient.post('/api/v1/notifications/send', payload, correlationId);
}

module.exports = { sendNotification };
