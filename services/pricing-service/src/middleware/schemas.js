const quoteSchema = {
  type: 'object',
  required: ['originCountry', 'destinationCountry', 'weightKg'],
  additionalProperties: false,
  properties: {
    originCountry: { type: 'string', minLength: 2, maxLength: 2 },
    destinationCountry: { type: 'string', minLength: 2, maxLength: 2 },
    weightKg: { type: 'number', minimum: 0.01, maximum: 1000 },
    packageType: { type: 'string', enum: ['PARCEL', 'DOCUMENT', 'PALLET', 'FREIGHT'] },
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
