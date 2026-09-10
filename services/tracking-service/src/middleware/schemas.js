const recordEventSchema = {
  type: 'object',
  required: ['status'],
  properties: {
    status: { type: 'string', enum: ['CREATED', 'ASSIGNED', 'PICKED_UP', 'ARRIVED_AT_HUB', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'] },
    location: { type: 'string' },
    lat: { type: 'number' },
    lng: { type: 'number' },
    note: { type: 'string' },
    hubId: { type: 'string' },
    scannerId: { type: 'string' },
    barcodeData: { type: 'string' }
  },
};

module.exports = { recordEventSchema };
