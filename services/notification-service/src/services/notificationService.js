const { sendMail } = require('./mailer');

const MAX_HISTORY = 200;
const history = []; // bounded in-memory log for admin visibility (no DB assigned to this service)

const TEMPLATES = {
  WELCOME: (data) => ({
    subject: 'Welcome to ShipTrack',
    text: `Hi ${data.name || 'there'}, your ShipTrack account is ready.`,
  }),
  SHIPMENT_CREATED: (data) => ({
    subject: `Shipment ${data.trackingId} created`,
    text: `Your shipment ${data.trackingId} has been created and is being prepared for pickup.`,
  }),
  SHIPMENT_UPDATE: (data) => ({
    subject: `Shipment ${data.trackingId} status: ${data.status}`,
    text: `Your shipment ${data.trackingId} is now ${data.status}.`,
  }),
  DELIVERY: (data) => ({
    subject: `Shipment ${data.trackingId} delivered`,
    text: `Your shipment ${data.trackingId} has been delivered. Thanks for using ShipTrack!`,
  }),
  EMAIL_VERIFICATION: (data) => ({
    subject: 'Verify your ShipTrack Email',
    text: `Hi ${data.name}, your 6-digit email verification code is: ${data.otp}`,
  }),
  PASSWORD_RESET: (data) => ({
    subject: 'Reset your ShipTrack Password',
    text: `Hi ${data.name}, you requested a password reset. Your 6-digit reset code is: ${data.otp}`,
  }),
};

function render({ type, subject, message, data = {} }) {
  if (type && TEMPLATES[type]) {
    const templated = TEMPLATES[type](data);
    return { subject: subject || templated.subject, text: message || templated.text };
  }
  return { subject, text: message };
}

async function sendNotification(body) {
  const { subject, text } = render(body);
  const info = await sendMail({ to: body.to, subject, text });

  const entry = {
    id: info.messageId || `${Date.now()}`,
    to: body.to,
    type: body.type || 'GENERIC',
    subject,
    sentAt: new Date().toISOString(),
  };
  history.unshift(entry);
  if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;

  return entry;
}

function listHistory(limit = 20) {
  return history.slice(0, limit);
}

module.exports = { sendNotification, listHistory };
