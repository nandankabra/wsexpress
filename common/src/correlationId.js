const { v4: uuidv4 } = require('uuid');

const HEADER = 'x-correlation-id';

function correlationId(req, res, next) {
  const incoming = req.headers[HEADER];
  const id = incoming && String(incoming).trim() ? String(incoming).trim() : uuidv4();
  req.correlationId = id;
  res.setHeader('X-Correlation-Id', id);
  next();
}

module.exports = { correlationId, CORRELATION_HEADER: HEADER };
