const { GraphQLError } = require('graphql');
const shipmentClient = require('../clients/shipmentClient');
const trackingClient = require('../clients/trackingClient');
const userClient = require('../clients/userClient');

function requireAuth(context) {
  if (!context.user) {
    throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });
  }
  return context.user;
}

function requireRole(context, role) {
  const user = requireAuth(context);
  if (user.role !== role) {
    throw new GraphQLError(`Requires role: ${role}`, { extensions: { code: 'FORBIDDEN' } });
  }
  return user;
}

const resolvers = {
  Query: {
    shipment: async (_parent, { id }, context) => {
      requireAuth(context);
      return shipmentClient.getById(id, context.token, context.correlationId);
    },

    trackShipment: async (_parent, { trackingId }, context) => {
      return shipmentClient.trackPublic(trackingId, context.correlationId);
    },

    trackingEvents: async (_parent, { trackingId, limit }, context) => {
      const result = await trackingClient.listEvents(trackingId, { limit: limit || 20 }, context.correlationId);
      return result.data;
    },

    myShipments: async (_parent, { limit, cursor }, context) => {
      requireRole(context, 'CUSTOMER');
      return shipmentClient.listMine(context.token, { limit: limit || 20, cursor }, context.correlationId);
    },

    myDashboard: async (_parent, _args, context) => {
      requireRole(context, 'CUSTOMER');
      const [profile, shipmentsPage] = await Promise.all([
        userClient.getMe(context.token, context.correlationId),
        shipmentClient.listMine(context.token, { limit: 5 }, context.correlationId),
      ]);
      return { profile, recentShipments: shipmentsPage.data };
    },
  },
};

module.exports = { resolvers };
