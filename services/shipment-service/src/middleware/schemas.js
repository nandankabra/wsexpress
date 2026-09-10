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
    weightKg: { type: 'number', minimum: 0.1 },
    dimensionsCm: {
      type: 'object',
      properties: {
        length: { type: 'number', minimum: 1 },
        width: { type: 'number', minimum: 1 },
        height: { type: 'number', minimum: 1 }
      },
      required: ['length', 'width', 'height']
    },
    packageType: { type: 'string', minLength: 1 },
    serviceType: { type: 'string', enum: ['STANDARD', 'EXPRESS'] },
    currency: { type: 'string', minLength: 3, maxLength: 3 },
  },
};

const createShipmentSchema = {
  type: 'object',
  required: ['origin', 'destination', 'weightKg'],
  properties: {
    origin: addressSchema,
    destination: addressSchema,
    weightKg: { type: 'number', minimum: 0.1 },
    dimensionsCm: {
      type: 'object',
      properties: {
        length: { type: 'number', minimum: 1 },
        width: { type: 'number', minimum: 1 },
        height: { type: 'number', minimum: 1 }
      },
      required: ['length', 'width', 'height']
    },
    packageType: { type: 'string', minLength: 1 },
    serviceType: { type: 'string', enum: ['STANDARD', 'EXPRESS'] },
    currency: { type: 'string', minLength: 3, maxLength: 3 },
    estimatedDeliveryDate: { type: 'string', format: 'date' },
    quotedPrice: { type: 'number', minimum: 0 },
    baseFare: { type: 'number', minimum: 0 },
    distanceCharge: { type: 'number', minimum: 0 },
    weightCharge: { type: 'number', minimum: 0 },
    taxAmount: { type: 'number', minimum: 0 },
    totalAmount: { type: 'number', minimum: 0 }
  },
};

const updateStatusSchema = {
  type: 'object',
  required: ['status', 'expectedVersion'],
  properties: {
    status: { type: 'string', enum: ['ASSIGNED', 'PICKED_UP', 'ARRIVED_AT_HUB', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'] },
    expectedVersion: { type: 'integer', minimum: 1 },
    hubId: { type: 'string' },
    note: { type: 'string' },
    lat: { type: 'number' },
    lng: { type: 'number' }
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
