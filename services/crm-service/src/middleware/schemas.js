const { EVENT_TYPES } = require('../models/eventTypes');

const recordEventSchema = {
  type: 'object',
  required: ['eventType', 'entityId'],
  additionalProperties: false,
  properties: {
    eventType: { type: 'string', enum: EVENT_TYPES },
    entityId: { type: 'string', minLength: 1 },
    customerId: { type: 'string' },
    carrierId: { type: 'string' },
    metadata: { type: 'object' },
  },
};

module.exports = { recordEventSchema };
