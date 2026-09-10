const upsertCarrierSchema = {
  type: 'object',
  required: ['companyName', 'contactEmail'],
  additionalProperties: false,
  properties: {
    companyName: { type: 'string', minLength: 2, maxLength: 160 },
    contactEmail: { type: 'string', format: 'email' },
    contactPhone: { type: 'string', maxLength: 30 },
    vehicleType: { type: 'string', maxLength: 60 },
    licenseNumber: { type: 'string', maxLength: 60 },
    serviceAreas: { type: 'string' },
  },
};

const verifySchema = {
  type: 'object',
  required: ['isVerified'],
  additionalProperties: false,
  properties: {
    isVerified: { type: 'boolean' },
  },
};

const adminCreateSchema = {
  type: 'object',
  required: ['userId', 'companyName', 'contactEmail'],
  additionalProperties: false,
  properties: {
    userId: { type: 'string', format: 'uuid' },
    companyName: { type: 'string', minLength: 2, maxLength: 160 },
    contactEmail: { type: 'string', format: 'email' },
    contactPhone: { type: 'string', maxLength: 30 },
    vehicleType: { type: 'string', maxLength: 60 },
    licenseNumber: { type: 'string', maxLength: 60 },
    serviceAreas: { type: 'string' },
  },
};

module.exports = { upsertCarrierSchema, verifySchema, adminCreateSchema };
