const { verifyAccessToken } = require('@shiptrack/common');

function buildContext({ req }) {
  const header = req.headers.authorization;
  let user = null;
  if (header && header.startsWith('Bearer ')) {
    try {
      user = verifyAccessToken(header.slice('Bearer '.length));
    } catch (err) {
      user = null; // invalid/expired token - resolvers that require auth will reject
    }
  }
  return { user, token: header || null, correlationId: req.correlationId };
}

module.exports = { buildContext };
