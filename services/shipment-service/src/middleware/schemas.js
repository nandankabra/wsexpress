const addressSchema = {
  type: 'object',
  required: ['address', 'city', 'country'],
  properties: {
    address: { type: 'string', minLength: 3, maxLength: 200 },
    city: { type: 'string', minLength: 1, maxLength: 80 },
    country: { type: 'string', minLength: 2, maxLength: 80 },
  },
};

const quoteSchema = {
  type: 'object',
  required: ['origin', 'destination', 'weightKg'],
  properties: {
    origin: addressSchema,
    destination: addressSchema,
    weightKg: { type: 'number', minimum: 0.01, maximum: 1000 },
    packageType: { type: 'string', enum: ['PARCEL', 'DOCUMENT', 'PALLET', 'FREIGHT'] },
    currency: { type: 'string', minLength: 3, maxLength: 3 },
  },
};

const createShipmentSchema = quoteSchema;

const updateStatusSchema = {
  type: 'object',
  required: ['status', 'expectedVersion'],
  additionalProperties: false,
  properties: {
    status: { type: 'string', enum: ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'] },
    expectedVersion: { type: 'integer', minimum: 1 },
  },
};

const assignCarrierSchema = {
  type: 'object',
  required: ['carrierId', 'expectedVersion'],
  additionalProperties: false,
  properties: {
    carrierId: { type: 'string', minLength: 1 },
    expectedVersion: { type: 'integer', minimum: 1 },
  },
};

const updateDeliverySchema = {
  type: 'object',
  required: ['expectedVersion'],
  additionalProperties: false,
  properties: {
    actualDeliveryDate: { type: 'string', format: 'date' },
    deliveryNotes: { type: 'string', maxLength: 500 },
    expectedVersion: { type: 'integer', minimum: 1 },
  },
};

module.exports = {
  quoteSchema,
  createShipmentSchema,
  updateStatusSchema,
  assignCarrierSchema,
  updateDeliverySchema,
};
