const recordEventSchema = {
  type: 'object',
  required: ['status'],
  additionalProperties: false,
  properties: {
    status: {
      type: 'string',
      enum: ['CREATED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
    },
    location: { type: 'string', maxLength: 120 },
    note: { type: 'string', maxLength: 300 },
  },
};

module.exports = { recordEventSchema };
