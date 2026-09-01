const createCountrySchema = {
  type: 'object',
  required: ['code', 'name', 'capital', 'currency'],
  additionalProperties: false,
  properties: {
    code: { type: 'string', minLength: 2, maxLength: 2 },
    name: { type: 'string', minLength: 1, maxLength: 100 },
    capital: { type: 'string', minLength: 1, maxLength: 100 },
    currency: { type: 'string', minLength: 3, maxLength: 3 },
  },
};

const createCitySchema = {
  type: 'object',
  required: ['name', 'countryCode'],
  additionalProperties: false,
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 100 },
    countryCode: { type: 'string', minLength: 2, maxLength: 2 },
  },
};

const createWarehouseSchema = {
  type: 'object',
  required: ['name', 'city', 'countryCode', 'address'],
  additionalProperties: false,
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 120 },
    city: { type: 'string', minLength: 1, maxLength: 100 },
    countryCode: { type: 'string', minLength: 2, maxLength: 2 },
    address: { type: 'string', minLength: 1, maxLength: 200 },
  },
};

const createRouteSchema = {
  type: 'object',
  required: ['originCountry', 'destinationCountry', 'transitDays'],
  additionalProperties: false,
  properties: {
    originCountry: { type: 'string', minLength: 2, maxLength: 2 },
    destinationCountry: { type: 'string', minLength: 2, maxLength: 2 },
    transitDays: { type: 'integer', minimum: 1, maximum: 90 },
  },
};

module.exports = { createCountrySchema, createCitySchema, createWarehouseSchema, createRouteSchema };
