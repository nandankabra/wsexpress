const upsertProfileSchema = {
  type: 'object',
  required: ['fullName', 'email'],
  additionalProperties: false,
  properties: {
    fullName: { type: 'string', minLength: 2, maxLength: 120 },
    email: { type: 'string', format: 'email' },
    phone: { type: 'string', maxLength: 30 },
    addressLine1: { type: 'string', maxLength: 160 },
    addressLine2: { type: 'string', maxLength: 160 },
    city: { type: 'string', maxLength: 80 },
    state: { type: 'string', maxLength: 80 },
    postalCode: { type: 'string', maxLength: 20 },
    country: { type: 'string', maxLength: 80 },
  },
};

module.exports = { upsertProfileSchema };
