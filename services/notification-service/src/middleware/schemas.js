const sendNotificationSchema = {
  type: 'object',
  required: ['to'],
  additionalProperties: false,
  properties: {
    to: { type: 'string', format: 'email' },
    type: { type: 'string', enum: ['WELCOME', 'SHIPMENT_CREATED', 'SHIPMENT_UPDATE', 'DELIVERY', 'GENERIC', 'EMAIL_VERIFICATION', 'PASSWORD_RESET'] },
    subject: { type: 'string', maxLength: 150 },
    message: { type: 'string', maxLength: 2000 },
    data: { type: 'object' },
  },
};

module.exports = { sendNotificationSchema };
