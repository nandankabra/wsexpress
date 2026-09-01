const { paginate, decodeCursor } = require('@shiptrack/common');
const auditLogModel = require('../models/auditLogModel');

function toResponse(doc) {
  return {
    id: String(doc._id),
    action: doc.action,
    actorId: doc.actorId || null,
    actorRole: doc.actorRole || null,
    service: doc.service,
    method: doc.method || null,
    path: doc.path || null,
    statusCode: doc.statusCode || null,
    ipAddress: doc.ipAddress || null,
    correlationId: doc.correlationId || null,
    severity: doc.severity,
    metadata: doc.metadata || {},
    timestamp: doc.timestamp,
  };
}

async function recordLog(data) {
  const doc = await auditLogModel.create(data);
  return toResponse(doc);
}

async function listLogs({ cursor, limit = 20, severity, actorId }) {
  const after = decodeCursor(cursor);
  const docs = await auditLogModel.listPage({ limit, afterId: after ? after.id : null, severity, actorId });
  const result = paginate(docs, limit, (doc) => ({ id: String(doc._id) }));
  return { data: result.data.map(toResponse), pagination: result.pagination };
}

module.exports = { recordLog, listLogs, toResponse };
