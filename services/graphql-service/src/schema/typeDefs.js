const typeDefs = `#graphql
  type Address {
    address: String
    city: String
    country: String
  }

  type Shipment {
    id: ID!
    trackingId: String!
    customerId: String
    carrierId: String
    origin: Address
    destination: Address
    weightKg: Float
    packageType: String
    status: String
    quotedPrice: Float
    currency: String
    estimatedDeliveryDate: String
    actualDeliveryDate: String
    version: Int
    createdAt: String
    updatedAt: String
  }

  type PublicTracking {
    trackingId: String!
    status: String!
    originCity: String
    originCountry: String
    destinationCity: String
    destinationCountry: String
    estimatedDeliveryDate: String
    actualDeliveryDate: String
    updatedAt: String
  }

  type TrackingEvent {
    id: ID!
    trackingId: String!
    status: String!
    location: String
    note: String
    recordedBy: String
    timestamp: String
  }

  type CustomerProfile {
    userId: ID!
    fullName: String
    email: String
    phone: String
    city: String
    country: String
  }

  type Pagination {
    limit: Int!
    hasMore: Boolean!
    nextCursor: String
  }

  type ShipmentPage {
    data: [Shipment!]!
    pagination: Pagination!
  }

  type CustomerDashboard {
    profile: CustomerProfile
    recentShipments: [Shipment!]!
  }

  type Query {
    "Get a shipment by id (requires authentication; ownership enforced by shipment-service)"
    shipment(id: ID!): Shipment

    "Public tracking lookup, no authentication required"
    trackShipment(trackingId: String!): PublicTracking

    "Public tracking event history for a tracking id"
    trackingEvents(trackingId: String!, limit: Int): [TrackingEvent!]!

    "The authenticated customer's own shipments, cursor-paginated"
    myShipments(limit: Int, cursor: String): ShipmentPage

    "Aggregated dashboard: profile + recent shipments for the authenticated customer"
    myDashboard: CustomerDashboard
  }
`;

module.exports = { typeDefs };
