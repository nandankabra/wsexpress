const { SEVERITIES } = require('../models/severities');

const recordLogSchema = {
  type: 'object',
  required: ['action', 'service'],
  additionalProperties: false,
  properties: {
    action: { type: 'string', minLength: 1, maxLength: 100 },
    actorId: { type: 'string' },
    actorRole: { type: 'string' },
    service: { type: 'string', minLength: 1, maxLength: 60 },
    method: { type: 'string' },
    path: { type: 'string' },
    statusCode: { type: 'integer' },
    ipAddress: { type: 'string' },
    correlationId: { type: 'string' },
    severity: { type: 'string', enum: SEVERITIES },
    metadata: { type: 'object' },
  },
};

module.exports = { recordLogSchema };
