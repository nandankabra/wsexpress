const quoteSchema = {
  type: 'object',
  required: ['originCountry', 'destinationCountry', 'weightKg'],
  properties: {
    originCountry: { type: 'string', minLength: 2, maxLength: 2 },
    destinationCountry: { type: 'string', minLength: 2, maxLength: 2 },
    originCity: { type: 'string' },
    destinationCity: { type: 'string' },
    weightKg: { type: 'number', minimum: 0.1 },
    dimensionsCm: {
      type: 'object',
      properties: {
        length: { type: 'number', minimum: 1 },
        width: { type: 'number', minimum: 1 },
        height: { type: 'number', minimum: 1 }
      }
    },
    packageType: { type: 'string' },
    serviceType: { type: 'string', enum: ['STANDARD', 'EXPRESS'] },
    currency: { type: 'string', minLength: 3, maxLength: 3 },
  },
};

const convertSchema = {
  type: 'object',
  required: ['amount', 'fromCurrency', 'toCurrency'],
  additionalProperties: false,
  properties: {
    amount: { type: 'number', minimum: 0 },
    fromCurrency: { type: 'string', minLength: 3, maxLength: 3 },
    toCurrency: { type: 'string', minLength: 3, maxLength: 3 },
  },
};

const upsertRuleSchema = {
  type: 'object',
  required: ['packageType', 'baseRate', 'perKgRate'],
  additionalProperties: false,
  properties: {
    packageType: { type: 'string', enum: ['PARCEL', 'DOCUMENT', 'PALLET', 'FREIGHT'] },
    baseRate: { type: 'number', minimum: 0 },
    perKgRate: { type: 'number', minimum: 0 },
    internationalMultiplier: { type: 'number', minimum: 1 },
  },
};

module.exports = { quoteSchema, convertSchema, upsertRuleSchema };
